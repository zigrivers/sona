"""API endpoints for writing samples."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Form, Response, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.schemas.sample import SampleCreate, SampleListResponse, SampleResponse
from app.services.file_parser import parse_file
from app.services.sample_service import SampleService
from app.services.scraping_service import scrape_url

router = APIRouter()

SessionDep = Annotated[AsyncSession, Depends(get_session)]


class UrlScrapeRequest(BaseModel):
    url: str = Field(min_length=1)
    content_type: str


@router.post(
    "/clones/{clone_id}/samples",
    response_model=SampleResponse,
    status_code=201,
)
async def create_sample_paste(
    clone_id: str,
    body: SampleCreate,
    session: SessionDep,
) -> SampleResponse:
    """Create a writing sample from pasted text."""
    service = SampleService(session)
    sample = await service.create(clone_id, body)
    await session.commit()
    return SampleResponse.model_validate(sample)


@router.post(
    "/clones/{clone_id}/samples/upload",
    response_model=SampleResponse,
    status_code=201,
)
async def create_sample_upload(
    clone_id: str,
    file: UploadFile,
    content_type: Annotated[str, Form()],
    session: SessionDep,
) -> SampleResponse | JSONResponse:
    """Create a writing sample from an uploaded file (.txt, .docx, .pdf)."""
    filename = file.filename or "unknown"
    file_content_type = file.content_type or "application/octet-stream"

    try:
        text = await parse_file(file.file, filename, file_content_type)
    except ValueError as exc:
        return JSONResponse(
            status_code=422,
            content={"detail": str(exc), "code": "VALIDATION_ERROR"},
        )

    data = SampleCreate(
        content=text,
        content_type=content_type,
        source_type="file",
        source_filename=filename,
    )
    service = SampleService(session)
    sample = await service.create(clone_id, data)
    await session.commit()
    return SampleResponse.model_validate(sample)


@router.post(
    "/clones/{clone_id}/samples/url",
    response_model=SampleResponse,
    status_code=201,
)
async def create_sample_url(
    clone_id: str,
    body: UrlScrapeRequest,
    session: SessionDep,
) -> SampleResponse | JSONResponse:
    """Create a writing sample by scraping a URL."""
    try:
        text = await scrape_url(body.url)
    except ValueError as exc:
        return JSONResponse(
            status_code=422,
            content={"detail": str(exc), "code": "SCRAPE_FAILED"},
        )

    data = SampleCreate(
        content=text,
        content_type=body.content_type,
        source_type="url",
        source_url=body.url,
    )
    service = SampleService(session)
    sample = await service.create(clone_id, data)
    await session.commit()
    return SampleResponse.model_validate(sample)


@router.get(
    "/clones/{clone_id}/samples",
    response_model=SampleListResponse,
)
async def list_samples(
    clone_id: str,
    session: SessionDep,
) -> SampleListResponse:
    """List writing samples for a clone, ordered by created_at descending."""
    service = SampleService(session)
    samples, total = await service.list_by_clone(clone_id)
    return SampleListResponse(
        items=[SampleResponse.model_validate(s) for s in samples],
        total=total,
    )


@router.delete(
    "/clones/{clone_id}/samples/{sample_id}",
    status_code=204,
)
async def delete_sample(
    clone_id: str,
    sample_id: str,
    session: SessionDep,
) -> Response:
    """Delete a writing sample."""
    service = SampleService(session)
    await service.delete(sample_id)
    await session.commit()
    return Response(status_code=204)
