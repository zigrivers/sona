"""Tests for clone API endpoints."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import VoiceClone


async def _create_clone(
    session: AsyncSession,
    *,
    name: str = "Test Clone",
    is_demo: bool = False,
    clone_type: str = "original",
) -> VoiceClone:
    clone = VoiceClone(name=name, is_demo=is_demo, type=clone_type)
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
    """DELETE /api/clones/{id} should return 204."""
    clone = await _create_clone(session, name="Delete Me")

    response = await client.delete(f"/api/clones/{clone.id}")

    assert response.status_code == 204


async def test_delete_demo_clone_rejected(client: AsyncClient, session: AsyncSession) -> None:
    """DELETE /api/clones/{id} for demo clone should return 400."""
    clone = await _create_clone(session, name="Demo", is_demo=True)

    response = await client.delete(f"/api/clones/{clone.id}")

    assert response.status_code == 400
    assert response.json()["code"] == "DEMO_CLONE_READONLY"
