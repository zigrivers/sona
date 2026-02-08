# Sona - Product Requirements Document

## 1. Product Overview

Sona is a local web application that analyzes writing samples to capture a writer's unique "Voice DNA" — a structured profile of their vocabulary patterns, sentence structure, tone, rhetorical devices, punctuation habits, humor, and distinctive signatures. It then generates new content that authentically replicates their style, scores that content for authenticity (how natural and human-like it reads), and formats output optimized for different platforms (LinkedIn, Twitter, blogs, email, etc.).

What sets Sona apart: it can merge elements from multiple writers into hybrid voices (e.g., one person's structure combined with another's humor), a capability no existing writing tool offers. Every competitor's "brand voice" feature gets criticized as feeling generic — Sona goes deeper with structured linguistic analysis rather than surface-level style prompts.

**Who it's for:** Individual content creators scaling their personal voice across platforms, and agency ghostwriters managing multiple client voices. Creators are the entry point; agencies are the power-user tier.

**Why it matters:** Current AI writing tools produce generic content that doesn't sound like any specific person. Sona solves this by treating voice as structured, analyzable data — not a vague style preference.

---

## 2. User Personas

### Persona 1: Solo Creator — "Alex"

**Who:** Content creator, thought leader, or solopreneur who publishes regularly across 2-4 platforms (LinkedIn, Twitter, blog, newsletter).

**Goals:**
- Scale content output without losing their authentic voice
- Repurpose a single idea into platform-optimized versions quickly
- Maintain consistency across platforms while adapting tone/length appropriately

**Pain points:**
- Writing unique content for each platform is time-consuming
- Generic AI tools produce content that doesn't sound like them
- Editing AI output to "sound like me" takes almost as long as writing from scratch
- Worried about content reading as obviously AI-generated

**Context of use:** Uses Sona a few times per week during content creation sessions. Has one primary voice clone (their own). Occasionally experiments with voice tweaks for different contexts (more formal for LinkedIn, more casual for Twitter). Values speed and authenticity over advanced features.

### Persona 2: Agency Ghostwriter — "Jordan"

**Who:** Freelance or agency writer who produces content on behalf of 3-10 clients, each with a distinct voice.

**Goals:**
- Capture each client's voice accurately from their existing content
- Generate first drafts that need minimal editing to sound authentic
- Manage multiple distinct voices efficiently
- Experiment with voice blending for clients who want to evolve their style

**Pain points:**
- Onboarding a new client's voice takes significant time reading their work
- Maintaining voice consistency across long engagements is mentally taxing
- Switching between client voices throughout the day causes "voice bleed"
- Clients can tell when content doesn't sound like them

**Context of use:** Uses Sona daily as a core part of their workflow. Manages 3-10 voice clones simultaneously. Heavily uses the content library to organize output by client/campaign. Needs the confidence score to know when a voice clone is "ready" before using it for client work. Values accuracy and organization over speed.

---

## 3. Core User Flows

### Flow 1: Create a Voice Clone (First-Time Setup)

**Happy path:**
1. User clicks "New Clone" from the Clones page
2. Enters name (e.g., "My LinkedIn Voice"), optional description and tags
3. Lands on the clone detail page showing an empty state with confidence score at 0
4. Clicks "Add Sample" — chooses from paste, file upload, or URL
5. **Paste:** Types or pastes text into a textarea, selects content type (blog, tweet, email, etc.), clicks "Add"
6. **File upload:** Drags or selects a .txt, .docx, or .pdf file. System extracts text, shows preview for confirmation, user selects content type, clicks "Add"
7. **URL:** Enters a URL, system scrapes and extracts text, shows preview for confirmation, user selects content type, clicks "Add"
8. After each sample, confidence score updates in real-time showing component breakdown
9. User adds 5-8 samples across different content types until confidence reaches 80+
10. System shows recommendation: "Ready for use" or specific suggestions ("Add longer-form content for better paragraph analysis")
11. User clicks "Analyze Voice DNA" — system sends all samples to the selected LLM
12. After 10-30 seconds, Voice DNA appears as a structured, readable breakdown
13. User reviews DNA, optionally edits specific fields, saves

**Error/edge cases:**
- **URL scraping fails:** Toast notification: "Could not extract text from this URL. The site may block automated access. Try copying the text and pasting it instead." Sample is not added.
- **PDF extraction yields garbled text:** Show extracted text preview with warning: "This PDF may not have extracted cleanly. Please review the text below and edit if needed before adding." User can edit the preview or cancel.
- **File too large (>50,000 words):** Warning: "This file is very large. Only the first 50,000 words will be used." Proceed with truncation.
- **Unsupported file type:** Error: "Sona supports .txt, .docx, and .pdf files. Please convert your file and try again."
- **Empty/unreadable file:** Error: "No readable text found in this file."
- **Confidence score below 60 after analysis:** Yellow warning banner on clone detail page: "This voice clone has low confidence. Generated content may not accurately reflect the target voice. [See recommendations]." Recommendations section shows specific suggestions.
- **DNA analysis fails (LLM error):** Error toast: "Voice analysis failed. Please check your API key settings and try again." Clone retains previous DNA (or none if first analysis).

### Flow 2: Generate Content

**Happy path:**
1. User navigates to Content Generator page
2. Selects a voice clone from dropdown (shows name + confidence score badge)
3. Types rough input in the text area — bullets, ideas, a rough draft, or a topic description
4. Configures generation properties:
   - Selects target platform(s) via checkboxes (e.g., LinkedIn + Twitter)
   - Sets length preference (short/medium/long or custom word count)
   - Optionally adjusts tone, humor, formality sliders (default: "inherit from Voice DNA")
   - Optionally sets target audience, CTA style, include/exclude phrases
5. Clicks "Generate" — loading indicator shows progress
6. Within 30 seconds per platform, generated content appears in the review panel
7. If multiple platforms selected, each platform version shows in its own tab
8. Each version displays: the content, word/char count, platform limit indicator, and authenticity score with breakdown
9. User reviews content, optionally makes inline edits
10. User clicks "Save to Library" — content is stored with all metadata

**Error/edge cases:**
- **No voice clone selected:** Generate button is disabled with tooltip: "Select a voice clone to continue"
- **Clone confidence below 60:** Warning below clone selector: "This clone has low confidence. Results may not accurately match the target voice." Generation still allowed.
- **Empty input:** Generate button disabled with tooltip: "Enter your content brief to continue"
- **LLM API error (rate limit, auth, network):** Error panel replaces content area: "Generation failed: [specific error]. Check your API key in Settings > Providers." Retry button available.
- **Authenticity score below 50:** Red badge on score. Banner: "This content scored low on authenticity. Consider regenerating with feedback or editing manually." Specific dimension feedback shown (e.g., "4 of 6 paragraphs start with 'The' — vary your openings").
- **Content exceeds platform limit:** Yellow warning in platform preview: "This content is 340/280 characters for Twitter. Consider shortening or splitting into a thread."
- **Generation takes longer than 60 seconds:** Show "Still working..." message. No timeout — let it complete.

### Flow 3: Merge Voices

