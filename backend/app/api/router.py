"""Central API router. Domain routers are added via include_router."""

from fastapi import APIRouter

api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
