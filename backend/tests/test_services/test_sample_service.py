"""Tests for sample service."""

import nanoid
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError, SampleNotFoundError
from app.models.clone import VoiceClone
from app.schemas.sample import SampleCreate
from app.services.sample_service import SampleService


async def _create_clone(session: AsyncSession, name: str = "Test Clone") -> VoiceClone:
    """Helper to create a voice clone for testing."""
    clone = VoiceClone(id=nanoid.generate(), name=name)
    session.add(clone)
    await session.flush()
    return clone


class TestCreateSample:
    async def test_create_sample_from_paste(self, session: AsyncSession) -> None:
        """Creating a sample from paste should set content, word_count, and length_category."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(
            content="This is a test sample with some words in it.",
            content_type="blog_post",
            source_type="paste",
        )
        sample = await service.create(clone.id, data)

        assert sample.content == "This is a test sample with some words in it."
        assert sample.clone_id == clone.id
        assert sample.source_type == "paste"
        assert sample.word_count == 10
        assert sample.length_category == "short"

    async def test_create_sample_clone_not_found(self, session: AsyncSession) -> None:
        """Creating a sample for a non-existent clone should raise CloneNotFoundError."""
        service = SampleService(session)
        data = SampleCreate(content="Test", content_type="email")

        with pytest.raises(CloneNotFoundError):
            await service.create("nonexistent-id", data)

    async def test_create_sample_preserves_source_url(self, session: AsyncSession) -> None:
        """Creating a URL-sourced sample should preserve the source_url."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(
            content="Scraped content from web.",
            content_type="blog_post",
            source_type="url",
            source_url="https://example.com/article",
        )
        sample = await service.create(clone.id, data)

        assert sample.source_url == "https://example.com/article"
        assert sample.source_type == "url"

    async def test_create_sample_preserves_source_filename(self, session: AsyncSession) -> None:
        """Creating a file-sourced sample should preserve the source_filename."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(
            content="Content from uploaded file.",
            content_type="email",
            source_type="file",
            source_filename="document.docx",
        )
        sample = await service.create(clone.id, data)

        assert sample.source_filename == "document.docx"
        assert sample.source_type == "file"


class TestWordCount:
    async def test_word_count_calculated_correctly(self, session: AsyncSession) -> None:
        """Word count should be calculated from content split by whitespace."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(content="one two three four five", content_type="email")
        sample = await service.create(clone.id, data)
        assert sample.word_count == 5

    async def test_word_count_handles_extra_whitespace(self, session: AsyncSession) -> None:
        """Word count should handle multiple spaces and newlines."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(content="one  two\nthree\t\tfour", content_type="email")
        sample = await service.create(clone.id, data)
        assert sample.word_count == 4


class TestLengthCategory:
    async def test_length_category_short(self, session: AsyncSession) -> None:
        """Samples under 300 words should be categorized as 'short'."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(content=" ".join(["word"] * 100), content_type="email")
        sample = await service.create(clone.id, data)
        assert sample.length_category == "short"

    async def test_length_category_medium(self, session: AsyncSession) -> None:
        """Samples between 300-1000 words should be categorized as 'medium'."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(content=" ".join(["word"] * 500), content_type="blog_post")
        sample = await service.create(clone.id, data)
        assert sample.length_category == "medium"

    async def test_length_category_long(self, session: AsyncSession) -> None:
        """Samples over 1000 words should be categorized as 'long'."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(content=" ".join(["word"] * 1500), content_type="blog_post")
        sample = await service.create(clone.id, data)
        assert sample.length_category == "long"


class TestListSamples:
    async def test_list_samples_ordered_by_date_desc(self, session: AsyncSession) -> None:
        """Listing samples should return them ordered by created_at descending."""
        clone = await _create_clone(session)
        service = SampleService(session)

        # Create samples in order
        for i in range(3):
            data = SampleCreate(content=f"Sample {i}", content_type="email")
            await service.create(clone.id, data)

        samples, total = await service.list_by_clone(clone.id)

        assert total == 3
        assert len(samples) == 3
        # Most recent first
        assert samples[0].content == "Sample 2"
        assert samples[2].content == "Sample 0"

    async def test_list_samples_empty(self, session: AsyncSession) -> None:
        """Listing samples for a clone with none should return empty list."""
        clone = await _create_clone(session)
        service = SampleService(session)

        samples, total = await service.list_by_clone(clone.id)
        assert total == 0
        assert samples == []

    async def test_list_samples_clone_not_found(self, session: AsyncSession) -> None:
        """Listing samples for a non-existent clone should raise CloneNotFoundError."""
        service = SampleService(session)

        with pytest.raises(CloneNotFoundError):
            await service.list_by_clone("nonexistent-id")


class TestDeleteSample:
    async def test_delete_sample(self, session: AsyncSession) -> None:
        """Deleting a sample should remove it from the database."""
        clone = await _create_clone(session)
        service = SampleService(session)

        data = SampleCreate(content="To be deleted", content_type="email")
        sample = await service.create(clone.id, data)
        sample_id = sample.id

        await service.delete(sample_id)

        with pytest.raises(SampleNotFoundError):
            await service.get_by_id(sample_id)

    async def test_delete_sample_not_found(self, session: AsyncSession) -> None:
        """Deleting a non-existent sample should raise SampleNotFoundError."""
        service = SampleService(session)

        with pytest.raises(SampleNotFoundError):
            await service.delete("nonexistent-id")
