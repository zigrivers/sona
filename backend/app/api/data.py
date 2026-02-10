"""API routes for database stats, backup, and restore."""

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_session
from app.config import settings
from app.schemas.data import DatabaseStatsResponse, RestoreResponse
from app.services.data_service import DataService

router = APIRouter(prefix="/data", tags=["data"])


def get_db_path() -> Path:
    """Parse the database file path from the configured database URL."""
    url = settings.database_url
    # Strip sqlite+aiosqlite:/// prefix
    return Path(url.split("///", 1)[1])


SessionDep = Annotated[AsyncSession, Depends(get_session)]
DbPathDep = Annotated[Path, Depends(get_db_path)]


@router.get("/stats")
async def get_stats(session: SessionDep, db_path: DbPathDep) -> DatabaseStatsResponse:
    service = DataService(session, db_path)
    return await service.get_stats()


@router.get("/backup")
async def backup_database(db_path: DbPathDep) -> FileResponse:
    return FileResponse(
        path=db_path,
        filename="sona-backup.db",
        media_type="application/octet-stream",
    )


@router.post("/restore", response_model=None)
async def restore_database(
    file: UploadFile, session: SessionDep, db_path: DbPathDep
) -> RestoreResponse | JSONResponse:
    service = DataService(session, db_path)
    try:
        service.restore(file.file)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"detail": str(exc)})

    # Re-read stats from the new database
    stats = await service.get_stats()
    return RestoreResponse(
        success=True,
        message="Database restored successfully",
        stats=stats,
    )
