"""Tests for content generation service."""

from typing import Any
from unittest.mock import AsyncMock

import nanoid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError, ContentNotFoundError
from app.models.clone import VoiceClone
from app.models.content import Content
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings
from app.schemas.content import ContentUpdate
from app.services.content_service import ContentService


async def _create_content_item(
    session: AsyncSession,
    clone_id: str,
    *,
    platform: str = "blog",
    status: str = "draft",
    content_text: str = "Default content text.",
    authenticity_score: int | None = None,
    tags: list[str] | None = None,
) -> Content:
    """Create a Content row directly for filter/list tests."""
    content = Content(
        id=nanoid.generate(),
        clone_id=clone_id,
        platform=platform,
        status=status,
        content_current=content_text,
        content_original=content_text,
        input_text="test input",
        authenticity_score=authenticity_score,
        tags=tags or [],
        word_count=len(content_text.split()),
        char_count=len(content_text),
    )
    session.add(content)
    await session.flush()
    return content


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


async def _create_clone_with_dna(session: AsyncSession) -> VoiceClone:
    """Create a clone with DNA for CRUD tests."""
    clone = await _create_clone(session)
    await _create_dna(session, clone.id)
    return clone


async def _generate_content(session: AsyncSession, clone: VoiceClone) -> "Content":
    """Generate content via the service (returns flushed Content row)."""
    mock_provider = AsyncMock()
    mock_provider.complete = AsyncMock(return_value="Generated text for testing.")
    service = ContentService(session, mock_provider)
    results = await service.generate(
        clone_id=clone.id,
        platforms=["blog"],
        input_text="Write about testing.",
    )
    return results[0]


class TestContentCRUD:
    async def test_get_by_id(self, session: AsyncSession) -> None:
        """get_by_id should return the content by its ID."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        fetched = await service.get_by_id(content.id)

        assert fetched.id == content.id
        assert fetched.content_current == "Generated text for testing."

    async def test_get_by_id_not_found(self, session: AsyncSession) -> None:
        """get_by_id should raise ContentNotFoundError for missing content."""
        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)

        with pytest.raises(ContentNotFoundError):
            await service.get_by_id("nonexistent-id")

    async def test_update_content_text_creates_version(self, session: AsyncSession) -> None:
        """Updating content_current should create a new ContentVersion with trigger=inline_edit."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        updated = await service.update(
            content.id,
            ContentUpdate(content_current="Edited text."),
        )

        assert updated.content_current == "Edited text."
        assert updated.word_count == 2
        assert updated.char_count == len("Edited text.")

        versions = await service.list_versions(content.id)
        edit_versions = [v for v in versions if v.trigger == "inline_edit"]
        assert len(edit_versions) == 1
        assert edit_versions[0].content_text == "Edited text."

    async def test_update_status(self, session: AsyncSession) -> None:
        """Updating status should persist the new status."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        updated = await service.update(
            content.id,
            ContentUpdate(status="review"),
        )

        assert updated.status == "review"

    async def test_update_metadata(self, session: AsyncSession) -> None:
        """Updating topic, campaign, and tags should persist."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        updated = await service.update(
            content.id,
            ContentUpdate(topic="AI", campaign="Q1 Launch", tags=["ai", "tech"]),
        )

        assert updated.topic == "AI"
        assert updated.campaign == "Q1 Launch"
        assert updated.tags == ["ai", "tech"]

    async def test_delete_content(self, session: AsyncSession) -> None:
        """Deleting content should remove it from the database."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        await service.delete(content.id)

        with pytest.raises(ContentNotFoundError):
            await service.get_by_id(content.id)

    async def test_generate_creates_initial_version(self, session: AsyncSession) -> None:
        """generate() should create a ContentVersion with trigger=generation."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        versions = await service.list_versions(content.id)

        assert len(versions) >= 1
        gen_versions = [v for v in versions if v.trigger == "generation"]
        assert len(gen_versions) == 1
        assert gen_versions[0].content_text == "Generated text for testing."
        assert gen_versions[0].version_number == 1


class TestContentVersions:
    async def test_list_versions(self, session: AsyncSession) -> None:
        """list_versions should return versions newest-first."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)

        # Two edits
        await service.update(content.id, ContentUpdate(content_current="Edit one."))
        await service.update(content.id, ContentUpdate(content_current="Edit two."))

        versions = await service.list_versions(content.id)

        assert len(versions) == 3  # generation + 2 edits
        # Newest first
        assert versions[0].version_number > versions[1].version_number
        assert versions[1].version_number > versions[2].version_number

    async def test_restore_version(self, session: AsyncSession) -> None:
        """restore_version should set content_current to the target version's text."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)
        original_text = content.content_current

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)

        # Edit then restore to version 1
        await service.update(content.id, ContentUpdate(content_current="Edited text."))
        restored = await service.restore_version(content.id, version_number=1)

        assert restored.content_current == original_text

        # A new version should be created with trigger=restore
        versions = await service.list_versions(content.id)
        assert versions[0].trigger == "restore"
        assert versions[0].content_text == original_text

    async def test_restore_nonexistent_version(self, session: AsyncSession) -> None:
        """restore_version with invalid version number should raise ValueError."""
        clone = await _create_clone_with_dna(session)
        content = await _generate_content(session, clone)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)

        with pytest.raises(ValueError, match="not found"):
            await service.restore_version(content.id, version_number=999)


