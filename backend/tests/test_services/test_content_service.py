"""Tests for content generation service."""

from typing import Any
from unittest.mock import AsyncMock

import nanoid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError
from app.models.clone import VoiceClone
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings
from app.services.content_service import ContentService


async def _create_clone(session: AsyncSession) -> VoiceClone:
    clone = VoiceClone(id=nanoid.generate(), name="Test Clone")
    session.add(clone)
    await session.flush()
    return clone


async def _create_dna(
    session: AsyncSession,
    clone_id: str,
    data: dict[str, Any] | None = None,
) -> VoiceDNAVersion:
    dna = VoiceDNAVersion(
        id=nanoid.generate(),
        clone_id=clone_id,
        version_number=1,
        data=data or {"tone": "conversational", "humor": "dry", "formality": "casual"},
        trigger="initial_analysis",
        model_used="test-model",
    )
    session.add(dna)
    await session.flush()
    return dna


async def _create_methodology(session: AsyncSession) -> MethodologySettings:
    settings = MethodologySettings(
        id=nanoid.generate(),
        section_key="voice_cloning_instructions",
        current_content="Always match the author's unique voice patterns.",
    )
    session.add(settings)
    await session.flush()
    return settings


class TestGenerateSinglePlatform:
    async def test_generate_single_platform(self, session: AsyncSession) -> None:
        """Generate content for a single platform should return one result."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value="Generated blog post content here.")

        service = ContentService(session, mock_provider)
        results = await service.generate(
            clone_id=clone.id,
            platforms=["blog"],
            input_text="Write about testing.",
        )

        assert len(results) == 1
        assert results[0].platform == "blog"
        assert results[0].content_current == "Generated blog post content here."
        assert results[0].content_original == "Generated blog post content here."
        assert results[0].status == "draft"

    async def test_generate_multiple_platforms_parallel(self, session: AsyncSession) -> None:
        """Generate content for multiple platforms should return results for each."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)

        call_count = 0

        async def mock_complete(messages: list[dict[str, str]], **kwargs: Any) -> str:
            nonlocal call_count
            call_count += 1
            platform = "unknown"
            for msg in messages:
                if "twitter" in msg.get("content", "").lower():
                    platform = "twitter"
                elif "linkedin" in msg.get("content", "").lower():
                    platform = "linkedin"
            return f"Content for {platform}"

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=mock_complete)

        service = ContentService(session, mock_provider)
        results = await service.generate(
            clone_id=clone.id,
            platforms=["twitter", "linkedin"],
            input_text="Write about testing.",
        )

        assert len(results) == 2
        platforms = {r.platform for r in results}
        assert platforms == {"twitter", "linkedin"}


class TestPromptConstruction:
    async def test_prompt_includes_voice_dna(self, session: AsyncSession) -> None:
        """The generation prompt should include voice DNA traits."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id, data={"tone": "witty", "humor": "sarcastic"})

        captured_messages: list[list[dict[str, str]]] = []

        async def capture_complete(messages: list[dict[str, str]], **kwargs: Any) -> str:
            captured_messages.append(messages)
            return "Generated content"

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=capture_complete)

        service = ContentService(session, mock_provider)
        await service.generate(
            clone_id=clone.id,
            platforms=["email"],
            input_text="Write an email.",
        )

        assert len(captured_messages) == 1
        system_msg = captured_messages[0][0]["content"]
        assert "tone" in system_msg.lower()
        assert "witty" in system_msg.lower()

    async def test_prompt_includes_methodology(self, session: AsyncSession) -> None:
        """The generation prompt should include methodology if available."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)
        await _create_methodology(session)

        captured_messages: list[list[dict[str, str]]] = []

        async def capture_complete(messages: list[dict[str, str]], **kwargs: Any) -> str:
            captured_messages.append(messages)
            return "Generated content"

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=capture_complete)

        service = ContentService(session, mock_provider)
        await service.generate(
            clone_id=clone.id,
            platforms=["blog"],
            input_text="Write a blog post.",
        )

        assert len(captured_messages) == 1
        system_msg = captured_messages[0][0]["content"]
        assert "voice patterns" in system_msg.lower() or "match" in system_msg.lower()

    async def test_property_overrides_in_prompt(self, session: AsyncSession) -> None:
        """Generation properties should appear in the prompt."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)

        captured_messages: list[list[dict[str, str]]] = []

        async def capture_complete(messages: list[dict[str, str]], **kwargs: Any) -> str:
            captured_messages.append(messages)
            return "Generated content"

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(side_effect=capture_complete)

        service = ContentService(session, mock_provider)
        await service.generate(
            clone_id=clone.id,
            platforms=["twitter"],
            input_text="Write a tweet.",
            properties={"tone": "formal", "humor": "none"},
        )

        assert len(captured_messages) == 1
        system_msg = captured_messages[0][0]["content"]
        assert "formal" in system_msg.lower()


class TestResponseMetrics:
    async def test_response_includes_word_and_char_count(self, session: AsyncSession) -> None:
        """Generated content should have correct word_count and char_count."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value="Five words are right here.")

        service = ContentService(session, mock_provider)
        results = await service.generate(
            clone_id=clone.id,
            platforms=["email"],
            input_text="Test input.",
        )

        assert results[0].word_count == 5
        assert results[0].char_count == len("Five words are right here.")


class TestErrorHandling:
    async def test_generate_without_dna_returns_error(self, session: AsyncSession) -> None:
        """Generating content for a clone with no DNA should raise ValueError."""
        clone = await _create_clone(session)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)

        with pytest.raises(ValueError, match=r"[Aa]nalyze.*DNA"):
            await service.generate(
                clone_id=clone.id,
                platforms=["blog"],
                input_text="Write something.",
            )

    async def test_generate_clone_not_found(self, session: AsyncSession) -> None:
        """Generating content for a non-existent clone should raise CloneNotFoundError."""
        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)

        with pytest.raises(CloneNotFoundError):
            await service.generate(
                clone_id="nonexistent-id",
                platforms=["blog"],
                input_text="Write something.",
            )

    async def test_content_saved_to_database(self, session: AsyncSession) -> None:
        """Generated content should be persisted in the database."""
        clone = await _create_clone(session)
        await _create_dna(session, clone.id)

        mock_provider = AsyncMock()
        mock_provider.complete = AsyncMock(return_value="Saved content.")

        service = ContentService(session, mock_provider)
        results = await service.generate(
            clone_id=clone.id,
            platforms=["email"],
            input_text="Test.",
        )

        assert results[0].id is not None
        assert results[0].clone_id == clone.id
        assert results[0].input_text == "Test."
