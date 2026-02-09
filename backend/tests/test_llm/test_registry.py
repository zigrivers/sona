"""Tests for LLM provider registry and retry logic."""

from collections.abc import AsyncIterator
from unittest.mock import AsyncMock, patch

import pytest

from app.config import Settings
from app.exceptions import (
    LLMAuthError,
    LLMNetworkError,
    LLMRateLimitError,
    ProviderNotConfiguredError,
)
from app.llm.base import with_retry
from app.llm.registry import ProviderRegistry


class FakeProvider:
    """A fake LLM provider implementing the LLMProvider protocol."""

    async def complete(
        self,
        messages: list[dict],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        return "fake response"

    async def stream(
        self,
        messages: list[dict],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        yield "fake"  # pragma: no cover

    async def count_tokens(self, text: str) -> int:
        return len(text.split())

    async def test_connection(self) -> bool:
        return True


def _make_settings(**overrides: str) -> Settings:
    """Create a Settings instance with test defaults."""
    defaults = {
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
    return Settings(**defaults)


def test_registry_returns_provider_for_configured_key() -> None:
    """Registering a provider and calling get_provider should return an instance."""
    settings = _make_settings(openai_api_key="sk-test-key")
    registry = ProviderRegistry(settings)
    registry.register("openai", lambda: FakeProvider())

    provider = registry.get_provider("openai")

    assert isinstance(provider, FakeProvider)


def test_registry_raises_when_no_key_configured() -> None:
    """get_provider should raise ProviderNotConfiguredError when no API key is set."""
    settings = _make_settings(openai_api_key="")
    registry = ProviderRegistry(settings)
    registry.register("openai", lambda: FakeProvider())

    with pytest.raises(ProviderNotConfiguredError) as exc_info:
        registry.get_provider("openai")

    assert "openai" in exc_info.value.detail.lower()


def test_registry_returns_default_provider() -> None:
    """get_default_provider should return the provider matching default_llm_provider."""
    settings = _make_settings(
        default_llm_provider="anthropic",
        anthropic_api_key="sk-ant-test",
    )
    registry = ProviderRegistry(settings)
    registry.register("anthropic", lambda: FakeProvider())

    provider = registry.get_default_provider()

    assert isinstance(provider, FakeProvider)


def test_registry_list_configured() -> None:
    """list_configured should return only providers with API keys set."""
    settings = _make_settings(
        openai_api_key="sk-test",
        anthropic_api_key="",
        google_ai_api_key="goog-test",
    )
    registry = ProviderRegistry(settings)

    configured = registry.list_configured()

    assert "openai" in configured
    assert "google" in configured
    assert "anthropic" not in configured


@pytest.mark.asyncio
async def test_retry_on_rate_limit_succeeds_after_retry() -> None:
    """with_retry should retry on LLMRateLimitError and return the result."""
    mock_fn = AsyncMock(
        side_effect=[
            LLMRateLimitError(provider="openai", detail="Rate limited"),
            "success",
        ]
    )

    wrapped = with_retry(mock_fn)

    with patch("app.llm.base.asyncio.sleep", new_callable=AsyncMock):
        result = await wrapped()

    assert result == "success"
    assert mock_fn.call_count == 2


@pytest.mark.asyncio
async def test_no_retry_on_auth_error() -> None:
    """with_retry should NOT retry on LLMAuthError — raise immediately."""
    mock_fn = AsyncMock(side_effect=LLMAuthError(provider="openai", detail="Invalid key"))

    wrapped = with_retry(mock_fn)

    with pytest.raises(LLMAuthError), patch("app.llm.base.asyncio.sleep", new_callable=AsyncMock):
        await wrapped()

    assert mock_fn.call_count == 1


@pytest.mark.asyncio
async def test_retry_exhausted_raises_original_error() -> None:
    """with_retry should raise the original error after exhausting retries."""
    error = LLMNetworkError(provider="openai", detail="Connection failed")
    mock_fn = AsyncMock(side_effect=error)

    wrapped = with_retry(mock_fn)

    with (
        pytest.raises(LLMNetworkError),
        patch("app.llm.base.asyncio.sleep", new_callable=AsyncMock),
    ):
        await wrapped()

    # 1 initial + 2 retries = 3 total attempts
    assert mock_fn.call_count == 3
