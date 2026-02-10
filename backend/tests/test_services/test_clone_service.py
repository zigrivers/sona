"""Tests for clone CRUD service."""

from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError, CloneSoftDeletedError, DemoCloneReadonlyError
from app.models.clone import VoiceClone
from app.schemas.clone import CloneCreate, CloneUpdate
from app.services.clone_service import CloneService


@pytest.fixture
def service(session: AsyncSession) -> CloneService:
    return CloneService(session)


async def _create_clone(
    session: AsyncSession,
    *,
    name: str = "Test Clone",
    is_demo: bool = False,
    clone_type: str = "original",
) -> VoiceClone:
    clone = VoiceClone(name=name, is_demo=is_demo, type=clone_type)
    session.add(clone)
    await session.flush()
    return clone


async def test_create_clone_with_valid_data(service: CloneService) -> None:
    """create() should persist a new clone with the given fields."""
    data = CloneCreate(name="Marketing Voice", description="Our brand voice", tags=["brand"])
    clone = await service.create(data)

    assert clone.name == "Marketing Voice"
    assert clone.description == "Our brand voice"
    assert clone.tags == ["brand"]
    assert clone.type == "original"


async def test_create_clone_generates_nanoid(service: CloneService) -> None:
    """create() should generate a nanoid for the clone ID."""
    data = CloneCreate(name="Voice")
    clone = await service.create(data)

    assert clone.id is not None
    assert len(clone.id) == 21


async def test_get_clone_returns_detail(service: CloneService, session: AsyncSession) -> None:
    """get_by_id() should return the clone when it exists."""
    clone = await _create_clone(session, name="My Clone")
    result = await service.get_by_id(clone.id)

    assert result.id == clone.id
    assert result.name == "My Clone"


async def test_get_clone_not_found_raises(service: CloneService) -> None:
    """get_by_id() should raise CloneNotFoundError for missing ID."""
    with pytest.raises(CloneNotFoundError):
        await service.get_by_id("nonexistent-id")


async def test_list_clones_returns_paginated(service: CloneService, session: AsyncSession) -> None:
    """list() should return items and total count."""
    await _create_clone(session, name="Clone A")
    await _create_clone(session, name="Clone B")

    items, total = await service.list()

    assert total == 2
    assert len(items) == 2


async def test_list_clones_filters_by_type(service: CloneService, session: AsyncSession) -> None:
    """list(type_filter=...) should return only matching clones."""
    await _create_clone(session, name="Original", clone_type="original")
    await _create_clone(session, name="Merged", clone_type="merged")

    items, total = await service.list(type_filter="original")

    assert total == 1
    assert items[0].name == "Original"


async def test_list_clones_searches_by_name(service: CloneService, session: AsyncSession) -> None:
    """list(search=...) should return clones matching the name."""
    await _create_clone(session, name="Marketing Voice")
    await _create_clone(session, name="Sales Voice")

    items, total = await service.list(search="marketing")

    assert total == 1
    assert items[0].name == "Marketing Voice"


async def test_update_clone_name(service: CloneService, session: AsyncSession) -> None:
    """update() should modify the specified fields."""
    clone = await _create_clone(session, name="Old Name")
    data = CloneUpdate(name="New Name")

    updated = await service.update(clone.id, data)

    assert updated.name == "New Name"


async def test_update_clone_partial(service: CloneService, session: AsyncSession) -> None:
    """update() should only change provided fields."""
    clone = await _create_clone(session, name="Keep Me")
    data = CloneUpdate(description="Added desc")

    updated = await service.update(clone.id, data)

    assert updated.name == "Keep Me"
    assert updated.description == "Added desc"


async def test_delete_clone_soft_deletes(service: CloneService, session: AsyncSession) -> None:
    """delete() should soft-delete the clone (hidden from get_by_id)."""
    clone = await _create_clone(session, name="Delete Me")
    clone_id = clone.id

    await service.delete(clone_id)

    with pytest.raises(CloneNotFoundError):
        await service.get_by_id(clone_id)


