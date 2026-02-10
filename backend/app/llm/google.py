"""Google AI (Gemini) LLM provider implementation."""

# pyright: reportPrivateImportUsage=false, reportUnknownMemberType=false

from collections.abc import AsyncIterator
from typing import Any

import google.generativeai as genai  # type: ignore[import-untyped]
from google.api_core import exceptions as google_exceptions

from app.exceptions import LLMAuthError, LLMNetworkError, LLMRateLimitError

_AUTH_ERRORS = (google_exceptions.PermissionDenied, google_exceptions.Unauthenticated)
_RATE_ERRORS = (google_exceptions.ResourceExhausted,)
_NETWORK_ERRORS = (google_exceptions.ServiceUnavailable,)


def _to_contents(messages: list[dict[str, str]]) -> list[str]:
    """Convert role/content message dicts to a flat list of strings for Gemini."""
    parts: list[str] = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg["content"]
        if role == "system":
            parts.append(f"[System instruction]: {content}")
        else:
            parts.append(content)
    return parts


class GoogleProvider:
    """LLM provider backed by Google's Generative AI (Gemini) API."""

    def __init__(self, api_key: str, default_model: str = "gemini-2.0-flash") -> None:
        genai.configure(api_key=api_key)
        self._model: Any = genai.GenerativeModel(default_model)
        self._default_model = default_model

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        target = self._model if model is None else genai.GenerativeModel(model)
        contents = _to_contents(messages)

        try:
            response = await target.generate_content_async(
                contents,
                generation_config={"temperature": temperature, "max_output_tokens": max_tokens},
            )
        except _AUTH_ERRORS as exc:
            raise LLMAuthError(provider="google", detail=str(exc)) from exc
        except _RATE_ERRORS as exc:
            raise LLMRateLimitError(provider="google", detail=str(exc)) from exc
        except _NETWORK_ERRORS as exc:
            raise LLMNetworkError(provider="google", detail=str(exc)) from exc

        return str(response.text)

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        target = self._model if model is None else genai.GenerativeModel(model)
        contents = _to_contents(messages)

        try:
            response = await target.generate_content_async(
                contents,
                generation_config={"temperature": temperature, "max_output_tokens": max_tokens},
                stream=True,
            )
        except _AUTH_ERRORS as exc:
            raise LLMAuthError(provider="google", detail=str(exc)) from exc
        except _RATE_ERRORS as exc:
            raise LLMRateLimitError(provider="google", detail=str(exc)) from exc
        except _NETWORK_ERRORS as exc:
            raise LLMNetworkError(provider="google", detail=str(exc)) from exc

        async for chunk in response:
            yield str(chunk.text)

    async def count_tokens(self, text: str) -> int:
        return max(1, len(text) // 4)

    async def test_connection(self) -> bool:
        try:
            await self._model.generate_content_async(
                "hi",
                generation_config={"max_output_tokens": 1},
            )
        except Exception:
            return False
        return True
