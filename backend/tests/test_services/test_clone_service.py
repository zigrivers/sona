"""Tests for clone CRUD service."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import CloneNotFoundError, DemoCloneReadonlyError
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


async def test_delete_clone_removes_cascade(service: CloneService, session: AsyncSession) -> None:
    """delete() should remove the clone and cascade-delete children."""
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
