"""File parsing service for extracting text from uploaded files."""

from __future__ import annotations

from typing import BinaryIO

import pymupdf  # type: ignore[import-untyped]
from docx import Document

from app.constants import MAX_SAMPLE_WORDS

# Map of supported file extensions to their parser identifiers
SUPPORTED_EXTENSIONS: dict[str, str] = {
    ".txt": "txt",
    ".docx": "docx",
    ".pdf": "pdf",
}

# Content types that map to known parsers
CONTENT_TYPE_MAP: dict[str, str] = {
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/pdf": "pdf",
}


def _get_parser_id(filename: str, content_type: str) -> str:
    """Determine parser from filename extension, falling back to content_type."""
    ext = ""
    dot_idx = filename.rfind(".")
    if dot_idx != -1:
        ext = filename[dot_idx:].lower()

    if ext in SUPPORTED_EXTENSIONS:
        return SUPPORTED_EXTENSIONS[ext]

    if content_type in CONTENT_TYPE_MAP:
        return CONTENT_TYPE_MAP[content_type]

    raise ValueError(f"Unsupported file type: {filename} ({content_type})")


def _truncate_to_max_words(text: str) -> str:
    """Truncate text to MAX_SAMPLE_WORDS if it exceeds the limit."""
    words = text.split()
    if len(words) <= MAX_SAMPLE_WORDS:
        return text
    return " ".join(words[:MAX_SAMPLE_WORDS])


async def parse_txt(file: BinaryIO) -> str:
    """Extract text from a plain text file."""
    raw = file.read()
    return bytes(raw).decode("utf-8").strip()


async def _parse_docx(file: BinaryIO) -> str:
    """Extract text from a .docx file using python-docx."""
    doc = Document(file)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)


async def _parse_pdf(file: BinaryIO) -> str:
    """Extract text from a PDF file using pymupdf."""
    data = file.read()
    doc = pymupdf.open(stream=data, filetype="pdf")
    pages: list[str] = []
    for page in doc:
        text: str = str(page.get_text())  # pyright: ignore[reportUnknownMemberType,reportUnknownArgumentType]
        if text.strip():
            pages.append(text.strip())
    doc.close()
    return "\n\n".join(pages)


async def parse_file(file: BinaryIO, filename: str, content_type: str) -> str:
    """Parse an uploaded file and return its text content.

    Raises ValueError for unsupported file types.
    Truncates to MAX_SAMPLE_WORDS if content exceeds the limit.
    """
    parser_id = _get_parser_id(filename, content_type)

    if parser_id == "txt":
        text = await parse_txt(file)
    elif parser_id == "docx":
        text = await _parse_docx(file)
    elif parser_id == "pdf":
        text = await _parse_pdf(file)
    else:
        raise ValueError(f"Unsupported file type: {filename} ({content_type})")

    return _truncate_to_max_words(text)
