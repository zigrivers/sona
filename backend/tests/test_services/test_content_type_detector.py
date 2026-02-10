"""Tests for content type auto-detection heuristics."""

from app.services.content_type_detector import detect_content_type


class TestDetectTweet:
    def test_short_text_with_hashtags(self) -> None:
        """Text < 300 chars with hashtags should detect as tweet."""
        text = "Just launched our new product! #startup #launch #excited"
        assert detect_content_type(text) == "tweet"

    def test_short_text_with_multiple_hashtags(self) -> None:
        """Short text with many hashtags is a tweet."""
        text = "Great day at the conference #tech #ai #ml #python #coding"
        assert detect_content_type(text) == "tweet"

    def test_short_text_with_mentions(self) -> None:
        """Short text with @ mentions is a tweet."""
        text = "Congrats @johndoe on the launch! Amazing work by the team."
        assert detect_content_type(text) == "tweet"


class TestDetectEmail:
    def test_text_with_greeting_and_signoff(self) -> None:
        """Text with greeting and sign-off patterns should detect as email."""
        text = (
            "Hi John,\n\n"
            "I wanted to follow up on our conversation from yesterday. "
            "The project timeline looks good and I think we can move forward.\n\n"
            "Best regards,\nJane"
        )
        assert detect_content_type(text) == "email"

    def test_text_with_dear_greeting(self) -> None:
        """Text starting with 'Dear' should detect as email."""
        text = (
            "Dear Team,\n\n"
            "Please find attached the quarterly report. "
            "Let me know if you have any questions.\n\n"
            "Thanks,\nMike"
        )
        assert detect_content_type(text) == "email"

    def test_short_text_with_greeting_is_email_not_tweet(self) -> None:
        """Short text with greeting should be email, not tweet (greeting wins)."""
        text = "Hi Sarah,\n\nThanks for the update!\n\nBest,\nTom"
        assert detect_content_type(text) == "email"


class TestDetectBlogPost:
    def test_long_text_with_markdown_headings(self) -> None:
        """Text > 500 words with markdown headings should detect as blog_post."""
        paragraphs = " ".join(["This is a paragraph with several words."] * 60)
        text = f"# How to Build Better Software\n\n{paragraphs}\n\n## Conclusion\n\n{paragraphs}"
        assert detect_content_type(text) == "blog_post"

    def test_long_text_with_h2_headings(self) -> None:
        """Long text with ## headings should detect as blog_post."""
        body = " ".join(["Writing great content requires practice and dedication."] * 80)
        text = f"## Introduction\n\n{body}\n\n## Key Takeaways\n\n{body}"
        assert detect_content_type(text) == "blog_post"


class TestDetectLinkedinPost:
    def test_medium_text_without_headings(self) -> None:
        """Text 300-3000 chars without headings should detect as linkedin_post."""
        text = (
            "I've been reflecting on my career journey over the past decade. "
            "When I started in tech, I had no idea where it would take me. "
            "The key lessons I've learned are about persistence, curiosity, "
            "and building genuine relationships with the people around you. "
            "Every challenge has been an opportunity to grow, and I'm grateful "
            "for every mentor who took the time to guide me along the way. "
            "If you're early in your career, remember that success is rarely linear."
        )
        # Ensure it's in the 300-3000 char range
        assert 300 <= len(text) <= 3000
        assert detect_content_type(text) == "linkedin_post"

    def test_medium_text_with_emoji_patterns(self) -> None:
        """Medium text with professional tone is linkedin_post."""
        text = (
            "Excited to share that our team just hit a major milestone! "
            "After months of hard work, we've successfully launched our new platform. "
            "This wouldn't have been possible without the incredible dedication "
            "of every team member. Special thanks to our engineering and design teams "
            "for pushing boundaries. Looking forward to what's next! "
            "What milestones are you celebrating this quarter?"
        )
        assert 300 <= len(text) <= 3000
        assert detect_content_type(text) == "linkedin_post"


