"""Tests for provider configuration API routes."""

from pathlib import Path
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

from app.config import Settings
from app.main import app
from app.services.provider_service import ProviderService


def _make_service(tmp_path: Path, **overrides: str) -> ProviderService:
    defaults: dict[str, str] = {
        "database_url": "sqlite+aiosqlite://",
        "openai_api_key": "",
        "anthropic_api_key": "",
        "google_ai_api_key": "",
        "default_llm_provider": "openai",
        "default_openai_model": "gpt-4o",
        "default_anthropic_model": "claude-sonnet-4-5-20250929",
        "default_google_model": "gemini-2.0-flash",
    }
    defaults.update(overrides)
    settings = Settings(**defaults)
    return ProviderService(settings=settings, env_path=tmp_path / ".env")


def _override_service(service: ProviderService) -> None:
    from app.api.providers import get_provider_service

    app.dependency_overrides[get_provider_service] = lambda: service


async def test_get_providers_returns_list(client: AsyncClient, tmp_path: Path) -> None:
    _override_service(_make_service(tmp_path, openai_api_key="sk-test-1234"))

    response = await client.get("/api/providers")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    names = {p["name"] for p in data}
    assert names == {"openai", "anthropic", "google"}
    openai = next(p for p in data if p["name"] == "openai")
    assert openai["is_configured"] is True
    assert openai["masked_key"] == "****1234"


async def test_put_provider_saves_key(client: AsyncClient, tmp_path: Path) -> None:
    service = _make_service(tmp_path)
    _override_service(service)

    response = await client.put("/api/providers/openai", json={"api_key": "sk-new-key-9999"})
    assert response.status_code == 200
    data = response.json()
    assert data["is_configured"] is True
    assert data["masked_key"] == "****9999"

    env_content = (tmp_path / ".env").read_text()
    assert "OPENAI_API_KEY=sk-new-key-9999" in env_content


async def test_post_provider_test_success(client: AsyncClient, tmp_path: Path) -> None:
    service = _make_service(tmp_path, openai_api_key="sk-valid-key")
    _override_service(service)

    mock_provider = AsyncMock()
    mock_provider.test_connection.return_value = True

    with patch.object(service, "_create_provider", return_value=mock_provider):
        response = await client.post("/api/providers/openai/test")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Connection successful"


async def test_post_provider_test_auth_failure(client: AsyncClient, tmp_path: Path) -> None:
    from app.exceptions import LLMAuthError

    service = _make_service(tmp_path, openai_api_key="sk-bad-key")
    _override_service(service)

    mock_provider = AsyncMock()
    mock_provider.test_connection.side_effect = LLMAuthError(detail="Invalid API key")

    with patch.object(service, "_create_provider", return_value=mock_provider):
        response = await client.post("/api/providers/openai/test")

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is False
    assert "Invalid API key" in data["message"]


async def test_put_default_provider(client: AsyncClient, tmp_path: Path) -> None:
    service = _make_service(tmp_path, anthropic_api_key="sk-ant-key")
    _override_service(service)

    response = await client.put("/api/providers/default", json={"name": "anthropic"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "anthropic"
