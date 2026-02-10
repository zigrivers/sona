from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.config import PROJECT_ROOT
from app.database import Base, async_session, engine
from app.exceptions import SonaError
from app.seed import seed_demo_clones, seed_methodology_defaults

STATUS_MAP: dict[str, int] = {
    "CLONE_NOT_FOUND": 404,
    "SAMPLE_NOT_FOUND": 404,
    "CONTENT_NOT_FOUND": 404,
    "PRESET_NOT_FOUND": 404,
    "PROVIDER_NOT_CONFIGURED": 400,
    "ANALYSIS_FAILED": 502,
    "LLM_AUTH_ERROR": 401,
    "LLM_RATE_LIMIT": 429,
    "LLM_NETWORK_ERROR": 502,
    "LLM_QUOTA_ERROR": 402,
    "VALIDATION_ERROR": 422,
    "DEMO_CLONE_READONLY": 400,
}


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None]:
    data_dir = PROJECT_ROOT / "data"
    data_dir.mkdir(exist_ok=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        await seed_methodology_defaults(session)
        await seed_demo_clones(session)
        await session.commit()

    yield

    await engine.dispose()


app = FastAPI(title="Sona", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(SonaError)
async def sona_error_handler(_request: Request, exc: SonaError) -> JSONResponse:
    status_code = STATUS_MAP.get(exc.code, 400)
    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.detail, "code": exc.code},
    )


@app.exception_handler(Exception)
async def generic_error_handler(_request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "code": "INTERNAL_ERROR"},
    )
