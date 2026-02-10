"""Provider configuration service — manages API keys, models, and connection testing."""

from pathlib import Path
from typing import Any

from app.config import Settings
from app.constants import PROVIDER_MODELS
from app.exceptions import (
    LLMAuthError,
    LLMNetworkError,
    LLMRateLimitError,
    ProviderNotConfiguredError,
)
from app.schemas.provider import ProviderResponse, ProviderTestResponse, ProviderUpdate

# Map provider name → Settings field for API key
_KEY_ATTRS: dict[str, str] = {
    "openai": "openai_api_key",
    "anthropic": "anthropic_api_key",
    "google": "google_ai_api_key",
}

# Map provider name → Settings field for default model
_MODEL_ATTRS: dict[str, str] = {
    "openai": "default_openai_model",
    "anthropic": "default_anthropic_model",
    "google": "default_google_model",
}


def mask_key(key: str) -> str | None:
    """Mask an API key, showing only the last 4 characters."""
    if not key:
        return None
    if len(key) <= 4:
        return "****"
    return f"****{key[-4:]}"


def update_env_file(env_path: Path, key: str, value: str) -> None:
    """Update or add a key=value pair in a .env file."""
    lines: list[str] = []
    if env_path.exists():
        lines = env_path.read_text().splitlines()

    new_lines: list[str] = []
    found = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith(f"{key}=") or stripped.startswith(f"{key} ="):
            new_lines.append(f"{key}={value}")
            found = True
        else:
            new_lines.append(line)

    if not found:
        new_lines.append(f"{key}={value}")

    env_path.write_text("\n".join(new_lines) + "\n")


class ProviderService:
    """Service for managing LLM provider configuration."""

    def __init__(self, settings: Settings, env_path: Path) -> None:
        self._settings = settings
        self._env_path = env_path

    def list_providers(self) -> list[ProviderResponse]:
        """Return status of all providers."""
        return [self._build_response(name) for name in _KEY_ATTRS]

    def save_provider(self, name: str, update: ProviderUpdate) -> ProviderResponse:
        """Save provider configuration to .env and update in-memory settings."""
        if name not in _KEY_ATTRS:
            raise ProviderNotConfiguredError(name)

        if update.api_key is not None:
            key_attr = _KEY_ATTRS[name]
            env_var = key_attr.upper()
            update_env_file(self._env_path, env_var, update.api_key)
            setattr(self._settings, key_attr, update.api_key)

        if update.default_model is not None:
            model_attr = _MODEL_ATTRS[name]
            model_env = model_attr.upper()
            update_env_file(self._env_path, model_env, update.default_model)
            setattr(self._settings, model_attr, update.default_model)

        return self._build_response(name)

    async def test_connection(self, name: str) -> ProviderTestResponse:
        """Test provider connection by making a minimal API call."""
        if name not in _KEY_ATTRS:
            return ProviderTestResponse(success=False, message=f"Unknown provider: {name}")

        api_key = getattr(self._settings, _KEY_ATTRS[name], "")
        if not api_key:
            return ProviderTestResponse(success=False, message="API key not configured")

        try:
            provider = self._create_provider(name, api_key)
            success = await provider.test_connection()
            if success:
                return ProviderTestResponse(success=True, message="Connection successful")
            return ProviderTestResponse(success=False, message="Connection test failed")
        except LLMAuthError as e:
            return ProviderTestResponse(success=False, message=e.detail)
        except LLMRateLimitError as e:
            return ProviderTestResponse(success=False, message=e.detail)
        except LLMNetworkError as e:
            return ProviderTestResponse(success=False, message=e.detail)

    def set_default_provider(self, name: str) -> ProviderResponse:
        """Set the default LLM provider (must already be configured)."""
        if name not in _KEY_ATTRS:
            raise ProviderNotConfiguredError(name)

        api_key = getattr(self._settings, _KEY_ATTRS[name], "")
        if not api_key:
            raise ProviderNotConfiguredError(name)

        update_env_file(self._env_path, "DEFAULT_LLM_PROVIDER", name)
        self._settings.default_llm_provider = name
        return self._build_response(name)

    def _build_response(self, name: str) -> ProviderResponse:
        api_key = getattr(self._settings, _KEY_ATTRS[name], "")
        return ProviderResponse(
            name=name,
            is_configured=bool(api_key),
            masked_key=mask_key(api_key),
            default_model=getattr(self._settings, _MODEL_ATTRS[name], None),
            available_models=PROVIDER_MODELS.get(name, []),
        )

    def _create_provider(self, name: str, api_key: str) -> Any:
        """Create a provider instance for connection testing."""
        model = getattr(self._settings, _MODEL_ATTRS[name])

        if name == "openai":
            from app.llm.openai import OpenAIProvider

            return OpenAIProvider(api_key=api_key, default_model=model)
        if name == "anthropic":
            from app.llm.anthropic import AnthropicProvider

            return AnthropicProvider(api_key=api_key, default_model=model)
        if name == "google":
            from app.llm.google import GoogleProvider

            return GoogleProvider(api_key=api_key, default_model=model)

        raise ProviderNotConfiguredError(name)
