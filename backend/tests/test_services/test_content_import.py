"""Tests for content import service."""

import nanoid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError
from app.models.clone import VoiceClone
from app.services.content_service import ContentService


async def _create_clone(session: AsyncSession) -> VoiceClone:
    clone = VoiceClone(id=nanoid.generate(), name="Test Clone")
    session.add(clone)
    await session.flush()
    return clone


class TestImportContent:
    async def test_import_creates_draft_content(self, session: AsyncSession) -> None:
        """import_content should create a Content row with status=draft and matching text."""
        clone = await _create_clone(session)
        service = ContentService(session)

        content = await service.import_content(
            clone_id=clone.id,
            platform="blog",
            content_text="This is my imported blog post.",
        )

        assert content.status == "draft"
        assert content.content_current == "This is my imported blog post."
        assert content.content_original == "This is my imported blog post."

    async def test_import_sets_source_property(self, session: AsyncSession) -> None:
        """import_content should set generation_properties to {"source": "import"}."""
        clone = await _create_clone(session)
        service = ContentService(session)

        content = await service.import_content(
            clone_id=clone.id,
            platform="blog",
            content_text="Imported text.",
        )

        assert content.generation_properties == {"source": "import"}

    async def test_import_sets_input_text_marker(self, session: AsyncSession) -> None:
        """import_content should set input_text to '[Imported]'."""
        clone = await _create_clone(session)
        service = ContentService(session)

        content = await service.import_content(
            clone_id=clone.id,
            platform="blog",
            content_text="Imported text.",
        )

        assert content.input_text == "[Imported]"

    async def test_import_creates_initial_version(self, session: AsyncSession) -> None:
        """import_content should create a ContentVersion with trigger='import'."""
        clone = await _create_clone(session)
        service = ContentService(session)

        content = await service.import_content(
            clone_id=clone.id,
            platform="blog",
            content_text="Imported text.",
        )

        versions = await service.list_versions(content.id)
        assert len(versions) == 1
        assert versions[0].trigger == "import"
        assert versions[0].content_text == "Imported text."
        assert versions[0].version_number == 1

    async def test_import_computes_word_and_char_count(self, session: AsyncSession) -> None:
        """import_content should compute correct word_count and char_count."""
        clone = await _create_clone(session)
        service = ContentService(session)

        text = "Five words are right here."
        content = await service.import_content(
            clone_id=clone.id,
            platform="blog",
            content_text=text,
        )

        assert content.word_count == 5
        assert content.char_count == len(text)

    async def test_import_assigns_metadata(self, session: AsyncSession) -> None:
        """import_content should assign platform, topic, campaign, and tags."""
        clone = await _create_clone(session)
        service = ContentService(session)

        content = await service.import_content(
            clone_id=clone.id,
            platform="twitter",
            content_text="A tweet.",
            topic="Product Launch",
            campaign="Q1 2026",
            tags=["launch", "twitter"],
        )

        assert content.platform == "twitter"
        assert content.topic == "Product Launch"
        assert content.campaign == "Q1 2026"
        assert content.tags == ["launch", "twitter"]

    async def test_import_nonexistent_clone_raises(self, session: AsyncSession) -> None:
        """import_content should raise CloneNotFoundError for missing clone."""
        service = ContentService(session)

        with pytest.raises(CloneNotFoundError):
            await service.import_content(
                clone_id="nonexistent-id",
                platform="blog",
                content_text="Some text.",
            )