**Happy path:**
1. User navigates to Clone Merge page
2. Selects 2-5 source clones from a searchable multi-select
3. For each selected clone, a weight panel appears showing all mergeable elements (vocabulary, sentence structure, tone, humor, etc.)
4. User adjusts sliders (0-100%) for each element per source clone
5. Live preview shows the weight distribution as a visual matrix
6. User names the merged clone and clicks "Create Merged Clone"
7. System sends all source DNAs + weights to the LLM
8. Merged Voice DNA is generated and displayed for review
9. User confirms — merged clone appears in the Clones list with a "merged" badge and source lineage visible

**Error/edge cases:**
- **Source clone has no DNA:** Clone is disabled in the selector with tooltip: "This clone hasn't been analyzed yet. Analyze it first."
- **Only one clone selected:** Merge button disabled: "Select at least 2 voice clones to merge"
- **All weights at 0% for an element:** That element uses equal weights from all sources (treated as "no preference")
- **Merge fails (LLM error):** Error toast: "Voice merge failed. Please try again." No clone is created.

### Flow 4: Manage Content Library

**Happy path:**
1. User navigates to Content Library page
2. Sees a data table of all generated content, sorted by newest first
3. Filters by: voice clone (dropdown), platform (checkboxes), status (tabs or dropdown), date range, tags, full-text search
4. Clicks a content row to view full details: content text, metadata, generation properties, authenticity score breakdown
5. From detail view: edits content inline, changes status (draft > review > approved > published > archived), adds tags/topic/campaign, duplicates, or deletes
6. Bulk selects multiple items via checkboxes for bulk status change, bulk tag, or bulk delete

**Error/edge cases:**
- **No content exists yet:** Empty state showing "No content yet. Create your first piece in the Content Generator." with a link.
- **Search returns no results:** "No content matches your filters. Try broadening your search." with a "Clear filters" button.
- **Delete confirmation:** "Delete this content? This cannot be undone." with Cancel/Delete buttons. Bulk delete: "Delete N items? This cannot be undone."

### Flow 5: Configure Methodology Settings

**Happy path:**
1. User navigates to Settings > Methodology
2. Sees three tabbed sections: Voice Cloning Instructions, Authenticity Guidelines, Platform Best Practices
3. Each section shows the current content in an editable text area (markdown)
4. User edits the content and clicks "Save"
5. New version is created, version counter increments
6. User can click "Version History" to see last 10 versions with timestamps
7. User can click any previous version to view it, and "Revert" to restore it

**Error/edge cases:**
- **No changes made:** Save button disabled: "No changes to save"
- **Version history at 10:** Oldest version is automatically pruned when a new version is saved. User is not notified (this is expected behavior).

### Flow 6: First-Run & Provider Setup

**Happy path:**
1. User launches Sona for the first time — no data, no API keys configured
2. `/clones` shows a welcome empty state: app logo, brief tagline ("Capture your writing voice, generate authentic content"), and two CTAs:
   - Primary: "Set Up AI Provider" (links to `/settings/providers`)
   - Secondary: "Explore Demo Voices" (scrolls to demo clone section below)
3. Demo voice clones (see below) are visible on the clones page even without a provider configured — users can browse their DNA and samples, but cannot generate content
4. User clicks "Set Up AI Provider" → navigates to `/settings/providers`
5. User enters an API key for any provider, clicks "Test Connection"
6. On successful test → key is saved, provider status turns green
7. User is redirected to `/clones` with a success toast: "AI provider configured! You're ready to go."
8. `/clones` now shows: demo clones (ready for content generation) + "Create Your First Clone" CTA
9. Methodology settings are auto-seeded with high-quality defaults on first run (no user action needed)

**Error/edge cases:**
- **User tries AI action without provider:** Any AI-dependent action (Analyze DNA, Generate Content, Check Authenticity) shows an inline message: "No AI provider configured. [Go to Settings]" with a link to `/settings/providers`.
- **Provider test fails:** User stays on settings page with error message (see Section 4.7 for specific error states). Cannot proceed until at least one provider is successfully configured.
- **User skips provider setup:** App is fully navigable — users can create clones, add samples, browse the library. Only AI-powered actions are blocked.

**Demo voice clones (I1):**
- Ship with 2-3 pre-built voice clones so users can try content generation immediately after configuring a provider:
  - "Professional Blogger" — formal, structured, educational tone
  - "Casual Social" — conversational, punchy, emoji-comfortable
  - "Technical Writer" — precise, jargon-comfortable, systematic
- Each demo clone ships with 3-5 writing samples and pre-analyzed Voice DNA
- Demo clones are marked with a "Demo" badge in the clone list
- Demo clones cannot be deleted, only hidden (via a "Hide Demo Clones" toggle on the clones page)
- Confidence scores are pre-set (80+ each)
- Users can generate content with demo clones immediately after configuring a provider
- Demo clones cannot have samples added or DNA re-analyzed (they are read-only references)

---

## 4. Feature Requirements

### 4.1 Voice Clone Methodology Settings

**What it does:** Global configuration that governs how the system analyzes writing and generates content. Three editable markdown sections that are injected into LLM prompts.

**Why it exists:** Different use cases require different analysis approaches. A ghostwriter analyzing corporate executives needs different extraction rules than someone analyzing casual bloggers. Making these editable lets users tune the entire system.

**Priority:** Must-have (v1)

**Sections:**
| Section | Purpose | Injected Into |
|---|---|---|
| Voice Cloning Instructions | Defines how AI analyzes samples to extract Voice DNA (what to look for, how to structure findings) | Voice DNA analysis prompt |
| Authenticity Guidelines | Rules for making generated content sound natural (avoid AI tells, embrace specifics, vary structure) | Content generation prompt |
| Platform Best Practices | Per-platform formatting rules, tone adjustments, length guidelines | Content generation prompt (per-platform) |

**Business rules:**
- System ships with high-quality defaults for all three sections (seeded on first run)
- Each section supports independent version history (last 10 versions)
- Revert creates a new version (it does not delete versions after the reverted one)
- Version history shows: version number, timestamp, trigger type (edit, revert)
- Content is stored as plain text/markdown — no rich text editor needed for v1

**Default content structural outline:**

The three default methodology sections should cover the following topics when drafted during implementation:

*Voice Cloning Instructions (default):*
- Analysis framework: what linguistic dimensions to evaluate (vocabulary, sentence structure, paragraph patterns, tone, rhetorical devices, punctuation, openings/closings, humor, signatures)
- For each dimension: what specific attributes to extract and how to represent them
- Output format: structured JSON matching the Voice DNA schema
- Guidance on distinguishing genuine voice patterns from one-off anomalies
- Instructions to evaluate voice consistency across samples
- Instructions to assign prominence scores (0-100) per category

*Authenticity Guidelines (default):*
- Rules for avoiding common AI tells (repetitive transitions, hedging language, generic conclusions, overly balanced structure)
- Guidance on incorporating specific voice elements (contractions, punctuation habits, sentence variety)
- Rules for maintaining natural imperfection (fragments, informal structures where appropriate)
- Guidance on matching vocabulary complexity and jargon usage
- Rules for authentic openings and closings (avoiding formulaic patterns)

