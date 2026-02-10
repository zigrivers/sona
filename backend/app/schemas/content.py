"""Content request/response schemas."""

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class Platform(StrEnum):
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    EMAIL = "email"
    BLOG = "blog"
    GENERIC = "generic"


class ContentCreate(BaseModel):
    clone_id: str
    platform: Platform
    input_text: str = Field(min_length=1)
    generation_properties: dict[str, Any] | None = None
    topic: str | None = None
    campaign: str | None = None
    tags: list[str] = Field(default_factory=list)
    preset_id: str | None = None


class ContentUpdate(BaseModel):
    content_current: str | None = None
    status: str | None = None
    topic: str | None = None
    campaign: str | None = None
    tags: list[str] | None = None


class ContentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    clone_id: str
    platform: str
    status: str
    content_current: str
    content_original: str
    input_text: str
    generation_properties: dict[str, Any] | None
    authenticity_score: int | None
    score_dimensions: dict[str, Any] | None
    topic: str | None
    campaign: str | None
    tags: list[str]
    word_count: int
    char_count: int
    preset_id: str | None
    created_at: datetime
    updated_at: datetime


class ContentListResponse(BaseModel):
    items: list[ContentResponse]
    total: int


class ContentVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    version_number: int
    content_text: str
    trigger: str
    word_count: int
    created_at: datetime


class ContentVersionListResponse(BaseModel):
    items: list[ContentVersionResponse]


class GenerateRequest(BaseModel):
    clone_id: str
    platform: Platform
    input_text: str = Field(min_length=1)
    generation_properties: dict[str, Any] | None = None
    preset_id: str | None = None


class BulkStatusRequest(BaseModel):
    ids: list[str] = Field(min_length=1)
    status: str


class BulkDeleteRequest(BaseModel):
    ids: list[str] = Field(min_length=1)


class BulkTagRequest(BaseModel):
    ids: list[str] = Field(min_length=1)
    tags: list[str] = Field(min_length=1)


class FeedbackRegenRequest(BaseModel):
    feedback: str = Field(min_length=1, max_length=1000)


class PartialRegenRequest(BaseModel):
    selection_start: int = Field(ge=0)
    selection_end: int = Field(ge=1)
    feedback: str | None = None


class ContentImport(BaseModel):
    clone_id: str
    platform: Platform
    content_text: str = Field(min_length=1)
    topic: str | None = None
    campaign: str | None = None
    tags: list[str] = Field(default_factory=list)


class BulkResponse(BaseModel):
    count: int
