"""Service for managing generation presets."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions import PresetNotFoundError
from app.models.preset import GenerationPreset
from app.schemas.preset import PresetCreate, PresetUpdate


class PresetService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, preset_id: str) -> GenerationPreset:
        result = await self.session.execute(
            select(GenerationPreset).where(GenerationPreset.id == preset_id)
        )
        preset = result.scalar_one_or_none()
        if preset is None:
            raise PresetNotFoundError(preset_id)
        return preset

    async def list(self) -> list[GenerationPreset]:
        result = await self.session.execute(
            select(GenerationPreset).order_by(GenerationPreset.name)
        )
        return list(result.scalars().all())

    async def create(self, data: PresetCreate) -> GenerationPreset:
        preset = GenerationPreset(
            name=data.name,
            properties=data.properties,
        )
        self.session.add(preset)
        await self.session.flush()
        return preset

    async def update(self, preset_id: str, data: PresetUpdate) -> GenerationPreset:
        preset = await self.get_by_id(preset_id)
        if data.name is not None:
            preset.name = data.name
        if data.properties is not None:
            preset.properties = data.properties
        await self.session.flush()
        return preset

    async def delete(self, preset_id: str) -> None:
        preset = await self.get_by_id(preset_id)
        await self.session.delete(preset)
        await self.session.flush()
