"""OpenAI LLM provider implementation."""

from collections.abc import AsyncIterator
from typing import cast

import openai
from openai.types.chat import ChatCompletionMessageParam

from app.exceptions import LLMAuthError, LLMNetworkError, LLMRateLimitError


def _cast_messages(
    messages: list[dict[str, str]],
) -> list[ChatCompletionMessageParam]:
    """Cast plain dicts to OpenAI message params (structural match)."""
    return cast(list[ChatCompletionMessageParam], messages)


class OpenAIProvider:
    """LLM provider backed by OpenAI's chat completions API."""

    def __init__(self, api_key: str, default_model: str = "gpt-4o") -> None:
        self._client = openai.AsyncOpenAI(api_key=api_key)
        self._default_model = default_model

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=model or self._default_model,
                messages=_cast_messages(messages),
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except openai.AuthenticationError as exc:
            raise LLMAuthError(provider="openai", detail=str(exc)) from exc
        except openai.RateLimitError as exc:
            raise LLMRateLimitError(provider="openai", detail=str(exc)) from exc
        except openai.APIConnectionError as exc:
            raise LLMNetworkError(provider="openai", detail=str(exc)) from exc

        return response.choices[0].message.content or ""

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        try:
            response_stream = await self._client.chat.completions.create(
                model=model or self._default_model,
                messages=_cast_messages(messages),
                temperature=temperature,
                max_tokens=max_tokens,
                stream=True,
            )
        except openai.AuthenticationError as exc:
            raise LLMAuthError(provider="openai", detail=str(exc)) from exc
        except openai.RateLimitError as exc:
            raise LLMRateLimitError(provider="openai", detail=str(exc)) from exc
        except openai.APIConnectionError as exc:
            raise LLMNetworkError(provider="openai", detail=str(exc)) from exc

        async for chunk in response_stream:
            delta = chunk.choices[0].delta
            if delta.content is not None:
                yield delta.content

    async def count_tokens(self, text: str) -> int:
        return max(1, len(text) // 4)

    async def test_connection(self) -> bool:
        try:
            await self._client.chat.completions.create(
                model=self._default_model,
                messages=[{"role": "user", "content": "hi"}],
                max_tokens=1,
            )
        except Exception:
            return False
        return True
