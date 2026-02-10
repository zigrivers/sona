"""Tests for clone API endpoints."""

from datetime import UTC, datetime

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import VoiceClone
from app.models.sample import WritingSample


async def _create_clone(
    session: AsyncSession,
    *,
    name: str = "Test Clone",
    is_demo: bool = False,
    clone_type: str = "original",
    deleted_at: datetime | None = None,
) -> VoiceClone:
    clone = VoiceClone(name=name, is_demo=is_demo, type=clone_type, deleted_at=deleted_at)
    session.add(clone)
    await session.commit()
    return clone


async def test_create_clone_endpoint(client: AsyncClient) -> None:
    """POST /api/clones should create a clone and return 201."""
    response = await client.post(
        "/api/clones",
        json={"name": "Marketing Voice", "description": "Brand voice", "tags": ["brand"]},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Marketing Voice"
    assert data["description"] == "Brand voice"
    assert data["tags"] == ["brand"]
    assert data["type"] == "original"
    assert "id" in data


async def test_list_clones_endpoint(client: AsyncClient, session: AsyncSession) -> None:
    """GET /api/clones should return paginated list."""
    await _create_clone(session, name="Clone A")
    await _create_clone(session, name="Clone B")

    response = await client.get("/api/clones")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


async def test_list_clones_filters_by_type(client: AsyncClient, session: AsyncSession) -> None:
    """GET /api/clones?type=original should filter by type."""
    await _create_clone(session, name="Original", clone_type="original")
    await _create_clone(session, name="Merged", clone_type="merged")

    response = await client.get("/api/clones?type=original")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Original"


async def test_list_clones_searches_by_name(client: AsyncClient, session: AsyncSession) -> None:
    """GET /api/clones?search=marketing should search by name."""
    await _create_clone(session, name="Marketing Voice")
    await _create_clone(session, name="Sales Voice")

    response = await client.get("/api/clones?search=marketing")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1


async def test_get_clone_endpoint(client: AsyncClient, session: AsyncSession) -> None:
    """GET /api/clones/{id} should return clone detail."""
    clone = await _create_clone(session, name="My Clone")

    response = await client.get(f"/api/clones/{clone.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "My Clone"
    assert "sample_count" in data
    assert "confidence_score" in data


async def test_get_clone_not_found(client: AsyncClient) -> None:
    """GET /api/clones/{id} with missing ID should return 404."""
    response = await client.get("/api/clones/nonexistent")

    assert response.status_code == 404
    assert response.json()["code"] == "CLONE_NOT_FOUND"


async def test_update_clone_endpoint(client: AsyncClient, session: AsyncSession) -> None:
    """PUT /api/clones/{id} should update and return the clone."""
    clone = await _create_clone(session, name="Old Name")

    response = await client.put(f"/api/clones/{clone.id}", json={"name": "New Name"})

    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


async def test_delete_clone_endpoint(client: AsyncClient, session: AsyncSession) -> None:
    """DELETE /api/clones/{id} should return 204 and soft-delete the clone."""
    clone = await _create_clone(session, name="Delete Me")
    clone_id = clone.id

    response = await client.delete(f"/api/clones/{clone_id}")

    assert response.status_code == 204

    # Clone should still exist in DB with deleted_at set
    from sqlalchemy import select

    session.expire_all()
    result = await session.execute(select(VoiceClone).where(VoiceClone.id == clone_id))
    db_clone = result.scalar_one_or_none()
    assert db_clone is not None
    assert db_clone.deleted_at is not None


async def test_delete_demo_clone_rejected(client: AsyncClient, session: AsyncSession) -> None:
    """DELETE /api/clones/{id} for demo clone should return 400."""
    clone = await _create_clone(session, name="Demo", is_demo=True)

    response = await client.delete(f"/api/clones/{clone.id}")

    assert response.status_code == 400
    assert response.json()["code"] == "DEMO_CLONE_READONLY"


async def test_confidence_score_nonzero_with_samples(
    client: AsyncClient, session: AsyncSession
) -> None:
    """GET /api/clones/{id} should return a non-zero confidence score when samples exist."""
    clone = await _create_clone(session, name="Scored Clone")
    sample = WritingSample(
        clone_id=clone.id,
        content="Hello world " * 100,
        content_type="blog",
        word_count=200,
        length_category="medium",
        source_type="paste",
    )
    session.add(sample)
    await session.commit()

    response = await client.get(f"/api/clones/{clone.id}")

    assert response.status_code == 200
    data = response.json()
    assert data["confidence_score"] > 0
    assert data["sample_count"] == 1


# ── Soft-Delete API Tests ──────────────────────────────────────────────


async def test_restore_clone_returns_200(client: AsyncClient, session: AsyncSession) -> None:
    """POST /api/clones/{id}/restore should restore a soft-deleted clone."""
    clone = await _create_clone(session, name="Restore Me", deleted_at=datetime.now(UTC))

    response = await client.post(f"/api/clones/{clone.id}/restore")

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Restore Me"
    assert data["deleted_at"] is None


async def test_restore_not_found_404(client: AsyncClient) -> None:
    """POST /api/clones/{id}/restore with missing ID should return 404."""
    response = await client.post("/api/clones/nonexistent/restore")

    assert response.status_code == 404


async def test_list_deleted_returns_soft_deleted(
    client: AsyncClient, session: AsyncSession
) -> None:
    """GET /api/clones/deleted should return soft-deleted clones."""
    await _create_clone(session, name="Active Clone")
    await _create_clone(session, name="Deleted Clone", deleted_at=datetime.now(UTC))

    response = await client.get("/api/clones/deleted")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Deleted Clone"


async def test_deleted_clone_excluded_from_list(
    client: AsyncClient, session: AsyncSession
) -> None:
    """GET /api/clones should not include soft-deleted clones."""
    await _create_clone(session, name="Active")
    await _create_clone(session, name="Deleted", deleted_at=datetime.now(UTC))

    response = await client.get("/api/clones")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Active"
