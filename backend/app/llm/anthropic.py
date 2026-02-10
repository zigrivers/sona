"""Anthropic LLM provider implementation."""

from collections.abc import AsyncIterator

import anthropic

from app.exceptions import LLMAuthError, LLMRateLimitError


class AnthropicProvider:
    """LLM provider backed by the Anthropic Messages API."""

    def __init__(self, api_key: str, default_model: str = "claude-sonnet-4-5-20250929") -> None:
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._default_model = default_model

    async def complete(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """Send a non-streaming request and return the text response."""
        system_msg, user_messages = self._split_system(messages)
        try:
            response = await self._client.messages.create(
                model=model or self._default_model,
                system=system_msg,
                messages=user_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except anthropic.AuthenticationError as exc:
            raise LLMAuthError(provider="anthropic", detail=str(exc)) from exc
        except anthropic.RateLimitError as exc:
            raise LLMRateLimitError(provider="anthropic", detail=str(exc)) from exc

        return response.content[0].text

    async def stream(
        self,
        messages: list[dict[str, str]],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> AsyncIterator[str]:
        """Yield text chunks from a streaming response."""
        system_msg, user_messages = self._split_system(messages)
        async with self._client.messages.stream(
            model=model or self._default_model,
            system=system_msg,
            messages=user_messages,
            temperature=temperature,
            max_tokens=max_tokens,
        ) as stream:
            async for event in stream:
                if event.type == "content_block_delta":
                    yield event.delta.text

    async def count_tokens(self, text: str) -> int:
        """Approximate token count (1 token ≈ 4 chars)."""
        return len(text) // 4

    async def test_connection(self) -> bool:
        """Test connectivity by sending a minimal API call."""
        try:
            await self._client.messages.create(
                model=self._default_model,
                messages=[{"role": "user", "content": "Hi"}],
                max_tokens=1,
            )
        except Exception:
            return False
        return True

    @staticmethod
    def _split_system(
        messages: list[dict[str, str]],
    ) -> tuple[str, list[dict[str, str]]]:
        """Extract the system message from the message list.

        Anthropic Messages API takes system as a top-level parameter,
        not as a message in the list.
        """
        system = ""
        user_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                user_messages.append(msg)
        return system, user_messages
