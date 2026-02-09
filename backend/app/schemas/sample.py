"""Sample request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SampleCreate(BaseModel):
    content: str = Field(min_length=1)
    content_type: str
    source_type: str = "paste"
    source_url: str | None = None
    source_filename: str | None = None


class SampleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    clone_id: str
    content: str
    content_type: str
    content_type_detected: str | None
    word_count: int
    length_category: str | None
    source_type: str
    source_url: str | None
    source_filename: str | None
    created_at: datetime


class SampleListResponse(BaseModel):
    items: list[SampleResponse]
    total: int
