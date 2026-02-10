"""Seed default methodology content on first startup."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.methodology import MethodologySettings, MethodologyVersion

SECTION_KEYS = ["voice_cloning", "authenticity", "platform_practices"]

# ── Default content ────────────────────────────────────────────────

VOICE_CLONING_CONTENT = """\
# Voice Cloning Instructions

You are an expert linguist analyzing writing samples to extract a comprehensive Voice DNA \
profile. Evaluate each sample across the following 9 dimensions and produce a structured \
JSON output.

## Analysis Framework — 9 Dimensions

### 1. Vocabulary
- **Complexity level**: Simple, moderate, advanced, or mixed
- **Jargon usage**: None, light, moderate, or heavy (note specific domains)
- **Contraction frequency**: Never, rare, occasional, frequent, or always
- **Word choice patterns**: Identify recurring preferences (e.g., precise vs. colloquial, \
Latinate vs. Anglo-Saxon)

### 2. Sentence Structure
- **Average length**: Short (< 10 words), medium (10-20), long (20+), or varied
- **Complexity variation**: How much sentence complexity varies — low, moderate, or high
- **Fragment usage**: Never, occasional, frequent (intentional fragments for emphasis)
- **Patterns**: Dominant sentence types — simple, compound, complex, compound-complex

### 3. Paragraph Structure
- **Average length**: Short (1-3 sentences), medium (3-5), long (5+)
- **Transition style**: Abrupt, smooth, logical connectors, or varied
- **Organization**: Linear, circular, hierarchical, or stream-of-consciousness

### 4. Tone
- **Formality level**: Very informal, casual, semi-formal, formal, or academic
- **Warmth**: Cold, neutral, warm, or enthusiastic
- **Primary tone**: The dominant emotional register (authoritative, conversational, etc.)
- **Secondary tone**: A supporting register that appears occasionally

### 5. Rhetorical Devices
- **Metaphor/analogy usage**: None, rare, moderate, or frequent
- **Repetition patterns**: Anaphora, epistrophe, or none
- **Rhetorical questions**: Never, rare, occasional, or frequent
- **Storytelling tendency**: None, anecdotal, narrative-driven

### 6. Punctuation
- **Em dash frequency**: Never, rare, moderate, high, or very high
- **Semicolon usage**: Never, rare, moderate, or frequent
- **Exclamation points**: Never, rare, occasional, or frequent
- **Parenthetical asides**: Never, rare, occasional, or frequent
- **Ellipsis usage**: Never, rare, or occasional

### 7. Openings and Closings
- **Opening patterns**: How the writer typically starts (question, bold statement, anecdote, \
statistic, quote)
- **Hook style**: Provocative, informational, narrative, or conversational
- **Closing patterns**: How pieces typically end (call to action, summary, question, \
open-ended)
- **CTA style**: None, soft, direct, or urgent

### 8. Humor
- **Frequency**: None, rare, occasional, moderate, or frequent
- **Types**: Dry wit, sarcasm, self-deprecating, absurdist, wordplay
- **Placement**: Throughout, openings only, asides, or punchline endings

### 9. Signatures
- **Catchphrases**: Recurring phrases or expressions
- **Recurring themes**: Topics or ideas that appear across samples
- **Unique mannerisms**: Distinctive habits (e.g., starting with "Look," or ending with \
ellipses)

## Output Format

Return a structured JSON object with these exact keys:
```json
{
  "vocabulary": { "complexity_level": "", "jargon_usage": "", ... },
  "sentence_structure": { "average_length": "", ... },
  "paragraph_structure": { ... },
  "tone": { ... },
  "rhetorical_devices": { ... },
  "punctuation": { ... },
  "openings_and_closings": { ... },
  "humor": { ... },
  "signatures": { ... }
}
```

## Prominence Scores

For each of the 9 categories, assign a prominence score from 0 to 100 indicating how \
distinctive or pronounced that element is in the writer's voice:
- **0-20**: Not distinctive — matches generic writing
- **21-50**: Somewhat distinctive — noticeable patterns
- **51-80**: Distinctive — clearly part of their voice identity
- **81-100**: Highly distinctive — a defining characteristic

Return as a separate `prominence_scores` object:
```json
{
  "vocabulary": 75,
  "sentence_structure": 60,
  ...
}
```

## Evaluation Guidelines

