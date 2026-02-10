"""Central API router. Domain routers are added via include_router."""

from fastapi import APIRouter

from app.api.methodology import router as methodology_router

api_router = APIRouter(prefix="/api")
api_router.include_router(methodology_router)


@api_router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
