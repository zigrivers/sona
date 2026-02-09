"""Voice DNA response schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class DNAResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    clone_id: str
    version_number: int
    data: dict[str, Any]
    prominence_scores: dict[str, Any] | None
    trigger: str
    model_used: str
    created_at: datetime


class DNAVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    clone_id: str
    version_number: int
    data: dict[str, Any]
    prominence_scores: dict[str, Any] | None
    trigger: str
    model_used: str
    created_at: datetime


class DNAVersionListResponse(BaseModel):
    items: list[DNAVersionResponse]