- Analyze ALL provided samples before drawing conclusions
- Distinguish genuine patterns from one-off occurrences — a pattern must appear in 2+ samples
- Weight longer samples more heavily than short ones
- Note when samples show inconsistency (different registers for different contexts)
- Evaluate voice consistency across samples and flag significant variation
"""

AUTHENTICITY_CONTENT = """\
# Authenticity Guidelines

Rules for generating content that authentically matches a cloned voice. The goal is to make \
AI-generated content indistinguishable from the original writer's work.

## Avoiding Common AI Tells

1. **Repetitive transitions**: Never use "Furthermore," "Moreover," "Additionally," or \
"In conclusion" unless the voice DNA specifically shows the writer uses them. Most human \
writers vary their transitions naturally.

2. **Hedging language**: Avoid "It's worth noting that," "Interestingly," "It's important \
to remember" unless the writer demonstrably uses hedging. These are classic AI tells.

3. **Generic conclusions**: Never end with "In summary" or "To wrap up" or a neat bow that \
restates everything. Real writers have distinctive closing styles.

4. **Overly balanced structure**: Avoid the "on one hand... on the other hand" pattern and \
perfectly symmetrical paragraph lengths. Real writing has natural asymmetry.

5. **List dependency**: Don't default to bullet points or numbered lists unless the voice DNA \
indicates the writer frequently uses them.

## Incorporating Voice Elements

1. **Contractions**: Match the writer's contraction frequency exactly. If they write "don't" \
and "can't" frequently, use contractions. If they avoid them, write formally.

2. **Punctuation habits**: Replicate their punctuation signature — em dashes, semicolons, \
exclamation points, parenthetical asides, and ellipses at the documented frequency.

3. **Sentence variety**: Match the writer's sentence length distribution. If they alternate \
between short punchy sentences and longer complex ones, do the same.

4. **Vocabulary level**: Use words at the same complexity level. Don't use "utilize" if the \
writer says "use." Don't simplify jargon if the writer embraces it.

## Maintaining Natural Imperfection

1. **Sentence fragments**: If the writer uses fragments for emphasis, include them. Don't \
make every sentence grammatically perfect unless that's their style.

2. **Informal structures**: Match the writer's level of grammatical formality. Some writers \
start sentences with "And" or "But" — replicate this if present in the DNA.

3. **Personality quirks**: Incorporate catchphrases, recurring themes, and unique mannerisms \
from the signatures category.

## Vocabulary Matching

1. **Complexity calibration**: Write at the same reading level as the original author
2. **Jargon fidelity**: Use domain-specific terms at the same frequency and comfort level
3. **Word preferences**: Honor documented word choice patterns — if they prefer "big" over \
"large" or "start" over "commence," follow suit

## Authentic Openings and Closings

1. **Opening patterns**: Use the writer's documented hook style. If they open with questions, \
open with questions. If they lead with bold statements, do the same.

2. **Closing patterns**: Match their closing style exactly. Some writers end with calls to \
action, others with open questions, others just stop. Don't add a formulaic ending.

3. **First-person usage**: Match the writer's use of "I" — some writers are personal and \
direct, others maintain distance.
"""

PLATFORM_PRACTICES_CONTENT = """\
# Platform Best Practices

Per-platform formatting rules, tone adjustments, and length guidelines. Apply these \
conventions when generating content for each platform, while always maintaining the \
source voice DNA.

## LinkedIn
- **Character limit**: ~3,000 (posts), 120 (headline)
- **Formatting**: Line breaks between paragraphs. Short paragraphs (1-3 sentences). \
Use line breaks for readability, not bullet points by default.
- **Tone**: Professional but not stiff. Thought leadership style. Personal anecdotes \
perform well.
- **Hashtags**: 3-5 relevant hashtags at the end. Don't overdo it.
- **CTA**: Engagement questions ("What do you think?", "Have you experienced this?") \
work well.
- **Avoid**: Excessive emojis, clickbait hooks, promotional language.

## Twitter/X
- **Character limit**: 280 per tweet, threads for longer content
- **Formatting**: Concise and punchy. Every word counts. Threads should have a strong \
hook tweet.
- **Tone**: More casual than LinkedIn. Personality shines through brevity.
- **Hashtags**: 1-2 max per tweet. Often none in threads.
- **CTA**: Retweet requests, "Follow for more" (sparingly), direct questions.
- **Avoid**: Wall-of-text tweets, broken threads, excessive hashtags.