class TestListContent:
    async def test_list_content_paginated(self, session: AsyncSession) -> None:
        """list_content with no filters returns paginated list sorted by created_at desc."""
        clone = await _create_clone_with_dna(session)
        await _create_content_item(session, clone.id, content_text="First")
        await _create_content_item(session, clone.id, content_text="Second")
        await _create_content_item(session, clone.id, content_text="Third")

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        items, total = await service.list_content()

        assert total == 3
        assert len(items) == 3

    async def test_list_content_offset_limit(self, session: AsyncSession) -> None:
        """list_content with offset and limit returns correct page."""
        clone = await _create_clone_with_dna(session)
        for i in range(5):
            await _create_content_item(session, clone.id, content_text=f"Item {i}")

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        items, total = await service.list_content(offset=2, limit=2)

        assert total == 5
        assert len(items) == 2

    async def test_filter_by_clone(self, session: AsyncSession) -> None:
        """list_content with clone_id filter returns only content for that clone."""
        clone_a = await _create_clone_with_dna(session)
        clone_b = await _create_clone(session)
        await _create_dna(session, clone_b.id)

        await _create_content_item(session, clone_a.id, content_text="Clone A content")
        await _create_content_item(session, clone_b.id, content_text="Clone B content")

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        items, total = await service.list_content(clone_id=clone_a.id)

        assert total == 1
        assert items[0].clone_id == clone_a.id

    async def test_filter_by_platform(self, session: AsyncSession) -> None:
        """list_content with platform filter returns only matching platform."""
        clone = await _create_clone_with_dna(session)
        await _create_content_item(session, clone.id, platform="linkedin")
        await _create_content_item(session, clone.id, platform="twitter")

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        items, total = await service.list_content(platform="linkedin")

        assert total == 1
        assert items[0].platform == "linkedin"

    async def test_filter_by_status(self, session: AsyncSession) -> None:
        """list_content with status filter returns only matching status."""
        clone = await _create_clone_with_dna(session)
        await _create_content_item(session, clone.id, status="draft")
        await _create_content_item(session, clone.id, status="review")
        await _create_content_item(session, clone.id, status="published")

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        items, total = await service.list_content(status="draft")

        assert total == 1
        assert items[0].status == "draft"

    async def test_full_text_search(self, session: AsyncSession) -> None:
        """list_content with search returns content matching keyword in content_current."""
        clone = await _create_clone_with_dna(session)
        await _create_content_item(session, clone.id, content_text="Machine learning is great")
        await _create_content_item(session, clone.id, content_text="Cooking tips for beginners")

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        items, total = await service.list_content(search="machine")

        assert total == 1
        assert "machine" in items[0].content_current.lower()

    async def test_sort_by_score(self, session: AsyncSession) -> None:
        """list_content sorted by authenticity_score desc returns highest first."""
        clone = await _create_clone_with_dna(session)
        await _create_content_item(session, clone.id, authenticity_score=60)
        await _create_content_item(session, clone.id, authenticity_score=90)
        await _create_content_item(session, clone.id, authenticity_score=75)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        items, total = await service.list_content(sort="authenticity_score", order="desc")

        assert total == 3
        assert items[0].authenticity_score == 90
        assert items[1].authenticity_score == 75
        assert items[2].authenticity_score == 60

    async def test_combined_filters(self, session: AsyncSession) -> None:
        """list_content with multiple filters combines them with AND logic."""
        clone = await _create_clone_with_dna(session)
        await _create_content_item(session, clone.id, platform="linkedin", status="draft")
        await _create_content_item(session, clone.id, platform="linkedin", status="published")
        await _create_content_item(session, clone.id, platform="twitter", status="draft")

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        items, total = await service.list_content(platform="linkedin", status="draft")

        assert total == 1
        assert items[0].platform == "linkedin"
        assert items[0].status == "draft"


class TestBulkOperations:
    async def test_bulk_status_update(self, session: AsyncSession) -> None:
        """bulk_update_status should update status for all specified content items."""
        clone = await _create_clone_with_dna(session)
        c1 = await _create_content_item(session, clone.id, status="draft")
        c2 = await _create_content_item(session, clone.id, status="draft")
        await _create_content_item(session, clone.id, status="draft")  # not updated

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        count = await service.bulk_update_status([c1.id, c2.id], "review")

        assert count == 2
        updated_c1 = await service.get_by_id(c1.id)
        updated_c2 = await service.get_by_id(c2.id)
        assert updated_c1.status == "review"
        assert updated_c2.status == "review"

    async def test_bulk_delete(self, session: AsyncSession) -> None:
        """bulk_delete should delete all specified content items."""
        clone = await _create_clone_with_dna(session)
        c1 = await _create_content_item(session, clone.id)
        c2 = await _create_content_item(session, clone.id)
        c3 = await _create_content_item(session, clone.id)

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        count = await service.bulk_delete([c1.id, c2.id])

        assert count == 2
        # c3 should still exist
        remaining = await service.get_by_id(c3.id)
        assert remaining.id == c3.id
        # c1 and c2 should be gone
        with pytest.raises(ContentNotFoundError):
            await service.get_by_id(c1.id)

    async def test_bulk_add_tags(self, session: AsyncSession) -> None:
        """bulk_add_tags should add tags to all specified content items."""
        clone = await _create_clone_with_dna(session)
        c1 = await _create_content_item(session, clone.id, tags=["existing"])
        c2 = await _create_content_item(session, clone.id, tags=[])

        mock_provider = AsyncMock()
        service = ContentService(session, mock_provider)
        count = await service.bulk_add_tags([c1.id, c2.id], ["new-tag", "another"])

        assert count == 2
        updated_c1 = await service.get_by_id(c1.id)
        updated_c2 = await service.get_by_id(c2.id)
        assert "new-tag" in updated_c1.tags
        assert "another" in updated_c1.tags
        assert "existing" in updated_c1.tags  # preserves existing tags
        assert "new-tag" in updated_c2.tags