class TestDetectNewsletter:
    def test_sections_with_greeting(self) -> None:
        """Text with multiple sections/headings + greeting should detect as newsletter."""
        body = " ".join(["Here is some newsletter content for this section."] * 10)
        text = (
            "Hi everyone,\n\n"
            f"## This Week in Tech\n\n{body}\n\n"
            f"## Industry Updates\n\n{body}\n\n"
            f"## Upcoming Events\n\n{body}\n\n"
            "See you next week!\nThe Team"
        )
        assert detect_content_type(text) == "newsletter"

    def test_dear_readers_with_sections(self) -> None:
        """Newsletter with 'Dear readers' greeting and sections."""
        body = " ".join(["Important update about our project progress this month."] * 10)
        text = (
            "Dear readers,\n\n"
            f"# Monthly Digest\n\n{body}\n\n"
            f"## What's New\n\n{body}\n\n"
            f"## Coming Soon\n\n{body}"
        )
        assert detect_content_type(text) == "newsletter"


class TestDetectThread:
    def test_numbered_items(self) -> None:
        """Text with numbered items/sequential short segments should detect as thread."""
        text = (
            "1/ Here's what I learned about building startups this year.\n\n"
            "2/ First, focus on the problem, not the solution.\n\n"
            "3/ Second, talk to your customers every single day.\n\n"
            "4/ Third, ship fast and iterate based on feedback.\n\n"
            "5/ Finally, take care of yourself. Burnout is real."
        )
        assert detect_content_type(text) == "thread"

    def test_numbered_with_period(self) -> None:
        """Text with '1.' numbering should detect as thread."""
        text = (
            "1. The most important skill in 2026 is adaptability.\n\n"
            "2. AI is changing every industry faster than expected.\n\n"
            "3. Those who learn to work with AI will thrive.\n\n"
            "4. Start small, experiment often, share your learnings."
        )
        assert detect_content_type(text) == "thread"

    def test_numbered_with_parenthesis(self) -> None:
        """Text with '1)' numbering should detect as thread."""
        text = (
            "1) Productivity tip: batch similar tasks together\n\n"
            "2) Use time blocks for deep work\n\n"
            "3) Take breaks every 90 minutes\n\n"
            "4) Review your day each evening"
        )
        assert detect_content_type(text) == "thread"


class TestDetectOther:
    def test_unclassifiable_short_text(self) -> None:
        """Unclassifiable text should return 'other'."""
        text = "Hello world"
        assert detect_content_type(text) == "other"

    def test_empty_string(self) -> None:
        """Empty string should return 'other'."""
        assert detect_content_type("") == "other"

    def test_whitespace_only(self) -> None:
        """Whitespace-only text should return 'other'."""
        assert detect_content_type("   \n\n  ") == "other"

    def test_very_short_no_signals(self) -> None:
        """Very short text without any signals returns 'other'."""
        text = "Some random text without any clear pattern."
        assert detect_content_type(text) == "other"


class TestEdgeCases:
    def test_short_with_greeting_prefers_email_over_tweet(self) -> None:
        """Short text with greeting should be email, not tweet (specificity ordering)."""
        text = "Hi team,\n\nQuick update on the project.\n\nBest,\nAlex"
        assert detect_content_type(text) == "email"

    def test_long_text_no_headings_is_other(self) -> None:
        """Long text without headings and without thread markers is 'other'."""
        text = " ".join(["This is a long paragraph without any headings or structure."] * 80)
        assert detect_content_type(text) == "other"

    def test_medium_text_with_headings_but_no_greeting_is_blog(self) -> None:
        """Medium text with headings but no greeting is blog_post, not newsletter."""
        body = " ".join(["Content here for the blog section."] * 80)
        text = f"## Introduction\n\n{body}\n\n## Details\n\n{body}"
        assert detect_content_type(text) == "blog_post"
