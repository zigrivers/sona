"""LLM provider registry — looks up providers by name and checks configuration."""

from collections.abc import Callable
from typing import ClassVar

from app.config import Settings
from app.exceptions import ProviderNotConfiguredError
from app.llm.base import LLMProvider


class ProviderRegistry:
    """Registry that maps provider names to factory callables.

    Requires a Settings instance (injected for testability) to check
    which API keys are configured.
    """

    _KEY_MAP: ClassVar[dict[str, str]] = {
        "openai": "openai_api_key",
        "anthropic": "anthropic_api_key",
        "google": "google_ai_api_key",
    }

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._factories: dict[str, Callable[[], LLMProvider]] = {}

    def register(self, name: str, factory: Callable[[], LLMProvider]) -> None:
        """Register a provider factory by name."""
        self._factories[name] = factory

    def get_provider(self, name: str) -> LLMProvider:
        """Return a provider instance, raising if the API key is not configured."""
        key_attr = self._KEY_MAP.get(name)
        if key_attr and not getattr(self._settings, key_attr, ""):
            raise ProviderNotConfiguredError(name)

        factory = self._factories.get(name)
        if factory is None:
            raise ProviderNotConfiguredError(name)

        return factory()

    def get_default_provider(self) -> LLMProvider:
        """Return the provider matching settings.default_llm_provider."""
        return self.get_provider(self._settings.default_llm_provider)

    def list_configured(self) -> list[str]:
        """Return names of providers whose API keys are set."""
        return [name for name, attr in self._KEY_MAP.items() if getattr(self._settings, attr, "")]
