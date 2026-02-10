"""Tests for preset service."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import PresetNotFoundError
from app.schemas.preset import PresetCreate, PresetUpdate
from app.services.preset_service import PresetService


class TestCreatePreset:
    async def test_creates_preset(self, session: AsyncSession) -> None:
        """Creating a preset should persist name and properties."""
        service = PresetService(session)
        data = PresetCreate(name="Blog Default", properties={"length": "long", "tone": 70})
        preset = await service.create(data)

        assert preset.name == "Blog Default"
        assert preset.properties == {"length": "long", "tone": 70}
        assert preset.id is not None

    async def test_created_preset_has_timestamps(self, session: AsyncSession) -> None:
        """Created preset should have created_at and updated_at."""
        service = PresetService(session)
        data = PresetCreate(name="With Timestamps", properties={"length": "short"})
        preset = await service.create(data)

        assert preset.created_at is not None
        assert preset.updated_at is not None


class TestListPresets:
    async def test_empty_list(self, session: AsyncSession) -> None:
        """Listing presets when none exist should return empty list."""
        service = PresetService(session)
        result = await service.list()
        assert result == []

    async def test_returns_all_presets_sorted_by_name(self, session: AsyncSession) -> None:
        """Listing presets should return all presets sorted by name."""
        service = PresetService(session)
        await service.create(PresetCreate(name="Zebra", properties={}))
        await service.create(PresetCreate(name="Alpha", properties={}))
        await service.create(PresetCreate(name="Middle", properties={}))

        result = await service.list()
        names = [p.name for p in result]
        assert names == ["Alpha", "Middle", "Zebra"]


class TestGetById:
    async def test_get_existing_preset(self, session: AsyncSession) -> None:
        """Getting an existing preset by ID should return it."""
        service = PresetService(session)
        created = await service.create(PresetCreate(name="Find Me", properties={"key": "value"}))
        found = await service.get_by_id(created.id)
        assert found.name == "Find Me"

    async def test_get_nonexistent_raises(self, session: AsyncSession) -> None:
        """Getting a nonexistent preset should raise PresetNotFoundError."""
        service = PresetService(session)
        with pytest.raises(PresetNotFoundError):
            await service.get_by_id("nonexistent-id")


class TestUpdatePreset:
    async def test_update_name(self, session: AsyncSession) -> None:
        """Updating a preset's name should persist the change."""
        service = PresetService(session)
        preset = await service.create(PresetCreate(name="Old Name", properties={}))
        updated = await service.update(preset.id, PresetUpdate(name="New Name"))
        assert updated.name == "New Name"

    async def test_update_properties(self, session: AsyncSession) -> None:
        """Updating properties should persist the change."""
        service = PresetService(session)
        preset = await service.create(PresetCreate(name="Props Test", properties={"a": 1}))
        updated = await service.update(preset.id, PresetUpdate(properties={"b": 2}))
        assert updated.properties == {"b": 2}

    async def test_partial_update(self, session: AsyncSession) -> None:
        """Updating only name should not change properties."""
        service = PresetService(session)
        preset = await service.create(PresetCreate(name="Partial", properties={"keep": "this"}))
        updated = await service.update(preset.id, PresetUpdate(name="Renamed"))
        assert updated.name == "Renamed"
        assert updated.properties == {"keep": "this"}

    async def test_update_nonexistent_raises(self, session: AsyncSession) -> None:
        """Updating a nonexistent preset should raise PresetNotFoundError."""
        service = PresetService(session)
        with pytest.raises(PresetNotFoundError):
            await service.update("nonexistent", PresetUpdate(name="X"))


class TestDeletePreset:
    async def test_delete_existing(self, session: AsyncSession) -> None:
        """Deleting an existing preset should remove it."""
        service = PresetService(session)
        preset = await service.create(PresetCreate(name="Delete Me", properties={}))
        await service.delete(preset.id)

        with pytest.raises(PresetNotFoundError):
            await service.get_by_id(preset.id)

    async def test_delete_nonexistent_raises(self, session: AsyncSession) -> None:
        """Deleting a nonexistent preset should raise PresetNotFoundError."""
        service = PresetService(session)
        with pytest.raises(PresetNotFoundError):
            await service.delete("nonexistent-id")
