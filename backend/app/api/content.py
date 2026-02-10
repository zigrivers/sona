"""API endpoints for content generation."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated, Any, cast

from fastapi import APIRouter, Depends
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
from app.schemas.content import ContentResponse
from app.services.content_service import ContentService

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