*Platform Best Practices (default):*
- Per-platform sections for: LinkedIn, Twitter/X, Facebook, Instagram, Blog, Email, Newsletter, SMS
- Each platform section covers: character/length constraints, formatting conventions, tone norms, hashtag/mention usage, CTA conventions, what works vs. what to avoid
- General cross-platform guidance on adapting voice to platform context

### 4.2 Voice Clone Generator

**What it does:** Creates and manages voice clones that capture a writer's unique DNA from writing samples.

**Why it exists:** This is the core of Sona. Without accurate voice capture, content generation is just generic AI output.

**Priority:** Must-have (v1)

**Clone properties:**
| Field | Required | Description |
|---|---|---|
| Name | Yes | Display name (e.g., "Ken - LinkedIn Voice") |
| Description | No | What this voice is / when to use it |
| Tags | No | Freeform tags for organization |
| Avatar | No | Image upload for visual identification (JPG, PNG, WebP; max 2MB; stored in `data/avatars/`; auto-resized to 128×128; default: colored circle with clone initials) |
| Type | Auto | "original", "merged", or "demo" (set by system) |

**Writing samples:**
- Add via copy/paste, file upload (.txt, .docx, .pdf), or URL scraping
- No limit on sample count per clone
- Each sample tracks: content text, word count, source type, source URL/filename (if applicable), content type (user-selected from: tweet, thread, LinkedIn post, blog post, article, email, newsletter, essay, other), length category (auto-calculated: short <300 words, medium 300-1000, long >1000)
- Samples can be individually deleted; deleting a sample does NOT auto-re-analyze DNA (user must manually trigger re-analysis)
- Sample content is stored as-is (no formatting normalization)

**Auto-detect content type (I2):** When adding a writing sample via paste, the content type is auto-detected using heuristics (no LLM needed):
- Tweet: <300 characters, presence of hashtags
- Email: greeting/sign-off patterns (e.g., "Hi [name]", "Best regards")
- Blog post: >500 words with markdown-style headings
- LinkedIn post: 300-3,000 characters without heading patterns
- Newsletter: multiple sections/headings + greeting
- Thread: numbered items or sequential short segments
- Other: fallback for unclassifiable content
- The detected type is pre-selected in the content type dropdown with a "(detected)" label
- User can always override the auto-detected selection
- URL and file imports also auto-detect based on extracted content

**Confidence score (0-100):**
| Component | Max Points | How It's Calculated |
|---|---|---|
| Total word count across all samples | 30 | <500w = 5, 500-1000 = 10, 1000-2500 = 15, 2500-5000 = 22, 5000+ = 30 |
| Number of distinct samples | 20 | 1 = 4, 2 = 8, 3 = 12, 4-5 = 16, 6+ = 20 |
| Content type variety | 20 | 1 type = 5, 2 = 10, 3 = 15, 4+ = 20 |
| Short/long-form mix | 15 | Only one length category = 5, two categories = 10, all three = 15 |
| Voice consistency (AI-derived) | 15 | LLM rates consistency 0-100 during DNA analysis, mapped to 0-15 |

**Score thresholds:**
- 80-100: Green badge, "Ready for use"
- 60-79: Yellow badge, "Usable — add more samples for better results"
- Below 60: Red badge, "Add more samples before generating content"

**Note:** Confidence score updates immediately for deterministic components (word count, sample count, content type variety, length mix — 85 points max) when samples are added or removed. The voice consistency component (15 points) only updates when DNA analysis is run. Before first analysis, max possible confidence is 85.

**Recommendations engine:** Based on what's missing from the score, show specific suggestions:
- Low word count: "Add more writing samples. You have X words; aim for 5,000+ for best results."
- Low sample count: "Add more samples. Variety helps capture your voice more accurately."
- Low content type variety: "You only have [types]. Try adding a [missing type] for more complete voice capture."
- Low length mix: "All your samples are [category]. Add some [missing category] content for better analysis."
- Low consistency: "Your samples show inconsistent voice patterns. This may be intentional (different contexts) or may indicate samples from different authors."

**Voice DNA analysis:**
- Triggered manually by the user (not automatic on sample add/remove)
- Sends ALL samples to the selected LLM in a single request
- Uses the Voice Cloning Instructions from methodology settings as the analysis framework
- Produces structured JSON covering: vocabulary (complexity, favorites, avoided, jargon, contractions), sentence structure (length, complexity, fragments, parallelism), paragraph structure (length, transition style), tone (primary, secondary, formality 0-100, warmth 0-100), rhetorical devices (metaphors, analogies, repetition, rhetorical questions, storytelling), punctuation (em dashes, semicolons, exclamations, ellipses, parentheticals), openings and closings (patterns, hook style), humor (frequency, types, sarcasm level), signatures (catchphrases, recurring themes, unique mannerisms)
- Additionally, the analysis prompt assigns a **prominence score** (0-100) for each top-level DNA category (Vocabulary, Sentence Structure, Paragraph Structure, Tone, Rhetorical Devices, Punctuation, Openings/Closings, Humor, Signatures) — indicating how distinctive/pronounced each element is in the writer's voice. Stored as `prominence_scores` in the DNA JSON. Used for the radar chart visualization (see below).
- Users can view the full DNA as a readable, structured breakdown
- Users can manually edit any DNA field (text fields are editable, dropdowns for enum fields, tag inputs for array fields)
- Manual edits create a new DNA version with trigger "manual_edit"

**DNA versioning:**
- Last 10 versions retained per clone
- Each version stores: full DNA snapshot, version number, trigger type (initial_analysis, regeneration, manual_edit, revert, sample_change), LLM model used, timestamp
- Revert: copies the selected version's DNA as a new version with trigger "revert"
- Version 11+ are automatically pruned (oldest first)

**Clone list page (`/clones`):**
- Card grid layout showing each clone's: name, avatar (or default colored circle with initials), confidence score badge, type badge (original / merged / demo), radar chart thumbnail (small, non-interactive), sample count, last updated date
- Sorted by last updated (most recent first)
- Search by clone name
- Filter by type: All, Original, Merged, Demo
- "Hide Demo Clones" toggle (persisted in local storage)
- Empty state: welcome message + "Set Up AI Provider" CTA + "Create Your First Clone" CTA (see Flow 6)

**Clone detail page layout (`/clones/[id]`):**
- **Header:** Clone name (inline-editable), type badge, confidence score badge, action buttons: "Analyze Voice DNA" (or "Re-analyze Voice DNA" after first analysis), "Quick Generate" (I10), "Delete"
- **Tab navigation:** Samples | Voice DNA | Generated Content

- **Samples tab:** List of writing samples with: content type (with "(detected)" label if auto-detected), word count, source type (paste/file/URL), date added, delete button. "Add Sample" button at top. Confidence score breakdown panel on the side showing each component's contribution to the total score.

- **Voice DNA tab:** Radar chart visualization (see below) displayed prominently at top. Below it: structured display of DNA fields organized by category (Vocabulary, Sentence Structure, Paragraph Structure, Tone, Rhetorical Devices, Punctuation, Openings/Closings, Humor, Signatures). Each field is editable. Version history sidebar showing last 10 versions with: version number, timestamp, trigger type, and "Revert" button.

