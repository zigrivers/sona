"""Tests for Google AI LLM provider."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from google.api_core import exceptions as google_exceptions

from app.exceptions import LLMAuthError, LLMNetworkError, LLMRateLimitError
from app.llm.google import GoogleProvider


@pytest.fixture
def provider() -> GoogleProvider:
    return GoogleProvider(api_key="test-key", default_model="gemini-2.0-flash")


def _make_response(text: str) -> MagicMock:
    """Build a mock GenerateContentResponse."""
    response = MagicMock()
    response.text = text
    return response


def _make_stream_chunk(text: str) -> MagicMock:
    """Build a mock streaming chunk."""
    chunk = MagicMock()
    chunk.text = text
    return chunk


@pytest.mark.asyncio
async def test_complete_returns_response_text(provider: GoogleProvider) -> None:
    """complete() should return the text from the API response."""
    mock_response = _make_response("Hello, world!")

    with patch.object(
        provider._model, "generate_content_async", new_callable=AsyncMock
    ) as mock_generate:
        mock_generate.return_value = mock_response
        result = await provider.complete([{"role": "user", "content": "Hi"}])

    assert result == "Hello, world!"


@pytest.mark.asyncio
async def test_complete_passes_temperature_and_max_tokens(provider: GoogleProvider) -> None:
    """complete() should forward generation config to the API."""
    mock_response = _make_response("response")

    with patch.object(
        provider._model, "generate_content_async", new_callable=AsyncMock
    ) as mock_generate:
        mock_generate.return_value = mock_response
        await provider.complete(
            [{"role": "user", "content": "Hi"}],
            temperature=0.5,
            max_tokens=2000,
        )

    call_kwargs = mock_generate.call_args
    gen_config = call_kwargs[1]["generation_config"]
    assert gen_config["temperature"] == 0.5
    assert gen_config["max_output_tokens"] == 2000


@pytest.mark.asyncio
async def test_complete_converts_messages_to_contents(provider: GoogleProvider) -> None:
    """complete() should convert role/content dicts to Google's format."""
    mock_response = _make_response("response")

    with patch.object(
        provider._model, "generate_content_async", new_callable=AsyncMock
    ) as mock_generate:
        mock_generate.return_value = mock_response
        await provider.complete(
            [
                {"role": "system", "content": "You are helpful."},
                {"role": "user", "content": "Hello"},
            ]
        )

    # Google SDK expects a list of content parts
    call_args = mock_generate.call_args[0][0]
    # System message should be prepended to user message or handled appropriately
    assert isinstance(call_args, list)


@pytest.mark.asyncio
async def test_stream_yields_chunks(provider: GoogleProvider) -> None:
    """stream() should yield text strings from the streaming response."""
    chunks = [_make_stream_chunk("Hello"), _make_stream_chunk(", world!")]

    async def fake_stream() -> None:
        """Not actually called — we need an async iterable."""

    mock_response = MagicMock()
    mock_response.__aiter__ = MagicMock(return_value=iter(chunks))

    with patch.object(
        provider._model, "generate_content_async", new_callable=AsyncMock
    ) as mock_generate:

        async def fake_async_stream():  # type: ignore[no-untyped-def]
            for chunk in chunks:
                yield chunk

        mock_generate.return_value = fake_async_stream()

        collected: list[str] = []
        async for text in provider.stream([{"role": "user", "content": "Hi"}]):
            collected.append(text)

    assert collected == ["Hello", ", world!"]


@pytest.mark.asyncio
async def test_test_connection_returns_true_on_success(provider: GoogleProvider) -> None:
    """test_connection() should return True when the API responds."""
    mock_response = _make_response("ok")

    with patch.object(
        provider._model, "generate_content_async", new_callable=AsyncMock
    ) as mock_generate:
        mock_generate.return_value = mock_response
        result = await provider.test_connection()

    assert result is True


@pytest.mark.asyncio
async def test_test_connection_returns_false_on_failure(provider: GoogleProvider) -> None:
    """test_connection() should return False when the API call fails."""
    with patch.object(
        provider._model, "generate_content_async", new_callable=AsyncMock
    ) as mock_generate:
        mock_generate.side_effect = google_exceptions.GoogleAPICallError("Connection failed")
        result = await provider.test_connection()

    assert result is False


@pytest.mark.asyncio
async def test_auth_error_maps_to_llm_auth_error(provider: GoogleProvider) -> None:
    """Google PermissionDenied should map to LLMAuthError."""
    with (
        patch.object(
            provider._model, "generate_content_async", new_callable=AsyncMock
        ) as mock_generate,
        pytest.raises(LLMAuthError),
    ):
        mock_generate.side_effect = google_exceptions.PermissionDenied("Invalid API key")
        await provider.complete([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_unauthenticated_maps_to_llm_auth_error(provider: GoogleProvider) -> None:
    """Google Unauthenticated should map to LLMAuthError."""
    with (
        patch.object(
            provider._model, "generate_content_async", new_callable=AsyncMock
        ) as mock_generate,
        pytest.raises(LLMAuthError),
    ):
        mock_generate.side_effect = google_exceptions.Unauthenticated("No API key")
        await provider.complete([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_rate_limit_maps_to_llm_rate_limit_error(provider: GoogleProvider) -> None:
    """Google ResourceExhausted should map to LLMRateLimitError."""
    with (
        patch.object(
            provider._model, "generate_content_async", new_callable=AsyncMock
        ) as mock_generate,
        pytest.raises(LLMRateLimitError),
    ):
        mock_generate.side_effect = google_exceptions.ResourceExhausted("Quota exceeded")
        await provider.complete([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_service_unavailable_maps_to_llm_network_error(provider: GoogleProvider) -> None:
    """Google ServiceUnavailable should map to LLMNetworkError."""
    with (
        patch.object(
            provider._model, "generate_content_async", new_callable=AsyncMock
        ) as mock_generate,
        pytest.raises(LLMNetworkError),
    ):
        mock_generate.side_effect = google_exceptions.ServiceUnavailable("Service down")
        await provider.complete([{"role": "user", "content": "Hi"}])


@pytest.mark.asyncio
async def test_count_tokens_returns_estimate(provider: GoogleProvider) -> None:
    """count_tokens() should return a reasonable token estimate."""
    result = await provider.count_tokens("Hello world, this is a test sentence.")

    assert isinstance(result, int)
    assert result > 0
