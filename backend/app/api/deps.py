"""Shared FastAPI dependencies for route handlers."""

from typing import Any

from app.database import get_session as get_session
from app.exceptions import ProviderNotConfiguredError


async def get_llm_provider() -> Any:
    """Return the default LLM provider from the registry.

    Raises ProviderNotConfiguredError until an LLM provider is configured.
    """
    raise ProviderNotConfiguredError()