- **Generated Content tab:** Filtered view of the Content Library showing only content generated using this clone. Same columns and functionality as the main Content Library, but pre-filtered.

**Edit clone metadata:**
- From the clone detail page, all metadata fields (name, description, tags, avatar) are inline-editable
- Save on blur or explicit save button
- Name is required; other fields are optional

**Delete clone:**
- Available from clone detail page header and clone list (via "..." overflow menu on the card)
- Confirmation dialog: "Delete [name]? This clone and all its writing samples and DNA versions will be permanently deleted. Content generated from this clone will be preserved but will show '[Deleted clone]' as the voice source."
- Deletion is permanent — no undo
- Demo clones cannot be deleted (delete action is hidden for demo clones)

**Re-analyze Voice DNA:**
- Before first analysis: button shows "Analyze Voice DNA"
- After first analysis: button changes to "Re-analyze Voice DNA"
- Re-analysis confirmation: "This will create a new DNA version using all current samples. Your previous DNA is preserved in version history."
- Re-analysis follows the same flow as initial analysis

**Voice DNA radar chart (I7):**
- Displayed prominently on the Voice DNA tab of the clone detail page
- Interactive spider/radar chart with 9 axes corresponding to DNA categories: Vocabulary, Sentence Structure, Paragraph Structure, Tone, Rhetorical Devices, Punctuation, Openings/Closings, Humor, Signatures
- Each axis scored 0-100 using the `prominence_scores` from DNA analysis
- Interactive: hover on an axis to see key details (e.g., hovering "Humor" shows "Frequency: moderate, Types: dry wit, sarcasm")
- Color-coded by clone (useful in the comparison view — see Section 4.3)
- Built with Recharts RadarChart component
- Also displayed as a small, non-interactive thumbnail on clone cards in the clone list page

**Quick Generate from clone (I10):**
- "Quick Generate" button in the clone detail page header
- Opens an inline generation panel (slide-out or expandable section) with: text input, platform selector, length selector, and "Generate" button
- Uses the current clone automatically (no clone selector needed)
- Inherits default generation properties (or last-used preset if presets are configured — see Section 4.4)
- Generated content appears inline for review with authenticity score
- "Save to Library" saves the content; "Open in Generator" navigates to the full Content Generator page with the content pre-loaded for further refinement
- Provides a faster path for the most common workflow: "I'm looking at this clone and want to create content with it right now"

### 4.3 Voice Clone Merger

**What it does:** Combines elements from 2-5 existing voice clones into a new hybrid voice with per-element weight control.

**Why it exists:** Enables creative voice experimentation — take one writer's vocabulary and another's humor. Also useful for evolving a voice over time by blending an old voice with new influences. This is Sona's most unique differentiator; no competitor offers this.

**Priority:** Must-have (v1) — ships with "Experimental" label in the UI. The merge capability is a core differentiator and must be available, but users should understand that merged voices may require manual DNA editing to achieve desired results.

**Mergeable elements (each independently weighted 0-100% per source):**
- Vocabulary
- Sentence structure
- Paragraph structure
- Tone
- Rhetorical devices
- Punctuation
- Openings and closings
- Humor
- Personality/signatures

**Merge process:**
1. User selects 2-5 source clones (must all have analyzed DNA)
2. Sets weights per element per source (default: equal distribution)
3. Weights are relative, not absolute — if Clone A = 60 and Clone B = 40 for vocabulary, that means 60/40 split
4. All weights at 0% for an element = equal distribution (treated as no preference)
5. System sends all source DNAs + weight matrix to LLM with merge prompt
6. LLM produces a new blended VoiceDNA following the weight instructions
7. Result is displayed for user review before saving
8. On save: a new VoiceClone is created with type "merged", the merged DNA is stored as version 1, and source lineage is recorded

**Merged clone behavior:**
- Functions identically to original clones (can be used for content generation, can be further merged)
- Displays "Merged" badge and source lineage (which clones it was merged from, with what weights)
- Can have its DNA manually edited (creates new version like any clone)
- Cannot have writing samples added (samples come from source clones)
- If a source clone is deleted, the merged clone retains its DNA but source lineage shows "[Deleted clone]"

**Clone comparison view (I8):**

**What it does:** Side-by-side comparison of two voice clones showing how they differ across DNA dimensions.

**Why it exists:** Users need to understand the differences between clones before merging, and to verify that a merged clone captured the right blend.

**Priority:** Should-have (v1)

**Access points:**
- Clone list page: "Compare" action appears when exactly 2 clones are selected (via checkboxes)
- Clone merge page: "Compare" button shown next to each pair of selected source clones (before merging)

**Page route:** `/clones/compare?a=[id]&b=[id]` (URL-based, shareable/bookmarkable)