async def test_delete_demo_clone_rejected(service: CloneService, session: AsyncSession) -> None:
    """delete() should reject deletion of demo clones."""
    clone = await _create_clone(session, name="Demo", is_demo=True)

    with pytest.raises(DemoCloneReadonlyError):
        await service.delete(clone.id)


# ── Soft-Delete Tests ──────────────────────────────────────────────


async def test_soft_delete_sets_deleted_at(service: CloneService, session: AsyncSession) -> None:
    """delete() should set deleted_at instead of hard-deleting."""
    clone = await _create_clone(session, name="Soft Delete Me")
    clone_id = clone.id

    await service.delete(clone_id)

    # Clone should still exist in DB with deleted_at set
    from sqlalchemy import select

    result = await session.execute(select(VoiceClone).where(VoiceClone.id == clone_id))
    db_clone = result.scalar_one_or_none()
    assert db_clone is not None
    assert db_clone.deleted_at is not None


async def test_soft_deleted_excluded_from_list(
    service: CloneService, session: AsyncSession
) -> None:
    """list() should not return soft-deleted clones."""
    await _create_clone(session, name="Active")
    deleted = await _create_clone(session, name="Deleted")
    deleted.deleted_at = datetime.now(UTC)
    await session.flush()

    items, total = await service.list()

    assert total == 1
    assert items[0].name == "Active"


async def test_soft_deleted_excluded_from_get(service: CloneService, session: AsyncSession) -> None:
    """get_by_id() should raise CloneNotFoundError for soft-deleted clones."""
    clone = await _create_clone(session, name="Deleted Clone")
    clone.deleted_at = datetime.now(UTC)
    await session.flush()

    with pytest.raises(CloneNotFoundError):
        await service.get_by_id(clone.id)


async def test_restore_clears_deleted_at(service: CloneService, session: AsyncSession) -> None:
    """restore() should clear deleted_at and return the clone."""
    clone = await _create_clone(session, name="Restore Me")
    clone.deleted_at = datetime.now(UTC)
    await session.flush()

    restored = await service.restore(clone.id)

    assert restored.deleted_at is None
    assert restored.name == "Restore Me"


async def test_restore_nonexistent_raises(service: CloneService) -> None:
    """restore() should raise CloneNotFoundError for missing ID."""
    with pytest.raises(CloneNotFoundError):
        await service.restore("nonexistent-id")


async def test_restore_active_clone_raises(service: CloneService, session: AsyncSession) -> None:
    """restore() should raise CloneSoftDeletedError for a clone that isn't deleted."""
    clone = await _create_clone(session, name="Active Clone")

    with pytest.raises(CloneSoftDeletedError):
        await service.restore(clone.id)


async def test_list_deleted_returns_soft_deleted(
    service: CloneService, session: AsyncSession
) -> None:
    """list_deleted() should return only soft-deleted clones within 30-day window."""
    await _create_clone(session, name="Active")
    deleted = await _create_clone(session, name="Recently Deleted")
    deleted.deleted_at = datetime.now(UTC)
    await session.flush()

    deleted_items = await service.list_deleted()

    assert len(deleted_items) == 1
    assert deleted_items[0].name == "Recently Deleted"


async def test_purge_expired_hard_deletes(service: CloneService, session: AsyncSession) -> None:
    """purge_expired() should hard-delete clones older than 30 days."""
    recent = await _create_clone(session, name="Recent Delete")
    recent.deleted_at = datetime.now(UTC) - timedelta(days=5)

    expired = await _create_clone(session, name="Expired Delete")
    expired.deleted_at = datetime.now(UTC) - timedelta(days=31)
    await session.flush()

    count = await service.purge_expired()

    assert count == 1
    # Recent should still exist
    deleted_items = await service.list_deleted()
    assert len(deleted_items) == 1
    assert deleted_items[0].name == "Recent Delete"
