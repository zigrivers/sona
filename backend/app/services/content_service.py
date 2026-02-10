"""Content generation service."""

from __future__ import annotations

import asyncio
from typing import Any, cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError
from app.llm.base import LLMProvider
from app.llm.prompts import build_generation_prompt
from app.models.clone import VoiceClone
from app.models.content import Content
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings


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
            results.append(content)

        return results
