"""Provider request/response schemas."""

from pydantic import BaseModel, Field


class ProviderUpdate(BaseModel):
    api_key: str | None = None
    default_model: str | None = None


class ProviderResponse(BaseModel):
    name: str
    is_configured: bool
    masked_key: str | None = None
    default_model: str | None = None
    available_models: list[str] = Field(default_factory=list)


class ProviderTestResponse(BaseModel):
    success: bool
    message: str


class DefaultProviderRequest(BaseModel):
    name: str
