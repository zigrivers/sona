"""Generation preset request/response schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class PresetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    properties: dict[str, Any]


class PresetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    properties: dict[str, Any] | None = None


class PresetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    properties: dict[str, Any]
    created_at: datetime
    updated_at: datetime
