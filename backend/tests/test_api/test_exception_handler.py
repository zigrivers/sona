from httpx import AsyncClient

from app.exceptions import (
    CloneNotFoundError,
    LLMNetworkError,
    ProviderNotConfiguredError,
    SonaError,
)
from app.main import app


async def test_global_handler_returns_404_for_not_found(client: AsyncClient) -> None:
    """Global exception handler should return 404 for not-found errors."""

    @app.get("/api/_test/not-found")
    async def _raise_not_found() -> None:
        raise CloneNotFoundError("test-id")

    response = await client.get("/api/_test/not-found")
    assert response.status_code == 404
    data = response.json()
    assert data["code"] == "CLONE_NOT_FOUND"
    assert "test-id" in data["detail"]


async def test_global_handler_returns_502_for_llm_error(client: AsyncClient) -> None:
    """Global exception handler should return 502 for LLM network errors."""

    @app.get("/api/_test/llm-error")
    async def _raise_llm_error() -> None:
        raise LLMNetworkError(detail="Connection refused", code="LLM_NETWORK_ERROR")

    response = await client.get("/api/_test/llm-error")
    assert response.status_code == 502
    data = response.json()
    assert data["code"] == "LLM_NETWORK_ERROR"
    assert data["detail"] == "Connection refused"


async def test_global_handler_returns_400_for_provider_not_configured(
    client: AsyncClient,
) -> None:
    """Global exception handler should return 400 for PROVIDER_NOT_CONFIGURED."""

    @app.get("/api/_test/no-provider")
    async def _raise_no_provider() -> None:
        raise ProviderNotConfiguredError()

    response = await client.get("/api/_test/no-provider")
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "PROVIDER_NOT_CONFIGURED"


async def test_global_handler_returns_json_with_detail_and_code(
    client: AsyncClient,
) -> None:
    """All SonaError responses should include detail and code fields."""

    @app.get("/api/_test/generic-error")
    async def _raise_generic() -> None:
        raise SonaError(detail="Something failed", code="UNKNOWN_ERROR")

    response = await client.get("/api/_test/generic-error")
    data = response.json()
    assert "detail" in data
    assert "code" in data
    assert data["detail"] == "Something failed"
    assert data["code"] == "UNKNOWN_ERROR"


async def test_generic_exception_returns_500() -> None:
    """Non-SonaError exceptions should return 500 with generic message."""
    from httpx import ASGITransport

    @app.get("/api/_test/unhandled")
    async def _raise_unhandled() -> None:
        raise RuntimeError("unexpected crash")

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/_test/unhandled")

    assert response.status_code == 500
    data = response.json()
    assert data["detail"] == "Internal server error"
    assert data["code"] == "INTERNAL_ERROR"
