"""URL scraping service for extracting text from web pages."""

from __future__ import annotations

import httpx
from bs4 import BeautifulSoup

# Elements to remove before extracting text
_STRIP_TAGS = {"script", "style", "nav", "footer", "header", "aside", "noscript"}


async def scrape_url(url: str) -> str:
    """Scrape a URL and return the visible text content.

    Raises ValueError if the URL cannot be fetched or returns a non-2xx status.
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
    except (httpx.HTTPError, httpx.InvalidURL) as exc:
        raise ValueError(f"Failed to scrape URL '{url}': {exc}") from exc

    soup = BeautifulSoup(response.text, "lxml")

    for tag in soup.find_all(_STRIP_TAGS):
        tag.decompose()

    text = soup.get_text(separator="\n", strip=True)
    return text
