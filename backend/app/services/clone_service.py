"""Clone CRUD service."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError, CloneSoftDeletedError, DemoCloneReadonlyError
from app.models.clone import VoiceClone
from app.schemas.clone import CloneCreate, CloneUpdate

SOFT_DELETE_RETENTION_DAYS = 30


class CloneService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, data: CloneCreate) -> VoiceClone:
        clone = VoiceClone(
            name=data.name,
            description=data.description,
            tags=data.tags,
        )
        self._session.add(clone)
        await self._session.flush()
        return clone

    async def get_by_id(self, clone_id: str) -> VoiceClone:
        result = await self._session.execute(
            select(VoiceClone).where(
                VoiceClone.id == clone_id,
                VoiceClone.deleted_at.is_(None),
            )
        )
        clone = result.scalar_one_or_none()
        if clone is None:
            raise CloneNotFoundError(clone_id)
        return clone

    async def list(
        self,
        *,
        type_filter: str | None = None,
        search: str | None = None,
    ) -> tuple[list[VoiceClone], int]:
        query = select(VoiceClone).where(VoiceClone.deleted_at.is_(None))

        if type_filter:
            query = query.where(VoiceClone.type == type_filter)
        if search:
            query = query.where(VoiceClone.name.ilike(f"%{search}%"))

        # Count query
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self._session.execute(count_query)
        total = total_result.scalar_one()

        # Fetch results
        query = query.order_by(VoiceClone.created_at.desc())
        result = await self._session.execute(query)
        items = list(result.scalars().all())

        return items, total

    async def update(self, clone_id: str, data: CloneUpdate) -> VoiceClone:
        clone = await self.get_by_id(clone_id)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(clone, field, value)

        await self._session.flush()
        return clone

    async def delete(self, clone_id: str) -> None:
        clone = await self.get_by_id(clone_id)

        if clone.is_demo:
            raise DemoCloneReadonlyError(clone_id)

        clone.deleted_at = datetime.now(UTC)
        await self._session.flush()

    async def restore(self, clone_id: str) -> VoiceClone:
        """Restore a soft-deleted clone."""
        result = await self._session.execute(select(VoiceClone).where(VoiceClone.id == clone_id))
        clone = result.scalar_one_or_none()
        if clone is None:
            raise CloneNotFoundError(clone_id)
        if clone.deleted_at is None:
            raise CloneSoftDeletedError(clone_id)

        clone.deleted_at = None
        await self._session.flush()
        return clone

    async def list_deleted(self) -> list[VoiceClone]:
        """Return soft-deleted clones within the retention window."""
        cutoff = datetime.now(UTC) - timedelta(days=SOFT_DELETE_RETENTION_DAYS)
        result = await self._session.execute(
            select(VoiceClone)
            .where(
                VoiceClone.deleted_at.is_not(None),
                VoiceClone.deleted_at > cutoff,
            )
            .order_by(VoiceClone.deleted_at.desc())
        )
        return list(result.scalars().all())

    async def purge_expired(self) -> int:
        """Hard-delete clones whose soft-delete has expired."""
        cutoff = datetime.now(UTC) - timedelta(days=SOFT_DELETE_RETENTION_DAYS)
        result = await self._session.execute(
            select(VoiceClone).where(
                VoiceClone.deleted_at.is_not(None),
                VoiceClone.deleted_at <= cutoff,
            )
        )
        expired = list(result.scalars().all())
        for clone in expired:
            await self._session.delete(clone)
        await self._session.flush()
        return len(expired)
