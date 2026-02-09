"""Methodology request/response schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MethodologyUpdate(BaseModel):
    content: str = Field(min_length=1)


class MethodologyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    section_key: str
    current_content: str
    created_at: datetime
    updated_at: datetime


class MethodologyVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    settings_id: str
    version_number: int
    content: str
    trigger: str
    created_at: datetime
