"""Tests for methodology API endpoints."""

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.methodology import MethodologySettings, MethodologyVersion

from ..test_services.test_methodology_service import _seed_section


async def _seed_via_db(session: AsyncSession) -> MethodologySettings:
    """Seed a section directly in the test DB."""
    return await _seed_section(session, "voice_cloning", "Default voice cloning instructions.")


class TestGetMethodology:
    async def test_returns_section(self, client: AsyncClient, session: AsyncSession) -> None:
        """GET /api/methodology/{section} returns the section."""
        await _seed_via_db(session)
        await session.commit()

        resp = await client.get("/api/methodology/voice_cloning")

        assert resp.status_code == 200
        data = resp.json()
        assert data["section_key"] == "voice_cloning"
        assert data["current_content"] == "Default voice cloning instructions."

    async def test_returns_404_for_missing_section(self, client: AsyncClient) -> None:
        """GET /api/methodology/{section} returns 404 for unknown section."""
        resp = await client.get("/api/methodology/nonexistent")

        assert resp.status_code == 404


class TestUpdateMethodology:
    async def test_updates_content(self, client: AsyncClient, session: AsyncSession) -> None:
        """PUT /api/methodology/{section} updates the content."""
        await _seed_via_db(session)
        await session.commit()

        resp = await client.put(
            "/api/methodology/voice_cloning",
            json={"content": "Updated instructions."},
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["current_content"] == "Updated instructions."

    async def test_unchanged_content_returns_200(
        self, client: AsyncClient, session: AsyncSession
    ) -> None:
        """PUT with unchanged content returns 200 without new version."""
        await _seed_via_db(session)
        await session.commit()

        resp = await client.put(
            "/api/methodology/voice_cloning",
            json={"content": "Default voice cloning instructions."},
        )

        assert resp.status_code == 200

    async def test_returns_404_for_missing_section(self, client: AsyncClient) -> None:
        """PUT /api/methodology/{section} returns 404 for unknown section."""
        resp = await client.put(
            "/api/methodology/nonexistent",
            json={"content": "Something"},
        )

        assert resp.status_code == 404


class TestListVersions:
    async def test_returns_versions(self, client: AsyncClient, session: AsyncSession) -> None:
        """GET /api/methodology/{section}/versions returns version history."""
        seed = await _seed_via_db(session)
        # Add a second version
        v2 = MethodologyVersion(
            settings_id=seed.id,
            version_number=2,
            content="Updated",
            trigger="manual_edit",
        )
        session.add(v2)
        await session.commit()

        resp = await client.get("/api/methodology/voice_cloning/versions")

        assert resp.status_code == 200
        data = resp.json()
        assert len(data) <= 10
        assert data[0]["version_number"] == 2

    async def test_returns_empty_for_missing_section(self, client: AsyncClient) -> None:
        """GET /api/methodology/{section}/versions returns empty for unknown section."""
        resp = await client.get("/api/methodology/nonexistent/versions")

        assert resp.status_code == 200
        assert resp.json() == []


class TestRevert:
    async def test_reverts_to_version(self, client: AsyncClient, session: AsyncSession) -> None:
        """POST /api/methodology/{section}/revert/{version} creates revert."""
        seed = await _seed_via_db(session)
        v2 = MethodologyVersion(
            settings_id=seed.id,
            version_number=2,
            content="Version 2 content",
            trigger="manual_edit",
        )
        session.add(v2)
        seed.current_content = "Version 2 content"
        await session.commit()

        resp = await client.post("/api/methodology/voice_cloning/revert/1")

        assert resp.status_code == 200
        data = resp.json()
        assert data["current_content"] == "Default voice cloning instructions."

    async def test_returns_404_for_missing_version(
        self, client: AsyncClient, session: AsyncSession
    ) -> None:
        """POST revert with non-existent version returns 404."""
        await _seed_via_db(session)
        await session.commit()

        resp = await client.post("/api/methodology/voice_cloning/revert/999")

        assert resp.status_code == 404

    async def test_returns_404_for_missing_section(self, client: AsyncClient) -> None:
        """POST revert with non-existent section returns 404."""
        resp = await client.post("/api/methodology/nonexistent/revert/1")

        assert resp.status_code == 404
