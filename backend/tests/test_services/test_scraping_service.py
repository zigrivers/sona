"""Tests for URL scraping service."""

import httpx
import pytest

from app.services.scraping_service import scrape_url


class TestScrapeUrl:
    async def test_scrape_url_extracts_text(self, httpx_mock) -> None:  # type: ignore[no-untyped-def]
        """scrape_url should extract visible text from HTML."""
        html = """
        <html>
        <head><title>Test Page</title></head>
        <body>
            <h1>Hello World</h1>
            <p>This is a paragraph.</p>
            <script>var x = 1;</script>
            <style>.foo { color: red; }</style>
        </body>
        </html>
        """
        httpx_mock.add_response(url="https://example.com/page", text=html)

        result = await scrape_url("https://example.com/page")
        assert "Hello World" in result
        assert "This is a paragraph." in result
        assert "var x = 1" not in result
        assert ".foo" not in result

    async def test_scrape_url_handles_network_failure(self, httpx_mock) -> None:  # type: ignore[no-untyped-def]
        """scrape_url should raise ValueError on network failure."""
        httpx_mock.add_exception(httpx.ConnectError("Connection refused"))

        with pytest.raises(ValueError, match="Failed to scrape URL"):
            await scrape_url("https://unreachable.example.com")

    async def test_scrape_url_handles_http_error(self, httpx_mock) -> None:  # type: ignore[no-untyped-def]
        """scrape_url should raise ValueError on non-2xx HTTP response."""
        httpx_mock.add_response(url="https://example.com/404", status_code=404)

        with pytest.raises(ValueError, match="Failed to scrape URL"):
            await scrape_url("https://example.com/404")

    async def test_scrape_url_strips_nav_and_footer(self, httpx_mock) -> None:  # type: ignore[no-untyped-def]
        """scrape_url should strip navigation and footer elements."""
        html = """
        <html>
        <body>
            <nav>Navigation links</nav>
            <main><p>Main content here.</p></main>
            <footer>Footer text</footer>
        </body>
        </html>
        """
        httpx_mock.add_response(url="https://example.com/article", text=html)

        result = await scrape_url("https://example.com/article")
        assert "Main content here." in result
        assert "Navigation links" not in result
        assert "Footer text" not in result
