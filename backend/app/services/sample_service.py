"""Sample service for managing writing samples."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError, SampleNotFoundError
from app.models.clone import VoiceClone
from app.models.sample import WritingSample
from app.schemas.sample import SampleCreate


def _calculate_word_count(text: str) -> int:
    """Count words by splitting on whitespace."""
    return len(text.split())


def _determine_length_category(word_count: int) -> str:
    """Categorize text length: short (<300), medium (300-1000), long (>1000)."""
    if word_count < 300:
        return "short"
    if word_count <= 1000:
        return "medium"
    return "long"


class SampleService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _validate_clone_exists(self, clone_id: str) -> None:
        """Raise CloneNotFoundError if the clone doesn't exist."""
        result = await self.session.execute(select(VoiceClone.id).where(VoiceClone.id == clone_id))
        if result.scalar_one_or_none() is None:
            raise CloneNotFoundError(clone_id)

    async def get_by_id(self, sample_id: str) -> WritingSample:
        """Get a sample by ID or raise SampleNotFoundError."""
        result = await self.session.execute(
            select(WritingSample).where(WritingSample.id == sample_id)
        )
        sample = result.scalar_one_or_none()
        if sample is None:
            raise SampleNotFoundError(sample_id)
        return sample

    async def create(self, clone_id: str, data: SampleCreate) -> WritingSample:
        """Create a new writing sample for a clone."""
        await self._validate_clone_exists(clone_id)

        # Reject samples for merged clones
        result = await self.session.execute(
            select(VoiceClone.type).where(VoiceClone.id == clone_id)
        )
        clone_type = result.scalar_one()
        if clone_type == "merged":
            msg = "Cannot add samples to a merged clone"
            raise ValueError(msg)

        word_count = _calculate_word_count(data.content)
        length_category = _determine_length_category(word_count)

        sample = WritingSample(
            clone_id=clone_id,
            content=data.content,
            content_type=data.content_type,
            source_type=data.source_type,
            source_url=data.source_url,
            source_filename=data.source_filename,
            word_count=word_count,
            length_category=length_category,
        )
        self.session.add(sample)
        await self.session.flush()
        return sample

    async def list_by_clone(self, clone_id: str) -> tuple[list[WritingSample], int]:
        """List samples for a clone, ordered by created_at descending."""
        await self._validate_clone_exists(clone_id)

        count_result = await self.session.execute(
            select(func.count())
            .select_from(WritingSample)
            .where(WritingSample.clone_id == clone_id)
        )
        total = count_result.scalar_one()

        result = await self.session.execute(
            select(WritingSample)
            .where(WritingSample.clone_id == clone_id)
            .order_by(WritingSample.created_at.desc())
        )
        samples = list(result.scalars().all())

        return samples, total

    async def delete(self, sample_id: str) -> None:
        """Delete a sample by ID or raise SampleNotFoundError."""
        sample = await self.get_by_id(sample_id)
        await self.session.delete(sample)
        await self.session.flush()