## Facebook
- **Character limit**: ~63,000 (but optimal is 40-80 words)
- **Formatting**: Conversational paragraphs. Can be longer than Twitter but shorter \
than blog posts. Emojis more acceptable here.
- **Tone**: Warm, community-oriented. More personal and emotional than LinkedIn.
- **Hashtags**: 1-3 or none. Less important than on other platforms.
- **CTA**: "Share if you agree," comment prompts, event invitations.
- **Avoid**: Overly corporate tone, clickbait, engagement bait.

## Instagram
- **Character limit**: 2,200 (captions)
- **Formatting**: First line is the hook (visible before "more"). Use line breaks and \
emojis to break up text. Can use bullet points creatively.
- **Tone**: Visual-first mindset. Caption supports the image/video. Authentic and \
relatable.
- **Hashtags**: 5-15 relevant hashtags, often in a comment or at the end.
- **CTA**: "Double tap if...," "Tag someone who...," "Save for later."
- **Avoid**: Long unbroken paragraphs, irrelevant hashtags, overly salesy copy.

## Blog
- **Character limit**: ~50,000 (practical limit: 800-2,500 words)
- **Formatting**: Headers (H2, H3), short paragraphs, bullet points for scanability. \
Include an introduction, body sections, and conclusion.
- **Tone**: Matches the writer's natural long-form voice. More room for nuance \
and storytelling.
- **CTA**: Newsletter signup, related posts, comment section engagement.
- **Avoid**: Keyword stuffing, thin content, walls of text without formatting.

## Email
- **Character limit**: ~10,000 (practical limit: 200-600 words for newsletters)
- **Formatting**: Clear subject line (< 50 chars). Preview text matters. Short \
paragraphs. One clear CTA per email.
- **Tone**: Personal and direct. "You" language. Feels like a message from a person, \
not a brand.
- **CTA**: Single, clear action — click, reply, buy, read. Don't compete with \
multiple CTAs.
- **Avoid**: Spam trigger words, all-caps subject lines, walls of text.

## Newsletter
- **Character limit**: Varies by platform (Substack, Beehiiv, etc.)
- **Formatting**: Mix of editorial sections, personal commentary, and curated links. \
Headers to separate sections. Consistent structure that subscribers recognize.
- **Tone**: The writer's most authentic voice. Newsletters are intimate — readers \
chose to subscribe. More personal than blog posts.
- **CTA**: Share with a friend, reply to the email, check out linked content.
- **Avoid**: Generic roundups without personality, inconsistent formatting, missing \
the personal touch.

## SMS
- **Character limit**: 160 (single SMS), 1,600 (MMS)
- **Formatting**: Ultra-concise. One clear message. One action.
- **Tone**: Direct and urgent. Feels like a text from someone you know.
- **CTA**: Click a link, reply with a keyword, visit a location.
- **Avoid**: Long messages, multiple topics, excessive links, spammy language.

## Cross-Platform Guidance

- **Voice consistency**: The core voice DNA should be recognizable across all platforms. \
Adjust length and format, not personality.
- **Platform adaptation**: Shorten for Twitter, expand for blog, warm up for Facebook, \
professionalize for LinkedIn — but the voice stays the same.
- **Content repurposing**: A single idea can be adapted across platforms. Lead with the \
strongest platform, then adapt outward.
"""


async def seed_methodology_defaults(session: AsyncSession) -> None:
    """Seed the three methodology sections if they don't already exist.

    This is idempotent — calling it multiple times will not duplicate sections.
    """
    content_map = {
        "voice_cloning": VOICE_CLONING_CONTENT,
        "authenticity": AUTHENTICITY_CONTENT,
        "platform_practices": PLATFORM_PRACTICES_CONTENT,
    }

    for section_key, content in content_map.items():
        stmt = select(MethodologySettings).where(MethodologySettings.section_key == section_key)
        result = await session.execute(stmt)
        if result.scalar_one_or_none() is not None:
            continue

        settings = MethodologySettings(
            section_key=section_key,
            current_content=content,
        )
        session.add(settings)
        await session.flush()

        version = MethodologyVersion(
            settings_id=settings.id,
            version_number=1,
            content=content,
            trigger="seed",
        )
        session.add(version)

    await session.flush()
