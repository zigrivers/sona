"""API endpoints for content generation."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends, Form, Query, UploadFile
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_llm_provider, get_session
from app.exceptions import CloneNotFoundError
from app.llm.base import LLMProvider
from app.llm.prompts import build_generation_prompt
from app.models.clone import VoiceClone
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings
from app.schemas.content import (
    BulkDeleteRequest,
    BulkResponse,
    BulkStatusRequest,
    BulkTagRequest,
    ContentImport,
    ContentListResponse,
    ContentResponse,
    ContentUpdate,
    ContentVersionListResponse,
    ContentVersionResponse,
    FeedbackRegenRequest,
    PartialRegenRequest,
)
from app.schemas.detection import DetectionResponse
from app.schemas.scoring import AuthenticityScoreResponse
from app.services.content_service import ContentService
from app.services.detection_service import DetectionService
from app.services.file_parser import parse_file
from app.services.scoring_service import ScoringService

router = APIRouter(prefix="/content", tags=["content"])

SessionDep = Annotated[AsyncSession, Depends(get_session)]
ProviderDep = Annotated[LLMProvider, Depends(get_llm_provider)]


class MultiPlatformGenerateRequest(BaseModel):
    clone_id: str
    platforms: list[str] = Field(min_length=1)
    input_text: str = Field(min_length=1)
    properties: dict[str, Any] | None = None
    preset_id: str | None = None


class MultiPlatformGenerateResponse(BaseModel):
    items: list[ContentResponse]


class StreamGenerateRequest(BaseModel):
    clone_id: str
    platform: str
    input_text: str = Field(min_length=1)
    properties: dict[str, Any] | None = None


@router.post("/generate", response_model=None, status_code=201)
async def generate_content(
    body: MultiPlatformGenerateRequest,
    session: SessionDep,
    provider: ProviderDep,
) -> MultiPlatformGenerateResponse | JSONResponse:
    """Generate content for one or more platforms."""
    service = ContentService(session, provider)

    try:
        results = await service.generate(
            clone_id=body.clone_id,
            platforms=body.platforms,
            input_text=body.input_text,
            properties=body.properties,
        )
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc), "code": "DNA_REQUIRED"},
        )

    await session.commit()

    return MultiPlatformGenerateResponse(
        items=[ContentResponse.model_validate(c) for c in results],
    )


@router.post("/generate/stream")
async def stream_generate_content(
    body: StreamGenerateRequest,
    session: SessionDep,
    provider: ProviderDep,
) -> StreamingResponse:
    """Stream content generation via Server-Sent Events."""
    # Validate clone exists
    result = await session.execute(select(VoiceClone).where(VoiceClone.id == body.clone_id))
    clone = result.scalar_one_or_none()
    if clone is None:
        raise CloneNotFoundError(body.clone_id)

    # Get latest DNA
    result = await session.execute(
        select(VoiceDNAVersion)
        .where(VoiceDNAVersion.clone_id == body.clone_id)
        .order_by(VoiceDNAVersion.version_number.desc())
        .limit(1)
    )
    dna = result.scalar_one_or_none()
    if dna is None:
        msg = "Analyze Voice DNA before generating content"
        raise ValueError(msg)

    # Get methodology
    result = await session.execute(
        select(MethodologySettings).where(
            MethodologySettings.section_key == "voice_cloning_instructions"
        )
    )
    methodology_settings = result.scalar_one_or_none()
    methodology = methodology_settings.current_content if methodology_settings else None

    raw_data = cast(dict[str, Any], dna.data)  # pyright: ignore[reportUnknownMemberType]
    dna_data: dict[str, str] = {str(k): str(v) for k, v in raw_data.items()}

    props_for_prompt: dict[str, str] | None = None
    if body.properties:
        props_for_prompt = {k: str(v) for k, v in body.properties.items()}

    messages = build_generation_prompt(
        dna=dna_data,
        platform=body.platform,
        input_text=body.input_text,
        properties=props_for_prompt,
    )

    if methodology:
        system_msg = messages[0]["content"]
        messages[0]["content"] = f"{system_msg}\n\nMethodology: {methodology}"

    async def event_generator() -> AsyncIterator[str]:
        async for chunk in provider.stream(messages):  # pyright: ignore[reportGeneralTypeIssues,reportUnknownVariableType]
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )


@router.get("", response_model=ContentListResponse)
async def list_content(
    session: SessionDep,
    clone_id: str | None = None,
    platform: str | None = None,
    status: str | None = None,
    search: str | None = None,
    sort: str | None = None,
    order: str | None = None,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ContentListResponse:
    """List content with optional filters, search, sort, and pagination."""
    service = ContentService(session)
    items, total = await service.list(
        clone_id=clone_id,
        platform=platform,
        status=status,
        search=search,
        sort=sort,
        order=order,
        offset=offset,
        limit=limit,
    )
    return ContentListResponse(
        items=[ContentResponse.model_validate(c) for c in items],
        total=total,
    )


@router.post("/import", response_model=ContentResponse, status_code=201)
async def import_content(
    body: ContentImport,
    session: SessionDep,
) -> ContentResponse:
    """Import existing content as a draft."""
    service = ContentService(session)
    content = await service.import_content(
        clone_id=body.clone_id,
        platform=body.platform,
        content_text=body.content_text,
        topic=body.topic,
        campaign=body.campaign,
        tags=body.tags,
    )
    await session.commit()
    return ContentResponse.model_validate(content)


@router.post("/import/upload", response_model=ContentResponse, status_code=201)
async def import_content_upload(
    file: UploadFile,
    clone_id: Annotated[str, Form()],
    platform: Annotated[str, Form()],
    session: SessionDep,
) -> ContentResponse | JSONResponse:
    """Import content from an uploaded file."""
    try:
        content_text = await parse_file(
            file.file,
            filename=file.filename or "unknown",
            content_type=file.content_type or "application/octet-stream",
        )
    except ValueError as exc:
        return JSONResponse(
            status_code=422,
            content={"detail": str(exc), "code": "UNSUPPORTED_FILE"},
        )

    service = ContentService(session)
    content = await service.import_content(
        clone_id=clone_id,
        platform=platform,
        content_text=content_text,
    )
    await session.commit()
    return ContentResponse.model_validate(content)


@router.post("/bulk/status", response_model=BulkResponse)
async def bulk_update_status(
    body: BulkStatusRequest,
    session: SessionDep,
) -> BulkResponse:
    """Update status for multiple content items."""
    service = ContentService(session)
    count = await service.bulk_update_status(body.ids, body.status)
    await session.commit()
    return BulkResponse(count=count)


@router.post("/bulk/delete", response_model=BulkResponse)
async def bulk_delete_content(
    body: BulkDeleteRequest,
    session: SessionDep,
) -> BulkResponse:
    """Delete multiple content items."""
    service = ContentService(session)
    count = await service.bulk_delete(body.ids)
    await session.commit()
    return BulkResponse(count=count)


@router.post("/bulk/tag", response_model=BulkResponse)
async def bulk_add_tags(
    body: BulkTagRequest,
    session: SessionDep,
) -> BulkResponse:
    """Add tags to multiple content items."""
    service = ContentService(session)
    count = await service.bulk_add_tags(body.ids, body.tags)
    await session.commit()
    return BulkResponse(count=count)


@router.get("/{content_id}", response_model=ContentResponse)
async def get_content(
    content_id: str,
    session: SessionDep,
    provider: ProviderDep,
) -> ContentResponse:
    """Get a single content item by ID."""
    service = ContentService(session, provider)
    content = await service.get_by_id(content_id)
    return ContentResponse.model_validate(content)


@router.put("/{content_id}", response_model=ContentResponse)
async def update_content(
    content_id: str,
    body: ContentUpdate,
    session: SessionDep,
    provider: ProviderDep,
) -> ContentResponse:
    """Update a content item (text, status, metadata)."""
    service = ContentService(session, provider)
    content = await service.update(content_id, body)
    await session.commit()
    return ContentResponse.model_validate(content)


@router.delete("/{content_id}", status_code=204)
async def delete_content(
    content_id: str,
    session: SessionDep,
    provider: ProviderDep,
) -> None:
    """Delete a content item and its versions."""
    service = ContentService(session, provider)
    await service.delete(content_id)
    await session.commit()


@router.get("/{content_id}/versions", response_model=ContentVersionListResponse)
async def list_content_versions(
    content_id: str,
    session: SessionDep,
    provider: ProviderDep,
) -> ContentVersionListResponse:
    """List all versions of a content item, newest first."""
    service = ContentService(session, provider)
    versions = await service.list_versions(content_id)
    return ContentVersionListResponse(
        items=[ContentVersionResponse.model_validate(v) for v in versions],
    )


@router.post("/{content_id}/restore/{version}", response_model=ContentResponse)
async def restore_content_version(
    content_id: str,
    version: int,
    session: SessionDep,
    provider: ProviderDep,
) -> ContentResponse | JSONResponse:
    """Restore content to a previous version."""
    service = ContentService(session, provider)
    try:
        content = await service.restore_version(content_id, version)
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc), "code": "VERSION_NOT_FOUND"},
        )
    await session.commit()
    return ContentResponse.model_validate(content)


@router.post("/{content_id}/feedback-regen", response_model=ContentResponse)
async def feedback_regen(
    content_id: str,
    body: FeedbackRegenRequest,
    session: SessionDep,
    provider: ProviderDep,
) -> ContentResponse | JSONResponse:
    """Regenerate content incorporating user feedback."""
    service = ContentService(session, provider)
    try:
        content = await service.feedback_regen(content_id, body.feedback)
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc), "code": "DNA_REQUIRED"},
        )
    await session.commit()
    return ContentResponse.model_validate(content)


@router.post("/{content_id}/partial-regen", response_model=ContentResponse)
async def partial_regen(
    content_id: str,
    body: PartialRegenRequest,
    session: SessionDep,
    provider: ProviderDep,
) -> ContentResponse | JSONResponse:
    """Regenerate only the selected portion of content."""
    service = ContentService(session, provider)
    try:
        content = await service.partial_regen(
            content_id,
            body.selection_start,
            body.selection_end,
            feedback=body.feedback,
        )
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc), "code": "INVALID_SELECTION"},
        )
    await session.commit()
    return ContentResponse.model_validate(content)


@router.post("/{content_id}/score", response_model=AuthenticityScoreResponse)
async def score_content(
    content_id: str,
    session: SessionDep,
    provider: ProviderDep,
) -> AuthenticityScoreResponse | JSONResponse:
    """Score content for voice authenticity across 8 dimensions."""
    service = ScoringService(session, provider)
    try:
        content = await service.score(content_id)
    except ValueError as exc:
        return JSONResponse(
            status_code=400,
            content={"detail": str(exc), "code": "DNA_REQUIRED"},
        )
    await session.commit()
    return AuthenticityScoreResponse(
        overall_score=content.authenticity_score,  # type: ignore[arg-type]
        dimensions=content.score_dimensions["dimensions"],  # type: ignore[index]
    )


@router.post("/{content_id}/detect", response_model=DetectionResponse)
async def detect_content(
    content_id: str,
    session: SessionDep,
    provider: ProviderDep,
) -> DetectionResponse:
    """Analyze content for AI-detectable signals."""
    service = DetectionService(session, provider)
    return await service.detect(content_id)
