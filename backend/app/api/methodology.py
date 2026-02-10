"""Methodology settings API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.methodology import (
    MethodologyResponse,
    MethodologyUpdate,
    MethodologyVersionResponse,
)
from app.services.methodology_service import MethodologyService

router = APIRouter(prefix="/methodology", tags=["methodology"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]


@router.get("/{section}")
async def get_section(
    section: str,
    session: SessionDep,
) -> MethodologyResponse:
    svc = MethodologyService(session)
    result = await svc.get_section(section)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Section '{section}' not found")
    return MethodologyResponse.model_validate(result)


@router.put("/{section}")
async def update_section(
    section: str,
    body: MethodologyUpdate,
    session: SessionDep,
) -> MethodologyResponse:
    svc = MethodologyService(session)
    try:
        result = await svc.update_section(section, body.content)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=f"Section '{section}' not found") from exc
    await session.commit()
    return MethodologyResponse.model_validate(result)


@router.get("/{section}/versions")
async def list_versions(
    section: str,
    session: SessionDep,
) -> list[MethodologyVersionResponse]:
    svc = MethodologyService(session)
    versions = await svc.list_versions(section)
    return [MethodologyVersionResponse.model_validate(v) for v in versions]


@router.post("/{section}/revert/{version}")
async def revert_version(
    section: str,
    version: int,
    session: SessionDep,
) -> MethodologyResponse:
    svc = MethodologyService(session)
    try:
        result = await svc.revert(section, version)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    await session.commit()
    return MethodologyResponse.model_validate(result)
