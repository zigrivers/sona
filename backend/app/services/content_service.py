"""Content generation service."""

from __future__ import annotations

import asyncio
from typing import Any, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError, ContentNotFoundError
from app.llm.base import LLMProvider
from app.llm.prompts import build_generation_prompt
from app.models.clone import VoiceClone
from app.models.content import Content, ContentVersion
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings
from app.schemas.content import ContentUpdate


class ContentService:
    def __init__(self, session: AsyncSession, provider: LLMProvider) -> None:
        self._session = session
        self._provider = provider

    async def _get_clone(self, clone_id: str) -> VoiceClone:
        """Get clone or raise CloneNotFoundError."""
        result = await self._session.execute(select(VoiceClone).where(VoiceClone.id == clone_id))
        clone = result.scalar_one_or_none()
        if clone is None:
            raise CloneNotFoundError(clone_id)
        return clone

    async def _get_latest_dna(self, clone_id: str) -> VoiceDNAVersion:
        """Get the latest DNA version for a clone, or raise ValueError."""
        result = await self._session.execute(
            select(VoiceDNAVersion)
            .where(VoiceDNAVersion.clone_id == clone_id)
            .order_by(VoiceDNAVersion.version_number.desc())
            .limit(1)
        )
        dna = result.scalar_one_or_none()
        if dna is None:
            msg = "Analyze Voice DNA before generating content"
            raise ValueError(msg)
        return dna

    async def _get_methodology(self) -> str | None:
        """Get the voice cloning instructions methodology, if set."""
        result = await self._session.execute(
            select(MethodologySettings).where(
                MethodologySettings.section_key == "voice_cloning_instructions"
            )
        )
        settings = result.scalar_one_or_none()
        if settings is None:
            return None
        return settings.current_content

    def _build_messages(
        self,
        platform: str,
        input_text: str,
        dna_data: dict[str, str],
        methodology: str | None,
        properties: dict[str, Any] | None,
    ) -> list[dict[str, str]]:
        """Build the LLM prompt messages for a platform."""
        props_for_prompt: dict[str, str] | None = None
        if properties:
            props_for_prompt = {k: str(v) for k, v in properties.items()}

        messages = build_generation_prompt(
            dna=dna_data,
            platform=platform,
            input_text=input_text,
            properties=props_for_prompt,
        )

        if methodology:
            system_msg = messages[0]["content"]
            messages[0]["content"] = f"{system_msg}\n\nMethodology: {methodology}"

        return messages

    async def generate(
        self,
        clone_id: str,
        platforms: list[str],
        input_text: str,
        properties: dict[str, Any] | None = None,
    ) -> list[Content]:
        """Generate content for one or more platforms using the clone's Voice DNA.

        LLM calls run in parallel via asyncio.gather. DB writes are sequential
        to avoid concurrent session access.

        Raises:
            CloneNotFoundError: If clone doesn't exist.
            ValueError: If clone has no DNA.
        """
        await self._get_clone(clone_id)
        dna = await self._get_latest_dna(clone_id)
        methodology = await self._get_methodology()

        raw_data = cast(dict[str, Any], dna.data)  # pyright: ignore[reportUnknownMemberType]
        dna_data: dict[str, str] = {str(k): str(v) for k, v in raw_data.items()}

        # Build prompts and run LLM calls in parallel
        llm_tasks = [
            self._provider.complete(
                self._build_messages(
                    platform=platform,
                    input_text=input_text,
                    dna_data=dna_data,
                    methodology=methodology,
                    properties=properties,
                )
            )
            for platform in platforms
        ]

        generated_texts: list[str] = await asyncio.gather(*llm_tasks)

        # Save results to DB sequentially
        results: list[Content] = []
        for platform, generated_text in zip(platforms, generated_texts, strict=True):
            content = Content(
                clone_id=clone_id,
                platform=platform,
                status="draft",
                content_current=generated_text,
                content_original=generated_text,
                input_text=input_text,
                generation_properties=properties,
                word_count=len(generated_text.split()),
                char_count=len(generated_text),
            )
            self._session.add(content)
            await self._session.flush()
            await self._create_version(content, trigger="generation")
            results.append(content)

        return results

    # ── CRUD ──────────────────────────────────────────────────────

    async def get_by_id(self, content_id: str) -> Content:
        """Get a content item by ID, or raise ContentNotFoundError."""
        result = await self._session.execute(select(Content).where(Content.id == content_id))
        content = result.scalar_one_or_none()
        if content is None:
            raise ContentNotFoundError(content_id)
        return content

    async def update(self, content_id: str, data: ContentUpdate) -> Content:
        """Update a content item. Creates a version if content_current changes."""
        content = await self.get_by_id(content_id)

        if data.content_current is not None:
            content.content_current = data.content_current
            content.word_count = len(data.content_current.split())
            content.char_count = len(data.content_current)
            await self._create_version(content, trigger="inline_edit")

        if data.status is not None:
            content.status = data.status

        if data.topic is not None:
            content.topic = data.topic

        if data.campaign is not None:
            content.campaign = data.campaign

        if data.tags is not None:
            content.tags = data.tags

        await self._session.flush()
        return content

    async def delete(self, content_id: str) -> None:
        """Delete a content item (cascade deletes versions)."""
        content = await self.get_by_id(content_id)
        await self._session.delete(content)
        await self._session.flush()

    # ── Versioning ────────────────────────────────────────────────

    async def list_versions(self, content_id: str) -> list[ContentVersion]:
        """Return all versions for a content item, newest first."""
        stmt = (
            select(ContentVersion)
            .where(ContentVersion.content_id == content_id)
            .order_by(ContentVersion.version_number.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def restore_version(self, content_id: str, version_number: int) -> Content:
        """Restore content to a previous version (non-destructive, creates new version)."""
        content = await self.get_by_id(content_id)

        stmt = select(ContentVersion).where(
            ContentVersion.content_id == content_id,
            ContentVersion.version_number == version_number,
        )
        result = await self._session.execute(stmt)
        old_version = result.scalar_one_or_none()
        if old_version is None:
            msg = f"Version {version_number} not found for content '{content_id}'"
            raise ValueError(msg)

        content.content_current = old_version.content_text
        content.word_count = old_version.word_count
        content.char_count = len(old_version.content_text)
        await self._create_version(content, trigger="restore")
        await self._session.flush()
        return content

    # ── Helpers ────────────────────────────────────────────────────

    async def _next_version_number(self, content_id: str) -> int:
        """Return the next version number for a content item."""
        stmt = (
            select(ContentVersion.version_number)
            .where(ContentVersion.content_id == content_id)
            .order_by(ContentVersion.version_number.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        current = result.scalar_one_or_none()
        return (current or 0) + 1

    async def _create_version(self, content: Content, trigger: str) -> ContentVersion:
        """Create a new ContentVersion snapshot."""
        version = ContentVersion(
            content_id=content.id,
            version_number=await self._next_version_number(content.id),
            content_text=content.content_current,
            trigger=trigger,
            word_count=content.word_count,
        )
        self._session.add(version)
        await self._session.flush()
        return version
