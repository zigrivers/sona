"""Clone CRUD API routes."""

from typing import Annotated, cast

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.models.clone import VoiceClone
from app.schemas.clone import CloneCreate, CloneListResponse, CloneResponse, CloneUpdate
from app.services.clone_service import CloneService

router = APIRouter(prefix="/clones", tags=["clones"])

Session = Annotated[AsyncSession, Depends(get_session)]


def _to_response(clone: VoiceClone) -> CloneResponse:
    """Convert a VoiceClone model to a CloneResponse with computed fields."""
    tags = cast(list[str], clone.tags)  # pyright: ignore[reportUnknownMemberType]
    return CloneResponse.model_validate(
        {
            "id": clone.id,
            "name": clone.name,
            "description": clone.description,
            "tags": tags,
            "type": clone.type,
            "is_demo": clone.is_demo,
            "is_hidden": clone.is_hidden,
            "avatar_path": clone.avatar_path,
            "created_at": clone.created_at,
            "updated_at": clone.updated_at,
            "sample_count": len(clone.samples),
            "confidence_score": 0,
        }
    )


@router.post("", status_code=201)
async def create_clone(data: CloneCreate, session: Session) -> CloneResponse:
    service = CloneService(session)
    clone = await service.create(data)
    await session.commit()
    await session.refresh(clone)
    return _to_response(clone)


@router.get("")
async def list_clones(
    session: Session,
    type: str | None = None,
    search: str | None = None,
) -> CloneListResponse:
    service = CloneService(session)
    items, total = await service.list(type_filter=type, search=search)
    return CloneListResponse(
        items=[_to_response(c) for c in items],
        total=total,
    )


@router.get("/{clone_id}")
async def get_clone(clone_id: str, session: Session) -> CloneResponse:
    service = CloneService(session)
    clone = await service.get_by_id(clone_id)
    return _to_response(clone)


@router.put("/{clone_id}")
async def update_clone(clone_id: str, data: CloneUpdate, session: Session) -> CloneResponse:
    service = CloneService(session)
    clone = await service.update(clone_id, data)
    await session.commit()
    return _to_response(clone)


@router.delete("/{clone_id}", status_code=204)
async def delete_clone(clone_id: str, session: Session) -> Response:
    service = CloneService(session)
    await service.delete(clone_id)
    await session.commit()
    return Response(status_code=204)
