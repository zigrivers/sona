"""LLM provider protocol and retry decorator."""

import asyncio
import functools
from collections.abc import AsyncIterator, Awaitable, Callable
from typing import Protocol, runtime_checkable

from app.exceptions import LLMAuthError, LLMNetworkError, LLMQuotaError, LLMRateLimitError

_MAX_RETRIES = 2
_BACKOFF_DELAYS = (1.0, 3.0)
_RETRYABLE = (LLMRateLimitError, LLMNetworkError)
_NON_RETRYABLE = (LLMAuthError, LLMQuotaError)


@runtime_checkable
class LLMProvider(Protocol):
    """Protocol that all LLM providers must implement."""

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str: ...

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]: ...

    async def count_tokens(self, text: str) -> int: ...

    async def test_connection(self) -> bool: ...


def with_retry[T, **P](
    fn: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T]]:
    """Wrap an async callable with retry logic for transient LLM errors.

    Retries up to 2 times (3 total attempts) on LLMRateLimitError and LLMNetworkError.
    Raises immediately on LLMAuthError and LLMQuotaError.
    """

    @functools.wraps(fn)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        last_error: Exception | None = None
        for attempt in range(_MAX_RETRIES + 1):
            try:
                return await fn(*args, **kwargs)
            except _NON_RETRYABLE:
                raise
            except _RETRYABLE as exc:
                last_error = exc
                if attempt < _MAX_RETRIES:
                    await asyncio.sleep(_BACKOFF_DELAYS[attempt])
        raise last_error  # type: ignore[misc]

    return wrapper
