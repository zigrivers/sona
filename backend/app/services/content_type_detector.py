"""Auto-detect content type from text using heuristics.

Pure heuristic detection — no LLM calls. Rules are ordered by specificity
(most specific patterns first) to handle edge cases correctly.
"""

import re

# Greeting patterns (start of text)
_GREETING_RE = re.compile(
    r"^\s*(hi|hello|hey|dear|good morning|good afternoon|good evening)\b",
    re.IGNORECASE,
)

# Sign-off patterns (end of text)
_SIGNOFF_RE = re.compile(
    r"(best regards|kind regards|regards|sincerely|thanks|cheers|best|warm regards)"
    r"\s*,?\s*\n",
    re.IGNORECASE,
)

# Markdown headings
_HEADING_RE = re.compile(r"^#{1,3}\s+\S", re.MULTILINE)

# Thread numbering: "1/", "1.", "1)"
_THREAD_RE = re.compile(r"^\d+[/.)]\s", re.MULTILINE)

# Hashtag pattern
_HASHTAG_RE = re.compile(r"#\w+")

# @ mention pattern
_MENTION_RE = re.compile(r"@\w+")


def _count_words(text: str) -> int:
    return len(text.split())


def _has_greeting(text: str) -> bool:
    return bool(_GREETING_RE.search(text))


def _has_signoff(text: str) -> bool:
    return bool(_SIGNOFF_RE.search(text))


def _count_headings(text: str) -> int:
    return len(_HEADING_RE.findall(text))


def _count_thread_markers(text: str) -> int:
    return len(_THREAD_RE.findall(text))


def _count_hashtags(text: str) -> int:
    return len(_HASHTAG_RE.findall(text))


def _count_mentions(text: str) -> int:
    return len(_MENTION_RE.findall(text))


def detect_content_type(text: str) -> str:
    """Detect the content type of the given text using heuristics.

    Returns one of: tweet, email, blog_post, linkedin_post, newsletter, thread, other.

    Rules are ordered by specificity — most specific patterns match first.
    """
    stripped = text.strip()
    if not stripped:
        return "other"

    char_count = len(stripped)
    word_count = _count_words(stripped)
    has_greeting = _has_greeting(stripped)
    has_signoff = _has_signoff(stripped)
    heading_count = _count_headings(stripped)
    thread_markers = _count_thread_markers(stripped)
    hashtag_count = _count_hashtags(stripped)
    mention_count = _count_mentions(stripped)

    # 1. Newsletter: greeting + multiple headings (most specific combo)
    if has_greeting and heading_count >= 2:
        return "newsletter"

    # 2. Email: greeting + sign-off patterns
    if has_greeting and has_signoff:
        return "email"

    # 3. Thread: numbered items (3+ thread markers)
    if thread_markers >= 3:
        return "thread"

    # 4. Blog post: long text (500+ words) with headings
    if word_count > 500 and heading_count >= 1:
        return "blog_post"

    # 5. Tweet: short text (<300 chars) with hashtags or mentions
    if char_count < 300 and (hashtag_count >= 1 or mention_count >= 1):
        return "tweet"

    # 6. LinkedIn post: medium text (300-3000 chars) without headings
    if 300 <= char_count <= 3000 and heading_count == 0:
        return "linkedin_post"

    return "other"
