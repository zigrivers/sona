"""Tests for file parser service."""

from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest

from app.services.file_parser import parse_file, parse_txt


class TestParseTxt:
    async def test_parse_txt_extracts_text(self) -> None:
        """parse_txt should extract text from a .txt file."""
        content = b"Hello world, this is a test."
        file = BytesIO(content)
        result = await parse_txt(file)
        assert result == "Hello world, this is a test."

    async def test_parse_txt_strips_whitespace(self) -> None:
        """parse_txt should strip leading/trailing whitespace."""
        content = b"  Hello world  \n\n"
        file = BytesIO(content)
        result = await parse_txt(file)
        assert result == "Hello world"


class TestParseFile:
    async def test_parse_txt_file(self) -> None:
        """parse_file should handle .txt files."""
        content = b"Sample text content."
        file = BytesIO(content)
        result = await parse_file(file, "sample.txt", "text/plain")
        assert result == "Sample text content."

    async def test_parse_docx_file(self) -> None:
        """parse_file should handle .docx files by extracting paragraph text."""
        mock_doc = MagicMock()
        mock_doc.paragraphs = [
            MagicMock(text="First paragraph."),
            MagicMock(text=""),
            MagicMock(text="Second paragraph."),
        ]

        with patch("app.services.file_parser.Document", return_value=mock_doc):
            file = BytesIO(b"fake docx content")
            docx_ct = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            result = await parse_file(file, "test.docx", docx_ct)
            assert "First paragraph." in result
            assert "Second paragraph." in result

    async def test_parse_pdf_file(self) -> None:
        """parse_file should handle .pdf files by extracting text."""
        with patch("app.services.file_parser.pymupdf.open") as mock_open:
            mock_page = MagicMock()
            mock_page.get_text.return_value = "PDF page text."
            mock_doc = MagicMock()
            mock_doc.__iter__ = MagicMock(return_value=iter([mock_page]))
            mock_doc.close = MagicMock()
            mock_open.return_value = mock_doc

            file = BytesIO(b"fake pdf content")
            result = await parse_file(file, "test.pdf", "application/pdf")
            assert "PDF page text." in result

    async def test_reject_unsupported_file_type(self) -> None:
        """parse_file should raise ValueError for unsupported file types."""
        file = BytesIO(b"some data")
        with pytest.raises(ValueError, match="Unsupported file type"):
            await parse_file(file, "image.png", "image/png")

    async def test_truncate_large_file(self) -> None:
        """parse_file should truncate text exceeding MAX_SAMPLE_WORDS and flag truncation."""
        # Generate text with 50001+ words
        words = ["word"] * 50_001
        large_text = " ".join(words)
        content = large_text.encode()
        file = BytesIO(content)
        result = await parse_file(file, "large.txt", "text/plain")
        word_count = len(result.split())
        assert word_count <= 50_000

    async def test_detects_extension_from_filename(self) -> None:
        """parse_file should use filename extension when content_type is ambiguous."""
        content = b"Text from txt file."
        file = BytesIO(content)
        result = await parse_file(file, "doc.txt", "application/octet-stream")
        assert result == "Text from txt file."
