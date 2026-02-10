"""Tests for provider configuration service."""

from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.config import Settings
from app.exceptions import LLMAuthError, LLMRateLimitError, ProviderNotConfiguredError
from app.services.provider_service import ProviderService, mask_key, update_env_file


def _make_settings(**overrides: str) -> Settings:
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
    return Settings(**defaults)


# --- mask_key ---


def test_mask_key_shows_last_4() -> None:
    assert mask_key("sk-test-key-abcd") == "****abcd"


def test_mask_key_short_key() -> None:
    assert mask_key("abc") == "****"


def test_mask_key_empty_returns_none() -> None:
    assert mask_key("") is None


# --- update_env_file ---


def test_update_env_file_creates_new(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    update_env_file(env, "OPENAI_API_KEY", "sk-test")
    assert env.read_text().strip() == "OPENAI_API_KEY=sk-test"


def test_update_env_file_updates_existing(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    env.write_text("OPENAI_API_KEY=old-key\nOTHER=val\n")
    update_env_file(env, "OPENAI_API_KEY", "new-key")
    content = env.read_text()
    assert "OPENAI_API_KEY=new-key" in content
    assert "OTHER=val" in content
    assert "old-key" not in content


# --- ProviderService.list_providers ---


def test_list_providers_returns_three() -> None:
    settings = _make_settings()
    service = ProviderService(settings=settings, env_path=Path("/tmp/fake.env"))
    providers = service.list_providers()
    assert len(providers) == 3
    names = {p.name for p in providers}
    assert names == {"openai", "anthropic", "google"}


def test_list_providers_shows_configured() -> None:
    settings = _make_settings(openai_api_key="sk-test-key-1234")
    service = ProviderService(settings=settings, env_path=Path("/tmp/fake.env"))
    providers = service.list_providers()
    openai = next(p for p in providers if p.name == "openai")
    assert openai.is_configured is True
    assert openai.masked_key == "****1234"
    anthropic = next(p for p in providers if p.name == "anthropic")
    assert anthropic.is_configured is False
    assert anthropic.masked_key is None


def test_list_providers_includes_available_models() -> None:
    settings = _make_settings()
    service = ProviderService(settings=settings, env_path=Path("/tmp/fake.env"))
    providers = service.list_providers()
    openai = next(p for p in providers if p.name == "openai")
    assert "gpt-4o" in openai.available_models
    assert "gpt-4o-mini" in openai.available_models


# --- ProviderService.save_provider ---


def test_save_provider_writes_env(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    settings = _make_settings()
    service = ProviderService(settings=settings, env_path=env)

    from app.schemas.provider import ProviderUpdate

    service.save_provider("openai", ProviderUpdate(api_key="sk-new-key-abcd"))

    content = env.read_text()
    assert "OPENAI_API_KEY=sk-new-key-abcd" in content


def test_save_provider_returns_masked_key(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    settings = _make_settings()
    service = ProviderService(settings=settings, env_path=env)

    from app.schemas.provider import ProviderUpdate

    result = service.save_provider("openai", ProviderUpdate(api_key="sk-new-key-abcd"))
    assert result.masked_key == "****abcd"
    assert result.is_configured is True


def test_save_provider_updates_settings(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    settings = _make_settings()
    service = ProviderService(settings=settings, env_path=env)

    from app.schemas.provider import ProviderUpdate

    service.save_provider("openai", ProviderUpdate(api_key="sk-new"))
    assert settings.openai_api_key == "sk-new"


def test_save_provider_updates_model(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    settings = _make_settings()
    service = ProviderService(settings=settings, env_path=env)

    from app.schemas.provider import ProviderUpdate

    service.save_provider("openai", ProviderUpdate(default_model="gpt-4o-mini"))
    assert settings.default_openai_model == "gpt-4o-mini"
    content = env.read_text()
    assert "DEFAULT_OPENAI_MODEL=gpt-4o-mini" in content


# --- ProviderService.test_connection ---


async def test_test_connection_success(tmp_path: Path) -> None:
    settings = _make_settings(openai_api_key="sk-valid-key")
    service = ProviderService(settings=settings, env_path=tmp_path / ".env")

    mock_provider = AsyncMock()
    mock_provider.test_connection.return_value = True

    with patch.object(service, "_create_provider", return_value=mock_provider):
        result = await service.test_connection("openai")

    assert result.success is True
    assert result.message == "Connection successful"


async def test_test_connection_auth_failure(tmp_path: Path) -> None:
    settings = _make_settings(openai_api_key="sk-invalid")
    service = ProviderService(settings=settings, env_path=tmp_path / ".env")

    mock_provider = AsyncMock()
    mock_provider.test_connection.side_effect = LLMAuthError(detail="Invalid API key")

    with patch.object(service, "_create_provider", return_value=mock_provider):
        result = await service.test_connection("openai")

    assert result.success is False
    assert "Invalid API key" in result.message


async def test_test_connection_rate_limit(tmp_path: Path) -> None:
    settings = _make_settings(openai_api_key="sk-valid")
    service = ProviderService(settings=settings, env_path=tmp_path / ".env")

    mock_provider = AsyncMock()
    mock_provider.test_connection.side_effect = LLMRateLimitError(detail="Rate limited")

    with patch.object(service, "_create_provider", return_value=mock_provider):
        result = await service.test_connection("openai")

    assert result.success is False
    assert "Rate limited" in result.message


async def test_test_connection_unconfigured(tmp_path: Path) -> None:
    settings = _make_settings()  # no keys
    service = ProviderService(settings=settings, env_path=tmp_path / ".env")

    result = await service.test_connection("openai")
    assert result.success is False
    assert "not configured" in result.message


# --- ProviderService.set_default_provider ---


def test_set_default_provider(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    settings = _make_settings(anthropic_api_key="sk-ant-key")
    service = ProviderService(settings=settings, env_path=env)

    result = service.set_default_provider("anthropic")
    assert result.name == "anthropic"
    assert settings.default_llm_provider == "anthropic"
    content = env.read_text()
    assert "DEFAULT_LLM_PROVIDER=anthropic" in content


def test_set_default_provider_requires_configured(tmp_path: Path) -> None:
    env = tmp_path / ".env"
    settings = _make_settings()  # no keys
    service = ProviderService(settings=settings, env_path=env)

    with pytest.raises(ProviderNotConfiguredError):
        service.set_default_provider("openai")
