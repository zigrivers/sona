"""Clone request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CloneCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    tags: list[str] = Field(default_factory=list)


class CloneUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    tags: list[str] | None = None
    is_hidden: bool | None = None


class CloneResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    description: str | None
    tags: list[str]
    type: str
    is_demo: bool
    is_hidden: bool
    avatar_path: str | None
    confidence_score: int
    sample_count: int
    created_at: datetime
    updated_at: datetime


class CloneListResponse(BaseModel):
    items: list[CloneResponse]
    total: int
