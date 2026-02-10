"""Tests for preset API endpoints."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.preset import GenerationPreset


async def _create_preset(
    session: AsyncSession, name: str = "Test Preset", properties: dict | None = None
) -> GenerationPreset:
    import nanoid

    preset = GenerationPreset(
        id=nanoid.generate(),
        name=name,
        properties=properties or {"length": "medium"},
    )
    session.add(preset)
    await session.flush()
    return preset


class TestListPresets:
    async def test_empty_list(self, client: httpx.AsyncClient) -> None:
        resp = await client.get("/api/presets")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_returns_presets(self, client: httpx.AsyncClient, session: AsyncSession) -> None:
        await _create_preset(session, "Alpha")
        await _create_preset(session, "Beta")
        await session.commit()

        resp = await client.get("/api/presets")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        assert data[0]["name"] == "Alpha"


class TestCreatePreset:
    async def test_creates_preset(self, client: httpx.AsyncClient) -> None:
        resp = await client.post(
            "/api/presets",
            json={"name": "My Preset", "properties": {"tone": 80}},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "My Preset"
        assert data["properties"] == {"tone": 80}
        assert "id" in data

    async def test_empty_name_rejected(self, client: httpx.AsyncClient) -> None:
        resp = await client.post(
            "/api/presets",
            json={"name": "", "properties": {}},
        )
        assert resp.status_code == 422


class TestGetPreset:
    async def test_get_existing(self, client: httpx.AsyncClient, session: AsyncSession) -> None:
        preset = await _create_preset(session)
        await session.commit()

        resp = await client.get(f"/api/presets/{preset.id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Preset"

    async def test_get_nonexistent(self, client: httpx.AsyncClient) -> None:
        resp = await client.get("/api/presets/nonexistent")
        assert resp.status_code == 404


class TestUpdatePreset:
    async def test_update_name(self, client: httpx.AsyncClient, session: AsyncSession) -> None:
        preset = await _create_preset(session)
        await session.commit()

        resp = await client.put(
            f"/api/presets/{preset.id}",
            json={"name": "Updated"},
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"

    async def test_update_nonexistent(self, client: httpx.AsyncClient) -> None:
        resp = await client.put(
            "/api/presets/nonexistent",
            json={"name": "X"},
        )
        assert resp.status_code == 404


class TestDeletePreset:
    async def test_delete_existing(self, client: httpx.AsyncClient, session: AsyncSession) -> None:
        preset = await _create_preset(session)
        await session.commit()

        resp = await client.delete(f"/api/presets/{preset.id}")
        assert resp.status_code == 204

        resp = await client.get(f"/api/presets/{preset.id}")
        assert resp.status_code == 404

    async def test_delete_nonexistent(self, client: httpx.AsyncClient) -> None:
        resp = await client.delete("/api/presets/nonexistent")
        assert resp.status_code == 404
