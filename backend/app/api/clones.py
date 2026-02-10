"""Clone CRUD and DNA analysis API routes."""

from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_llm_provider, get_session
from app.exceptions import AnalysisFailedError, CloneNotFoundError, MergeFailedError
from app.models.clone import VoiceClone
from app.schemas.clone import CloneCreate, CloneListResponse, CloneResponse, CloneUpdate
from app.schemas.dna import (
    DNAPromptResponse,
    DNAResponse,
    DNAVersionListResponse,
    DNAVersionResponse,
)
from app.services.clone_service import CloneService
from app.services.dna_service import DNAService
from app.services.merge_service import MergeService
from app.services.scoring_service import calculate_confidence

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
            "confidence_score": calculate_confidence(clone),
        }
    )


# ── Merge Endpoint ────────────────────────────────────────────


class MergeSourceItem(BaseModel):
    clone_id: str
    weights: dict[str, int]


class MergeRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    source_clones: list[MergeSourceItem] = Field(min_length=2, max_length=5)


@router.post("/merge", status_code=201)
async def merge_clones(data: MergeRequest, session: Session) -> CloneResponse:
    provider = await get_llm_provider()
    svc = MergeService(session)
    try:
        clone = await svc.merge(
            name=data.name,
            source_clones=[s.model_dump() for s in data.source_clones],
            provider=provider,
            model="gpt-4o",
        )
    except CloneNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.detail) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except MergeFailedError as exc:
        raise HTTPException(status_code=502, detail=exc.detail) from exc
    await session.commit()
    await session.refresh(clone)
    return _to_response(clone)


# ── Clone CRUD ────────────────────────────────────────────────


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


# ── DNA Analysis Endpoints ─────────────────────────────────────


class AnalyzeRequest(BaseModel):
    model: str = Field(min_length=1)


class DNAEditRequest(BaseModel):
    data: dict[str, Any]
    prominence_scores: dict[str, Any] | None = None


@router.post("/{clone_id}/analyze", status_code=201)
async def analyze_clone(
    clone_id: str,
    data: AnalyzeRequest,
    session: Session,
) -> DNAResponse:
    provider = await get_llm_provider()
    svc = DNAService(session)
    try:
        dna = await svc.analyze(clone_id, provider, model=data.model)
    except CloneNotFoundError as exc:
        raise HTTPException(status_code=404, detail=exc.detail) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except AnalysisFailedError as exc:
        raise HTTPException(status_code=502, detail=exc.detail) from exc
    await session.commit()
    return DNAResponse.model_validate(dna, from_attributes=True)


@router.put("/{clone_id}/dna")
async def edit_dna(
    clone_id: str,
    data: DNAEditRequest,
    session: Session,
) -> DNAResponse:
    svc = DNAService(session)
    try:
        dna = await svc.manual_edit(
            clone_id,
            data=data.data,
            prominence_scores=data.prominence_scores,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await session.commit()
    return DNAResponse.model_validate(dna, from_attributes=True)


@router.get("/{clone_id}/dna")
async def get_dna(clone_id: str, session: Session) -> DNAResponse:
    svc = DNAService(session)
    dna = await svc.get_current(clone_id)
    if dna is None:
        raise HTTPException(status_code=404, detail="No DNA found for this clone")
    return DNAResponse.model_validate(dna, from_attributes=True)


@router.get("/{clone_id}/dna/prompt")
async def get_dna_prompt(clone_id: str, session: Session) -> DNAPromptResponse:
    svc = DNAService(session)
    dna = await svc.get_current(clone_id)
    if dna is None:
        raise HTTPException(status_code=404, detail="No DNA found for this clone")
    prompt = DNAService.export_as_prompt(cast(dict[str, Any], dna.data))
    return DNAPromptResponse(prompt=prompt)


@router.get("/{clone_id}/dna/versions")
async def list_dna_versions(clone_id: str, session: Session) -> DNAVersionListResponse:
    svc = DNAService(session)
    versions = await svc.list_versions(clone_id)
    return DNAVersionListResponse(
        items=[DNAVersionResponse.model_validate(v, from_attributes=True) for v in versions],
    )


@router.post("/{clone_id}/dna/revert/{version}", status_code=201)
async def revert_dna(
    clone_id: str,
    version: int,
    session: Session,
) -> DNAResponse:
    svc = DNAService(session)
    try:
        dna = await svc.revert(clone_id, target_version=version)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    await session.commit()
    return DNAResponse.model_validate(dna, from_attributes=True)
