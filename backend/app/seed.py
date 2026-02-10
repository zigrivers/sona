"""Seed default methodology content and demo voice clones on first startup."""

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clone import VoiceClone
from app.models.dna import VoiceDNAVersion
from app.models.methodology import MethodologySettings, MethodologyVersion
from app.models.sample import WritingSample

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


# ── Demo voice clone data ─────────────────────────────────────────

DEMO_CLONES: list[dict[str, Any]] = [
    {
        "name": "Professional Blogger",
        "description": (
            "A polished, authoritative voice for long-form content and thought leadership."
        ),
        "tags": ["blog", "linkedin", "newsletter"],
        "samples": [
            {
                "content": (
                    "The most successful content strategies don't start with a content calendar. "
                    "They start with a single, uncomfortable question: What do we actually have to "
                    "say that nobody else is saying? I've watched dozens of brands pour resources "
                    "into publishing schedules, editorial workflows, and distribution plans — only "
                    "to produce content that sounds exactly like everyone else in their space. The "
                    "calendar wasn't the problem. The thinking was."
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 73,
                "length_category": "short",
            },
            {
                "content": (
                    "Here's what I've learned after a decade of writing professionally: your first "
                    "draft is never about the reader. It's about you figuring out what you think. "
                    "The real writing happens in revision, when you strip away everything that "
                    "serves the writer and keep only what serves the reader. Most people skip this "
                    "step. They publish their thinking-out-loud and wonder why it doesn't land. "
                    "Great writing is generous — it does the hard work so the reader "
                    "doesn't have to."
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 85,
                "length_category": "short",
            },
            {
                "content": (
                    "I used to believe that good ideas sell themselves. That if your argument is "
                    "strong enough, the writing doesn't matter. I was wrong. Packaging is not "
                    "superficial — it's structural. The way you sequence ideas, the rhythm of your "
                    "sentences, the white space you leave for the reader to think — these aren't "
                    "cosmetic choices. They're engineering decisions. Every paragraph is a bridge. "
                    "If even one is shaky, you lose the reader before they reach your conclusion."
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 82,
                "length_category": "short",
            },
            {
                "content": (
                    "Stop optimizing for algorithms and start optimizing for memory. The posts "
                    "that get shared aren't the ones that rank — they're the ones people remember "
                    "at dinner. They're the ones that make someone stop scrolling and "
                    "text a friend. I know this runs counter to every SEO playbook. "
                    "But the writers who build real "
                    "audiences aren't gaming systems. They're saying things that stick. That's a "
                    "fundamentally different skill, and it's the one worth developing."
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 80,
                "length_category": "short",
            },
        ],
        "dna": {
            "vocabulary": {
                "complexity_level": "moderate",
                "jargon_usage": "light",
                "contraction_frequency": "frequent",
                "word_choice_patterns": "precise and direct, prefers concrete over abstract",
            },
            "sentence_structure": {
                "average_length": "medium",
                "complexity_variation": "high",
                "fragment_usage": "occasional",
                "patterns": "alternates between short punchy and longer complex",
            },
            "paragraph_structure": {
                "average_length": "medium",
                "transition_style": "smooth",
                "organization": "linear with occasional circular callbacks",
            },
            "tone": {
                "formality_level": "semi-formal",
                "warmth": "warm",
                "primary_tone": "authoritative",
                "secondary_tone": "conversational",
            },
            "rhetorical_devices": {
                "metaphor_usage": "moderate",
                "repetition_patterns": "anaphora for emphasis",
                "rhetorical_questions": "occasional",
                "storytelling_tendency": "anecdotal",
            },
            "punctuation": {
                "em_dash_frequency": "high",
                "semicolon_usage": "rare",
                "exclamation_points": "never",
                "parenthetical_asides": "occasional",
                "ellipsis_usage": "never",
            },
            "openings_and_closings": {
                "opening_patterns": "bold statement or contrarian take",
                "hook_style": "provocative",
                "closing_patterns": "call to reflection",
                "cta_style": "soft",
            },
            "humor": {
                "frequency": "rare",
                "types": "dry wit",
                "placement": "asides",
            },
            "signatures": {
                "catchphrases": ["Here's what I've learned", "The real question is"],
                "recurring_themes": ["craft of writing", "authenticity over optimization"],
                "unique_mannerisms": "uses dashes for dramatic pauses",
            },
        },
        "prominence_scores": {
            "vocabulary": 82,
            "sentence_structure": 88,
            "paragraph_structure": 80,
            "tone": 90,
            "rhetorical_devices": 83,
            "punctuation": 85,
            "openings_and_closings": 91,
            "humor": 80,
            "signatures": 84,
        },
    },
    {
        "name": "Casual Social",
        "description": "An upbeat, relatable voice for social media and short-form content.",
        "tags": ["twitter", "instagram", "facebook"],
        "samples": [
            {
                "content": (
                    "okay but can we talk about how nobody warns you that adulting is just "
                    "googling how to do stuff and hoping for the best?? like I just spent "
                    "20 minutes trying to figure out if I need to wash rice and honestly "
                    "I still don't know the answer"
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 48,
                "length_category": "short",
            },
            {
                "content": (
                    "hot take: the best productivity hack is closing all 47 of your browser "
                    "tabs and starting fresh. yes it's terrifying. yes you will lose that "
                    "article you were 'definitely going to read later.' but you'll feel like "
                    "a new person and that's worth more than any bookmark folder"
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 52,
                "length_category": "short",
            },
            {
                "content": (
                    "just realized I've been saying 'I should really start meal prepping' "
                    "every Sunday for three years straight. at this point it's not a goal "
                    "it's a catchphrase. someone put it on my tombstone"
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 38,
                "length_category": "short",
            },
            {
                "content": (
                    "the thing about social media is everyone's out here curating their "
                    "best life while I'm just trying to remember if I already told this "
                    "story to you or if I told it to someone else and now I'm just gonna "
                    "tell it again because honestly it's a good story and you should hear "
                    "it twice"
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 55,
                "length_category": "short",
            },
            {
                "content": (
                    "normalize admitting you have no idea what you're doing. I started a "
                    "podcast last month and my setup is literally my phone propped against "
                    "a cereal box. it sounds terrible. people love it. turns out authenticity "
                    "beats production quality every single time"
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 45,
                "length_category": "short",
            },
        ],
        "dna": {
            "vocabulary": {
                "complexity_level": "simple",
                "jargon_usage": "none",
                "contraction_frequency": "always",
                "word_choice_patterns": "colloquial, internet-native, conversational",
            },
            "sentence_structure": {
                "average_length": "varied",
                "complexity_variation": "moderate",
                "fragment_usage": "frequent",
                "patterns": "stream of consciousness, run-on sentences for comedic effect",
            },
            "paragraph_structure": {
                "average_length": "short",
                "transition_style": "abrupt",
                "organization": "stream-of-consciousness",
            },
            "tone": {
                "formality_level": "very informal",
                "warmth": "enthusiastic",
                "primary_tone": "conversational",
                "secondary_tone": "self-deprecating",
            },
            "rhetorical_devices": {
                "metaphor_usage": "rare",
                "repetition_patterns": "none",
                "rhetorical_questions": "frequent",
                "storytelling_tendency": "anecdotal",
            },
            "punctuation": {
                "em_dash_frequency": "never",
                "semicolon_usage": "never",
                "exclamation_points": "never",
                "parenthetical_asides": "never",
                "ellipsis_usage": "never",
            },
            "openings_and_closings": {
                "opening_patterns": "lowercase conversational hook",
                "hook_style": "conversational",
                "closing_patterns": "punchline or trailing thought",
                "cta_style": "none",
            },
            "humor": {
                "frequency": "frequent",
                "types": "self-deprecating, absurdist, observational",
                "placement": "throughout",
            },
            "signatures": {
                "catchphrases": ["okay but", "hot take", "normalize"],
                "recurring_themes": [
                    "everyday struggles",
                    "internet culture",
                    "authenticity",
                ],
                "unique_mannerisms": ("lowercase everything, no periods, double question marks"),
            },
        },
        "prominence_scores": {
            "vocabulary": 85,
            "sentence_structure": 82,
            "paragraph_structure": 80,
            "tone": 95,
            "rhetorical_devices": 80,
            "punctuation": 88,
            "openings_and_closings": 83,
            "humor": 95,
            "signatures": 92,
        },
    },
    {
        "name": "Technical Writer",
        "description": "A precise, structured voice for documentation and technical content.",
        "tags": ["blog", "email", "newsletter"],
        "samples": [
            {
                "content": (
                    "Database indexing is one of those topics that every developer encounters "
                    "but few take the time to understand properly. At its core, an index is a "
                    "data structure that trades write performance for read performance. When "
                    "you create an index on a column, the database maintains a separate, sorted "
                    "structure that allows it to locate rows without scanning the entire table. "
                    "The cost is additional storage and slower inserts, because the index must "
                    "be updated alongside the data."
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 78,
                "length_category": "short",
            },
            {
                "content": (
                    "The distinction between authentication and authorization is fundamental "
                    "yet frequently confused. Authentication answers the question 'Who are you?' "
                    "while authorization answers 'What are you allowed to do?' A system can "
                    "authenticate a user correctly and still deny access if the authorization "
                    "policy doesn't grant the required permissions. Conflating these two "
                    "concepts leads to security architectures that are difficult to reason "
                    "about and harder to audit."
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 67,
                "length_category": "short",
            },
            {
                "content": (
                    "Effective error handling follows a simple principle: handle errors at the "
                    "level where you have enough context to do something meaningful about them. "
                    "Catching an exception just to log it and re-raise adds noise without value. "
                    "Catching it to provide a user-friendly message or retry with different "
                    "parameters adds value. The goal is not to prevent all errors from "
                    "propagating — it is to ensure that each error is handled exactly once, "
                    "at the right layer."
                ),
                "content_type": "text/plain",
                "source_type": "paste",
                "word_count": 73,
                "length_category": "short",
            },
        ],
        "dna": {
            "vocabulary": {
                "complexity_level": "advanced",
                "jargon_usage": "heavy",
                "contraction_frequency": "rare",
                "word_choice_patterns": "precise technical terms, Latinate vocabulary",
            },
            "sentence_structure": {
                "average_length": "long",
                "complexity_variation": "low",
                "fragment_usage": "never",
                "patterns": "complex and compound-complex, subordinate clauses",
            },
            "paragraph_structure": {
                "average_length": "medium",
                "transition_style": "logical connectors",
                "organization": "hierarchical",
            },
            "tone": {
                "formality_level": "formal",
                "warmth": "neutral",
                "primary_tone": "authoritative",
                "secondary_tone": "instructional",
            },
            "rhetorical_devices": {
                "metaphor_usage": "rare",
                "repetition_patterns": "none",
                "rhetorical_questions": "never",
                "storytelling_tendency": "none",
            },
            "punctuation": {
                "em_dash_frequency": "moderate",
                "semicolon_usage": "moderate",
                "exclamation_points": "never",
                "parenthetical_asides": "rare",
                "ellipsis_usage": "never",
            },
            "openings_and_closings": {
                "opening_patterns": "definitional statement or problem framing",
                "hook_style": "informational",
                "closing_patterns": "summary or guiding principle",
                "cta_style": "none",
            },
            "humor": {
                "frequency": "none",
                "types": "none",
                "placement": "none",
            },
            "signatures": {
                "catchphrases": ["At its core", "The distinction between"],
                "recurring_themes": ["correctness", "clarity", "precision"],
                "unique_mannerisms": "uses semicolons to connect related clauses",
            },
        },
        "prominence_scores": {
            "vocabulary": 92,
            "sentence_structure": 88,
            "paragraph_structure": 85,
            "tone": 90,
            "rhetorical_devices": 80,
            "punctuation": 86,
            "openings_and_closings": 84,
            "humor": 80,
            "signatures": 82,
        },
    },
]

DEMO_CLONE_NAMES = {clone["name"] for clone in DEMO_CLONES}


async def seed_demo_clones(session: AsyncSession) -> None:
    """Seed 3 demo voice clones with writing samples and pre-analyzed Voice DNA.

    This is idempotent — calling it multiple times will not duplicate clones.
    """
    for clone_data in DEMO_CLONES:
        stmt = select(VoiceClone).where(
            VoiceClone.name == clone_data["name"],
            VoiceClone.is_demo.is_(True),
        )
        result = await session.execute(stmt)
        if result.scalar_one_or_none() is not None:
            continue

        clone = VoiceClone(
            name=clone_data["name"],
            description=clone_data["description"],
            tags=clone_data["tags"],
            is_demo=True,
        )
        session.add(clone)
        await session.flush()

        for sample_data in clone_data["samples"]:
            sample = WritingSample(
                clone_id=clone.id,
                content=sample_data["content"],
                content_type=sample_data["content_type"],
                source_type=sample_data["source_type"],
                word_count=sample_data["word_count"],
                length_category=sample_data["length_category"],
            )
            session.add(sample)

        dna = VoiceDNAVersion(
            clone_id=clone.id,
            version_number=1,
            data=clone_data["dna"],
            prominence_scores=clone_data["prominence_scores"],
            trigger="seed",
            model_used="pre-analyzed",
        )
        session.add(dna)

    await session.flush()