**Layout:**
- Two radar charts overlaid on the same axes with different colors per clone (using the `prominence_scores` from each clone's DNA)
- Clone names and color legend at the top
- Below the chart: dimension-by-dimension comparison table with columns:
  - Dimension name
  - Clone A value summary (key traits)
  - Clone B value summary (key traits)
  - Difference indicator: "Similar" (scores within 15 points), "Different" (15-40 point gap), "Very Different" (40+ point gap)
- Useful for: deciding whether to merge, understanding what makes each clone unique, verifying a merged clone captured the right blend

**Business rules:**
- Both clones must have analyzed DNA to be compared
- If a clone has no DNA, show: "Analyze [clone name]'s Voice DNA first to enable comparison."

### 4.4 Content Generator

**What it does:** The primary content generation workflow — select a voice, provide input, configure properties, generate, review, and save.

**Why it exists:** This is the core action loop. Everything else in Sona exists to make this workflow produce better results.

**Priority:** Must-have (v1)

**Workflow steps:**

**Step 1 — Select Voice Clone:**
- Dropdown with search, showing clone name + confidence badge
- Clones with confidence <60 show a warning icon
- Most recently used clone is pre-selected on return visits

**Step 2 — Enter Input:**
- Large text area for the user's raw input
- Accepts: bullet points, rough drafts, topic descriptions, outlines, or any freeform text
- No minimum length requirement
- Placeholder text: "Enter your ideas, bullets, draft, or topic..."

**Step 3 — Configure Properties:**
| Property | Type | Default | Description |
|---|---|---|---|
| Target platform(s) | Multi-select checkboxes | None (required) | LinkedIn, Twitter/X, Facebook, Instagram, Email, Blog, Newsletter, SMS, Generic |
| Length | Radio + optional number | Medium | Short, Medium, Long, or custom word count |
| Tone override | Slider (1-10) | Inherit from DNA | Override the voice's default tone intensity |
| Humor override | Slider (1-10) | Inherit from DNA | Override humor level |
| Formality override | Slider (1-10) | Inherit from DNA | Override formality level |
| Target audience | Text input | None (optional) | Free text describing who this content is for |
| CTA style | Dropdown | None | None, Soft, Direct, Urgent |
| Include phrases | Tag input | None | Specific words/phrases that MUST appear |
| Exclude phrases | Tag input | None | Specific words/phrases that must NOT appear |

**Step 4 — Generate:**
- Single "Generate" button
- Multi-platform selection generates a separate optimized version per platform in a single LLM call per platform
- Target: <30 seconds per platform
- Generation prompt combines: Voice DNA JSON + Authenticity Guidelines + Platform Best Practices (for selected platform) + user input + all configured properties
- Progress indicator shows which platform is currently being generated

**Step 5 — Review:**
- Each platform version appears in its own tab
- Each tab shows: generated content (editable), word count, character count, platform limit indicator (green if under, yellow/red if over), authenticity score (0-100) with 8-dimension breakdown

**Step 6 — Edit/Regenerate:**
- **Inline editing:** Direct text editing in the content area. Changes are tracked.
- **Full regeneration:** "Regenerate" button creates a completely new version
- **Feedback-driven regeneration:** Text input for specific feedback ("make it shorter", "more humor", "change the opening"). System sends feedback + current content + DNA to LLM for targeted improvement.
- **Partial regeneration:** Select a portion of text, right-click or button to "Regenerate selection" — only the selected portion is regenerated while the rest stays intact. **Note:** Partial regeneration is best-effort. The LLM receives surrounding context to maintain flow, but seams may occasionally appear at boundaries between regenerated and original text.
- Each edit/regeneration creates a content version for history

**Step 7 — Save:**
- "Save to Library" stores the content with all metadata
- "Save & Create Another" saves and resets the form (keeping clone and property selections)
- Content is saved as "draft" status by default

**`/create/[id]` route (editing existing content):**
- Loads the Content Generator pre-populated with an existing content record from the library
- Same UI as `/create`, but with the voice clone, input text, generation properties, and generated content all pre-filled from the existing record
- "Save" updates the existing record (creates a new content version)
- "Save as New" creates a separate copy in the library as a new draft
- Useful for re-editing, regenerating with different settings, or refining previously generated content

**A/B content variants (I4):**

**Priority:** Should-have (v1)

- "Generate Variants" button next to the standard "Generate" button
- Generates 3 variations per platform using the same inputs but with LLM temperature variation
- Variants displayed in a horizontal comparison view (side by side on wide screens, swipeable cards on narrower layouts)
- Each variant shows: content text, word count, authenticity score
- User selects their preferred variant → becomes the primary content
- Unselected variants are discarded (not saved to the library)
- Costs 3× a standard generation — estimated cost is shown upfront before generating
- If multiple platforms are selected: variants are generated per-platform (not cross-platform)

**Generation presets (I5):**

**Priority:** Should-have (v1)

- "Save as Preset" button in the generation properties panel
- Preset stores: name, target platform(s), length, tone/humor/formality overrides, target audience, CTA style, include/exclude phrases
- Does NOT store: voice clone selection or input text (those change per use)
- Presets appear as a dropdown at the top of the properties panel: "Load Preset: [dropdown]"
- Loading a preset fills all property fields; user can still adjust before generating
- Presets can be edited, renamed, or deleted from a management section in Settings (`/settings/presets`)
- No limit on preset count
- Example presets users might create: "Jordan's LinkedIn Standard," "Quick Twitter Take," "Client X Newsletter"

**AI detection preview (I6):**

**Priority:** Should-have (v1)

- "Check AI Detection" button in the review panel (per content version)
- Uses LLM to evaluate content for common AI-detection signals: repetitive sentence openers, overuse of transition words, lack of personal anecdotes, overly balanced paragraph lengths, hedging language ("It's important to note"), generic conclusions
- Results displayed as:
  - Overall risk level: Low / Medium / High (color-coded: green / yellow / red)
  - Specific flagged passages with explanations
- Each flagged passage shows: highlighted text + reason (e.g., "3 consecutive paragraphs start with 'Furthermore' — AI detectors flag repetitive transitions") + suggested fix
- Disclaimer: "This checks for common AI-detection patterns. No tool can guarantee undetectability."
- Runs as a separate LLM call — estimated cost shown before running
- Optional: users can skip this step entirely

**Before/after view (I11):**

**Priority:** Should-have (v1)

- In the review panel toolbar: "Show Input" toggle
- When toggled on: split view showing original user input on the left, generated content on the right
- Input panel is read-only (editing happens in the output panel only)
- Helps users see how Sona transformed their rough notes into polished, voice-matched content
- Particularly valuable for agency users showing clients the before/after of voice-matched generation
- Default: off (output-only view). Toggle state persisted in local storage.

**Keyboard shortcuts (I9) — Content Generator:**
- `Cmd+Enter` — Generate content
- `Cmd+Shift+Enter` — Generate variants
- `Cmd+S` — Save to library
- Shortcuts displayed as hints in button tooltips

### 4.5 Content Library

**What it does:** Stores, organizes, and manages all generated content with rich filtering and search.

**Why it exists:** Users generate lots of content. They need to find, organize, track status, and manage it efficiently. For agency users managing multiple clients, organization is critical.

**Priority:** Must-have (v1)

**Each content record stores:**
| Field | Description |
|---|---|
| Content (current) | The latest version of the content text |
| Content (original) | The first generated version (immutable) |
| Voice clone reference | Which clone was used (with name for display even if clone is later deleted) |
| Platform | Target platform |
| User input | The original brief/prompt |
| Generation properties | Full snapshot of all settings used |
| Authenticity score | Current score + 8-dimension breakdown |
| Status | Draft, Review, Approved, Published, Archived |
| Topic | Optional freeform text |
| Campaign | Optional freeform text |
| Tags | Optional freeform tags |
| Word count | Current content word count |
| Character count | Current content character count |
| Created date | When first generated |
| Updated date | When last modified |

**Filtering and search:**
- Filter by voice clone (dropdown, multi-select)
- Filter by platform (checkboxes)
- Filter by status (tabs across top: All, Draft, Review, Approved, Published, Archived)
- Filter by topic or campaign (dropdown with autocomplete from existing values)
- Filter by date range (date picker)
- Filter by tags (tag selector with autocomplete)
- Full-text keyword search across content text
- All filters are combinable (AND logic)
- Filter state is persisted in URL params (shareable/bookmarkable)
- Sort by: date (newest/oldest), authenticity score (high/low), status

**Bulk actions (via checkbox selection):**
- Change status (select new status for all selected items)
- Add tags (add tags to all selected items)
- Delete (with confirmation)
- Export (see Platform Output Manager)

**Individual content management:**
- View full details in a detail panel or page
- Edit content inline
- Edit metadata (status, topic, campaign, tags)
- Duplicate (creates a new draft copy)
- Archive (sets status to Archived)
- Delete (with confirmation, permanent)
- View version history (all edits and regenerations)

**Content version navigation:**
- Version history accessible from content detail view via a "History" tab
- Shows a list of versions with: version number, timestamp, trigger type (generation, inline edit, regeneration, feedback-driven), word count delta (e.g., "+42 words" or "-15 words")
- Click a version to view its content in a read-only preview panel
- "Restore this version" button creates a new version with the selected version's content (same pattern as DNA versioning — non-destructive)
- No diff view in v1 (list + preview is sufficient)

**Status transitions:**
- Status transitions are flexible, not strictly linear — any status can transition to any other status (no restrictions enforced)
- The linear flow (Draft → Review → Approved → Published → Archived) is the recommended workflow, presented as the default UI ordering, but not enforced
- "Published" is a label indicating the user has published the content externally — Sona does not publish content itself
- Bulk status change allows selecting any target status for all selected items

**Keyboard shortcuts (I9) — Content Library:**
- `Cmd+F` — Focus search input
- `Cmd+A` — Select all visible items (in list)

### 4.6 Platform Output Manager

**What it does:** Formats and prepares content for each target platform with previews, limit checking, and export.

**Why it exists:** Each platform has different constraints and conventions. Content that works on LinkedIn fails on Twitter. Users need to see how their content will look and fit before publishing.

**Priority:** Must-have (v1)

**Platform limits and formatting:**
| Platform | Character Limit | Special Formatting |
|---|---|---|
| Twitter/X | 280 (single tweet) | Hashtags, mentions, thread support |
| LinkedIn | 3,000 | Hashtags, mentions, line breaks for readability |
| Facebook | 63,206 | Rich text, mentions |
| Instagram | 2,200 | Hashtags, mentions, line breaks |
| Blog | No limit | Markdown headings, sections |
| Email | No limit | Subject line + body, greeting/sign-off |
| Newsletter | No limit | Sections, headings, rich text |
| SMS | 160 (single) | Plain text, ultra-concise |
| Generic | No limit | Plain text |

**Preview features:**
- Platform-specific preview showing character/word counts with limit indicators and basic platform-appropriate formatting (e.g., hashtag highlighting for Twitter, section headers for blog). **Note:** v1 previews are NOT pixel-perfect visual mockups of how content appears on each platform — they show content with formatting hints and constraint checking.
- Character count with visual progress bar against platform limit
- Word count display
- Green/yellow/red indicator: under limit / approaching limit (>80%) / over limit
- For Twitter: if over 280, suggest "Convert to thread?" which splits into numbered tweets

**Export options:**
- Copy to clipboard (one click, platform-formatted)
- Export as plain text file (.txt)
- Export as PDF (via jspdf)
- Multi-item export: select multiple content pieces, export as a single document (PDF or text) with separators

### 4.7 LLM Provider Settings

**What it does:** Manages LLM API provider configuration — the gateway to all AI features in Sona. Users configure API keys, select models, test connections, and monitor estimated costs.

**Why it exists:** Sona requires at least one LLM provider to function. This is the first thing a new user must configure. Without it, voice analysis, content generation, and authenticity scoring are all unavailable.

**Priority:** Must-have (v1)

**Provider cards:**
- One card per supported provider: OpenAI, Anthropic, Google AI (Gemini)
- Each card shows: provider name/logo, connection status indicator (not configured / connected / error), configured model name, and actions

**Per-provider configuration:**
| Field | Type | Description |
|---|---|---|
| API Key | Masked text input | Key is masked after entry (show last 4 chars). "Show" toggle reveals full key temporarily. |
| Model | Dropdown | Lists available models for the provider (e.g., GPT-4o, GPT-4o-mini for OpenAI; Claude Sonnet, Claude Opus for Anthropic; Gemini Pro, Gemini Flash for Google). Updated manually in code. |
| Test Connection | Button | Sends a minimal API call to verify the key is valid and the model is accessible. Shows success/failure inline. |
| Status | Indicator | Green checkmark (connected), yellow warning (untested), red X (failed), gray dash (not configured) |

**Default provider selector:**
- Radio button or dropdown to set which provider is used by default for all LLM operations
- Only providers with a valid (tested) connection can be selected as default
- If only one provider is configured, it is automatically the default

**Advanced settings (optional):**
- Model selection per operation type: allows choosing different models for analysis (benefits from larger context) vs. generation (benefits from speed/cost). Default: use the same model for everything.

**Validation and error states:**
- On save: automatically runs test connection
- Invalid key: "This API key was not accepted by [Provider]. Please check and try again."
- Expired key: "This API key has expired. Please generate a new key from [Provider]'s dashboard."
- Rate limited: "Connection test was rate limited. The key appears valid — try again in a moment."
- Network error: "Could not reach [Provider]'s API. Check your internet connection."
- Insufficient quota: "This API key has insufficient quota. Check your billing status at [Provider]."

**Storage:**
- API keys are written to `.env` file server-side via API route
- Keys are NEVER sent to the browser after initial save — only masked versions are returned
- `.env` file is gitignored

**Business rules:**
- At least one valid provider is required before any AI feature works
- Any AI-dependent action checks for a configured provider; if missing, shows inline message: "No AI provider configured. [Go to Settings]"
- Show estimated cost per operation based on selected model's pricing (see token cost estimator below)

**Token cost estimator (I3):**
- Before voice DNA analysis: show estimated input tokens, output tokens, and cost based on selected model's pricing
- Before content generation: show estimated cost per platform version
- In Settings > Providers: show cumulative estimated spend per provider (tracked locally, reset monthly)
- Cost calculation: token count × model-specific per-token price (hardcoded pricing table, updated manually in code)
- Display format: "$0.03 estimated" with hover tooltip showing token breakdown (input tokens, output tokens, per-token rates)
- Accuracy disclaimer displayed near estimates: "Estimates are approximate and may differ from actual provider billing"

### 4.8 Authenticity Scoring System

**What it does:** Evaluates generated content across 8 specific dimensions to measure how authentically it matches the target voice clone's DNA. Produces an overall score (0-100) plus per-dimension scores with actionable feedback.

**Why it exists:** Without a structured scoring methodology, "authenticity" is subjective and unactionable. This system gives users concrete feedback on what matches and what doesn't, enabling targeted improvements.

**Priority:** Must-have (v1)

**The 8 dimensions:**

| # | Dimension | Evaluates | DNA Source Field |
|---|-----------|-----------|-----------------|
| 1 | Vocabulary Match | Word choice, complexity level, jargon usage, contraction frequency | `vocabulary` |
| 2 | Sentence Flow | Sentence length distribution, complexity variation, use of fragments | `sentence_structure` |
| 3 | Structural Rhythm | Paragraph length patterns, transition style, content organization | `paragraph_structure` |
| 4 | Tone Fidelity | Formality level, warmth, primary/secondary tone alignment | `tone` |
| 5 | Rhetorical Fingerprint | Metaphor/analogy usage, repetition patterns, rhetorical questions, storytelling tendency | `rhetorical_devices` |
| 6 | Punctuation Signature | Em dash frequency, semicolons, exclamation points, parenthetical asides, ellipses | `punctuation` |
| 7 | Hook & Close | Opening patterns, hook style, closing/CTA patterns | `openings_and_closings` |
| 8 | Voice Personality | Humor frequency/type, catchphrases, recurring themes, unique mannerisms | `humor` + `signatures` |

**Scoring methodology:**
- Each dimension is scored 0-100 by the LLM in a single evaluation call
- Overall authenticity score = unweighted average of all 8 dimension scores
- Scores are rounded to the nearest integer

**Scoring prompt construction:**
The LLM receives:
1. The generated content to evaluate
2. The Voice DNA JSON of the target clone
3. The Authenticity Guidelines from methodology settings
4. Instructions to score each dimension 0-100 with specific justifications

**Actionable feedback:**
- Each dimension scoring below 70 produces specific, actionable feedback
- Feedback references concrete examples from the generated content
- Examples:
  - Vocabulary Match (score: 45): "The target voice uses contractions frequently (you're, it's, don't) but the generated content uses zero contractions."
  - Structural Rhythm (score: 52): "4 of 6 paragraphs start with 'The' — the target voice varies paragraph openings significantly."
  - Punctuation Signature (score: 38): "The target voice uses em dashes frequently (avg. 2 per paragraph) but the generated content uses none."

**Score display:**
- Overall score shown as a prominent badge (color-coded: green 75+, yellow 50-74, red below 50)
- 8-dimension breakdown shown as a list or grid with individual scores and color coding
- Expandable details per dimension showing the specific feedback
- Dimensions sorted by score (lowest first) to surface the most actionable items

---

## 5. Data Model Overview

### Key Entities and Relationships

**VoiceClone** — The central entity. Represents a captured writing voice.
- Has many **WritingSamples** (the raw text that defines the voice)
- Has many **VoiceDNAVersions** (the AI-analyzed voice profile, versioned)
- Has one current VoiceDNA (pointer to the latest version)
- Can be type "original" (from samples), "merged" (from combining other clones), or "demo" (pre-built, read-only)
- If merged, has **MergedCloneSources** linking to source clones with per-element weights
- `is_demo` boolean flag — demo clones are read-only (cannot add samples, delete, or re-analyze)
- `is_hidden` boolean flag — allows users to hide demo clones from the clone list

**WritingSample** — A piece of text used to train a voice clone.
- Belongs to one VoiceClone
- Tracks source (paste, file, URL), content type, word count, length category
- `content_type_detected` boolean — whether the content type was auto-detected (I2)

**VoiceDNAVersion** — A snapshot of the analyzed voice profile.
- Belongs to one VoiceClone
- Contains the full DNA JSON structure
- Contains `prominence_scores` — JSON map of category name → 0-100 score for radar chart (I7)
- Tracks what triggered this version (initial analysis, manual edit, revert, merge)
- Only the last 10 versions are retained

**Content** — A piece of generated content.
- References one VoiceClone (the voice used to generate it)
- Has a target platform
- Stores current content, original content (immutable), user input, generation properties
- Has an authenticity score with 8-dimension breakdown (see Section 4.8)
- Has a status lifecycle: Draft → Review → Approved → Published → Archived (flexible, not enforced — see Section 4.5)
- Has many **ContentVersions** tracking edit history
- Optionally references a **GenerationPreset** if one was used

**ContentVersion** — A snapshot of content at a point in time.
- Belongs to one Content
- Tracks what type of edit created this version (generation, inline edit, regeneration, feedback-driven)
- Stores word count for delta calculation in version history

**GenerationPreset** *(new — I5)* — Saved generation configuration for reuse.
- `id` (nanoid)
- `name` (required, unique)
- `properties` (JSON snapshot of all generation settings: target platform(s), length, tone/humor/formality overrides, target audience, CTA style, include/exclude phrases)
- Does NOT store: voice clone selection or input text
- `created_at`
- `updated_at`

**MethodologySettings** — Global configuration for how the system works.
- Three records: voice_cloning, authenticity, platform_practices
- Has many **MethodologyVersions** tracking edit history
- Only the last 10 versions are retained per section

**ProviderConfig** *(new — tracked in `.env` and app state, not database)* — LLM provider configuration.
- Provider name (openai, anthropic, google)
- API key (stored in `.env`, never in database)
- Selected model
- Connection status (not_configured, connected, error)
- Is default provider (boolean)
- Cumulative estimated spend (tracked locally, reset monthly)

**ModelPricing** *(new — hardcoded in app config, not database)* — Per-model token pricing for cost estimation (I3).
- Model identifier
- Input token price (per 1M tokens)
- Output token price (per 1M tokens)
- Context window size (tokens)
- Updated manually in code when providers change pricing

### Relationship Summary
```
VoiceClone (1) ──── (*) WritingSample
VoiceClone (1) ──── (*) VoiceDNAVersion
VoiceClone (1) ──── (*) Content
VoiceClone (1) ──── (*) MergedCloneSource (as merged clone)
VoiceClone (1) ──── (*) MergedCloneSource (as source clone)
Content    (1) ──── (*) ContentVersion
Content    (*) ──── (0..1) GenerationPreset
MethodologySettings (1) ──── (*) MethodologyVersion
```

---

## 6. External Integrations

| Integration | Purpose | Required For |
|---|---|---|
| **OpenAI API** | LLM provider for voice analysis, content generation, authenticity scoring, voice merging | All AI features |
| **Anthropic API** | Alternative LLM provider (same capabilities) | All AI features (user choice) |
| **Google AI API (Gemini)** | Alternative LLM provider (same capabilities) | All AI features (user choice) |

**No other external integrations.** This is a local app — no analytics, no auth providers, no CDNs, no external databases. URL scraping uses standard HTTP fetch (no third-party scraping service).

**User-provided requirements:**
- At least one LLM API key must be configured before AI features work
- API keys are stored in a local `.env` file (never committed to git)
- The settings page shows connection status for each configured provider

---

## 7. Non-Functional Requirements

### Performance
- Content generation: <30 seconds per platform version (dependent on LLM provider)
- Voice DNA analysis: <60 seconds for up to 50,000 words of samples
- Page navigation: <200ms (local app, no network latency)
- Content library: handles 1,000+ items without pagination lag (virtual scrolling if needed)
- Database queries: <50ms for any single query (SQLite is fast for local workloads)

### Context Window Strategy
- Before voice DNA analysis, calculate the estimated token count for all samples + the analysis prompt
- If tokens exceed 80% of the selected model's context window: warn the user with a specific message — "Your samples total ~X tokens. [Model] supports Y tokens. The most recent samples will be prioritized. Consider switching to [larger model]."
- Truncation strategy when over limit: prioritize the most recent samples and the highest-variety content types; truncate oldest/most-similar samples first
- Show estimated token count and approximate API cost before analysis begins (ties into the token cost estimator in Section 4.7)

### Concurrent LLM Operations
- LLM API calls are independent and may run concurrently (e.g., analyzing one clone while generating content with another)
- Rate limit errors from the provider are surfaced as they occur, per-operation — no global queue
- Each operation tracks its own loading/error state independently

### Security
- API keys stored in `.env` file, never exposed to the browser
- No authentication needed (single-user local app)
- All LLM API calls are server-side (Next.js API routes)
- No data leaves the machine except LLM API calls (which send writing samples and prompts to the selected provider)
- User should be aware: writing samples and generated content are sent to third-party LLM providers

### Data
- All data stored locally in SQLite database (`data/sona.db`)
- Database file is gitignored
- No automatic backups (user responsibility)
- Version history auto-prunes to last 10 versions per entity

### Accessibility
- Keyboard navigation for all primary workflows
- Sufficient color contrast (shadcn/ui defaults meet WCAG AA)
- Screen reader compatible form labels and ARIA attributes
- Focus management on modals and dialogs

### Browser/Platform Support
- Runs on macOS (primary development environment)
- Modern browsers: Chrome, Firefox, Safari, Edge (latest versions)
- Minimum viewport: 1024px wide (dashboard layout)
- Not optimized for mobile (power-user desktop tool)

### Keyboard Shortcuts (I9)

**Priority:** Should-have (v1)

Global shortcuts:
- `Cmd+K` — Quick navigation (search for clones, content, pages)
- `Cmd+N` — New clone (from any page)

Content Generator shortcuts:
- `Cmd+Enter` — Generate content
- `Cmd+Shift+Enter` — Generate variants
- `Cmd+S` — Save to library

Content Library shortcuts:
- `Cmd+F` — Focus search
- `Cmd+A` — Select all (in list)

Help:
- `?` — Show keyboard shortcut cheat sheet (overlay)

Implementation notes:
- Shortcuts are not customizable in v1
- Shortcuts are displayed as hints in button tooltips throughout the UI
- Prevent conflicts with browser defaults where possible

---

## 8. Open Questions & Risks

### Open Questions
1. **~~Default methodology content~~** *(Resolved)* — Default content will be drafted during implementation with a structural outline provided in the PRD (see Section 4.1 methodology defaults outline). Research on prompt engineering for style analysis will inform the defaults.
2. **Authenticity scoring calibration:** How do we validate that the 8-dimension scoring produces meaningful results? There's no ground truth to calibrate against. *Recommendation: Test with known writing samples and iterate on the scoring prompt.*
3. **~~Token costs~~** *(Resolved)* — Yes, estimated token count and approximate cost are shown before analysis. Implemented via the token cost estimator (see Sections 4.7 and 7 — Context Window Strategy).
4. **~~Thread support for Twitter~~** *(Resolved)* — "Convert to thread" button splits content at sentence boundaries, respecting the 280-character limit per tweet. Button appears automatically when Twitter content exceeds 280 characters (see Section 4.6).

### Risks
1. **Voice DNA quality is the entire product.** If the analysis produces shallow or generic profiles, nothing downstream works. This risk is mitigated by making the methodology settings editable, but the defaults must be excellent.
2. **LLM consistency varies.** Different models (GPT-4o vs Claude vs Gemini) may produce different DNA analyses and content for the same inputs. Users switching models may see different results. *Mitigation: Store which model produced each DNA version and content piece.*
3. **PDF parsing is unreliable.** Complex PDFs (scanned, multi-column, heavy formatting) may extract poorly. *Mitigation: Always show extracted text for user review before adding as a sample.*
4. **URL scraping will fail on many sites.** JavaScript-heavy SPAs, paywalled content, and bot detection will block extraction. *Mitigation: Clear error messages and copy/paste as fallback.*
5. **Voice merging is experimental.** No established algorithm exists for blending qualitative writing style attributes. Results may be unpredictable. *Mitigation: Always show merged DNA for user review before saving. Label as "experimental" in the UI.*

---

## 9. Out of Scope (NOT building in v1)

- **User authentication / multi-tenancy** — Single-user local app. No login, no accounts, no teams.
- **Usage-based billing / payment integration** — No monetization in v1.
- **Direct publishing** — No API integrations with LinkedIn, Twitter, etc. Users copy/export content and publish manually.
- **Content scheduling** — No posting schedule or calendar.
- **Analytics / performance tracking** — No tracking of how content performs after publishing.
- **Collaboration features** — No sharing, commenting, or approval workflows.
- **Mobile optimization** — Desktop-first dashboard. Not responsive below 1024px.
- **OCR for scanned PDFs** — Only text-based PDFs are supported.
- **Audio/video voice cloning** — Text-based writing voice only.
- **Real-time co-editing** — Single user, no concurrency concerns.
- **Import/export of voice clones** — Cannot share clones between installations.
- **Custom platform definitions** — Platform list is hardcoded. No user-defined platforms.
- **Prompt history / undo** — Content versions provide history, but no general undo system.
- **Internationalization** — English-only UI and voice analysis.
- **Database backup/restore** — Deferred to v1.1. Users can manually copy `data/sona.db` for now.
- **Privacy dashboard** — No dedicated privacy management UI in v1.
- **Content brief templates** — No pre-built templates for common content types.
- **Style drift detection** — No automatic detection of voice drift over time.
- **Content calendar view** — No calendar-based content planning view.

---

## 10. Success Metrics

Since this is a personal tool without analytics infrastructure, success is measured qualitatively:

| Metric | How to Measure | Target |
|---|---|---|
| **Voice accuracy** | User subjectively rates: "Does generated content sound like the source writer?" | Consistently "yes" after voice clone reaches 80+ confidence |
| **Time savings** | User compares time to produce platform-ready content vs. manual writing | 50%+ time reduction per content piece |
| **Authenticity scores** | Average authenticity score across generated content | >75 average across all generated content |
| **Daily usability** | User finds themselves reaching for Sona when creating content | Regular use (3+ times/week) |
| **Voice merge utility** | Merged voices produce noticeably distinct, usable results | At least one merged voice in active use |
| **Content library value** | Library becomes the user's content reference, not just storage | User searches/references library regularly |
| **First-run completion** | New user completes provider setup and generates first content within 10 minutes | >90% of first sessions reach content generation |
| **Demo clone engagement** | Users try demo clones before creating their own | Demo clones used for at least 1 generation before first custom clone |
| **Variant selection rate** | When users generate A/B variants, they find meaningful differences | Users select a non-first variant at least 30% of the time |
| **AI detection awareness** | Users run the AI detection check on generated content | AI detection used on >25% of generated content |
| **Cost transparency** | Users feel informed about API costs before operations | No user surprise about LLM costs |
| **Keyboard shortcut adoption** | Power users discover and use keyboard shortcuts | At least 3 shortcuts used regularly after first week |

---

## Technical Architecture Summary

### Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | SQLite via better-sqlite3 + Drizzle ORM |
| AI | Vercel AI SDK with OpenAI, Anthropic, Google providers |
| File parsing | mammoth (.docx), pdf-parse (.pdf) |
| URL scraping | @mozilla/readability + jsdom |
| Testing | Vitest + React Testing Library |
| Charts | Recharts (via shadcn/ui) |
| Data tables | @tanstack/react-table |
| PDF export | jspdf |
| IDs | nanoid |

### Page Structure
```
/                        Dashboard (redirects to /clones)
/clones                  Voice clone list (with demo clones)
/clones/new              Create new clone
/clones/[id]             Clone detail (samples, DNA, confidence, quick generate)
/clones/compare?a=&b=   Clone comparison view (I8)
/clones/merge            Voice merge tool
/create                  Content Generator
/create/[id]             Edit/regenerate existing content
/library                 Content library
/settings                Methodology settings
/settings/providers      LLM provider configuration
/settings/presets        Generation preset management (I5)
```

### Key Design Decisions
- **Full snapshots for versioning** (not diffs) — simpler code, instant revert, negligible storage for local app
- **LLM-driven voice merging** (not algorithmic) — qualitative style attributes can't be mathematically averaged
- **Deterministic confidence scoring** (except voice consistency) — fast, predictable, no LLM cost
- **AI-driven authenticity scoring** — requires nuanced judgment that heuristics can't provide
- **Platform constants in code** (not database) — type-safe, no migration needed, each platform needs custom logic anyway
