"""Provider configuration API routes."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.config import PROJECT_ROOT, settings
from app.schemas.provider import (
    DefaultProviderRequest,
    ProviderResponse,
    ProviderTestResponse,
    ProviderUpdate,
)
from app.services.provider_service import ProviderService

router = APIRouter(prefix="/providers", tags=["providers"])


def get_provider_service() -> ProviderService:
    return ProviderService(settings=settings, env_path=PROJECT_ROOT / ".env")


ServiceDep = Annotated[ProviderService, Depends(get_provider_service)]


@router.get("")
async def list_providers(service: ServiceDep) -> list[ProviderResponse]:
    return service.list_providers()


@router.put("/default")
async def set_default_provider(
    body: DefaultProviderRequest,
    service: ServiceDep,
) -> ProviderResponse:
    return service.set_default_provider(body.name)


@router.put("/{name}")
async def update_provider(
    name: str,
    body: ProviderUpdate,
    service: ServiceDep,
) -> ProviderResponse:
    return service.save_provider(name, body)


@router.post("/{name}/test")
async def test_provider(
    name: str,
    service: ServiceDep,
) -> ProviderTestResponse:
    return await service.test_connection(name)
