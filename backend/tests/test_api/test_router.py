from httpx import AsyncClient

from app.api.router import api_router


def test_api_router_prefix_is_api() -> None:
    """api_router should have /api prefix."""
    assert api_router.prefix == "/api"


async def test_unknown_route_returns_404(client: AsyncClient) -> None:
    """Requesting a route that does not exist should return 404."""
    response = await client.get("/api/nonexistent-route")
    assert response.status_code == 404
