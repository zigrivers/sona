"""API endpoints for generation presets."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.preset import PresetCreate, PresetResponse, PresetUpdate
from app.services.preset_service import PresetService

router = APIRouter()

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.get("/presets", response_model=list[PresetResponse])
async def list_presets(session: SessionDep) -> list[PresetResponse]:
    service = PresetService(session)
    presets = await service.list()
    return [PresetResponse.model_validate(p) for p in presets]


@router.get("/presets/{preset_id}", response_model=PresetResponse)
async def get_preset(preset_id: str, session: SessionDep) -> PresetResponse:
    service = PresetService(session)
    preset = await service.get_by_id(preset_id)
    return PresetResponse.model_validate(preset)


@router.post("/presets", response_model=PresetResponse, status_code=201)
async def create_preset(body: PresetCreate, session: SessionDep) -> PresetResponse:
    service = PresetService(session)
    preset = await service.create(body)
    await session.commit()
    return PresetResponse.model_validate(preset)


@router.put("/presets/{preset_id}", response_model=PresetResponse)
async def update_preset(preset_id: str, body: PresetUpdate, session: SessionDep) -> PresetResponse:
    service = PresetService(session)
    preset = await service.update(preset_id, body)
    await session.commit()
    return PresetResponse.model_validate(preset)


@router.delete("/presets/{preset_id}", status_code=204)
async def delete_preset(preset_id: str, session: SessionDep) -> Response:
    service = PresetService(session)
    await service.delete(preset_id)
    await session.commit()
    return Response(status_code=204)
