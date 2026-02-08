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
1. User navigates to Content Creator page
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
- **No content exists yet:** Empty state showing "No content yet. Create your first piece in the Content Creator." with a link.
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
| Avatar | No | Image upload for visual identification |
| Type | Auto | "original" or "merged" (set by system) |

**Writing samples:**
- Add via copy/paste, file upload (.txt, .docx, .pdf), or URL scraping
- No limit on sample count per clone
- Each sample tracks: content text, word count, source type, source URL/filename (if applicable), content type (user-selected from: tweet, thread, LinkedIn post, blog post, article, email, newsletter, essay, other), length category (auto-calculated: short <300 words, medium 300-1000, long >1000)
- Samples can be individually deleted; deleting a sample does NOT auto-re-analyze DNA (user must manually trigger re-analysis)
- Sample content is stored as-is (no formatting normalization)

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
- Users can view the full DNA as a readable, structured breakdown
- Users can manually edit any DNA field (text fields are editable, dropdowns for enum fields, tag inputs for array fields)
- Manual edits create a new DNA version with trigger "manual_edit"

**DNA versioning:**
- Last 10 versions retained per clone
- Each version stores: full DNA snapshot, version number, trigger type (initial_analysis, regeneration, manual_edit, revert, sample_change), LLM model used, timestamp
- Revert: copies the selected version's DNA as a new version with trigger "revert"
- Version 11+ are automatically pruned (oldest first)

### 4.3 Voice Clone Merger

**What it does:** Combines elements from 2-5 existing voice clones into a new hybrid voice with per-element weight control.

**Why it exists:** Enables creative voice experimentation — take one writer's vocabulary and another's humor. Also useful for evolving a voice over time by blending an old voice with new influences. This is Sona's most unique differentiator; no competitor offers this.

**Priority:** Must-have (v1)

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

### 4.4 Content Creator

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
- **Partial regeneration:** Select a portion of text, right-click or button to "Regenerate selection" — only the selected portion is regenerated while the rest stays intact
- Each edit/regeneration creates a content version for history

**Step 7 — Save:**
- "Save to Library" stores the content with all metadata
- "Save & Create Another" saves and resets the form (keeping clone and property selections)
- Content is saved as "draft" status by default

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
- Platform-specific preview showing content as it would approximately appear
- Character count with visual progress bar against platform limit
- Word count display
- Green/yellow/red indicator: under limit / approaching limit (>80%) / over limit
- For Twitter: if over 280, suggest "Convert to thread?" which splits into numbered tweets

**Export options:**
- Copy to clipboard (one click, platform-formatted)
- Export as plain text file (.txt)
- Export as PDF (via jspdf)
- Multi-item export: select multiple content pieces, export as a single document (PDF or text) with separators

---

## 5. Data Model Overview

### Key Entities and Relationships

**VoiceClone** — The central entity. Represents a captured writing voice.
- Has many **WritingSamples** (the raw text that defines the voice)
- Has many **VoiceDNAVersions** (the AI-analyzed voice profile, versioned)
- Has one current VoiceDNA (pointer to the latest version)
- Can be type "original" (from samples) or "merged" (from combining other clones)
- If merged, has **MergedCloneSources** linking to source clones with per-element weights

**WritingSample** — A piece of text used to train a voice clone.
- Belongs to one VoiceClone
- Tracks source (paste, file, URL), content type, word count, length category

**VoiceDNAVersion** — A snapshot of the analyzed voice profile.
- Belongs to one VoiceClone
- Contains the full DNA JSON structure
- Tracks what triggered this version (initial analysis, manual edit, revert, merge)
- Only the last 10 versions are retained

**Content** — A piece of generated content.
- References one VoiceClone (the voice used to generate it)
- Has a target platform
- Stores current content, original content (immutable), user input, generation properties
- Has an authenticity score with 8-dimension breakdown
- Has a status lifecycle: Draft > Review > Approved > Published > Archived
- Has many **ContentVersions** tracking edit history

**ContentVersion** — A snapshot of content at a point in time.
- Belongs to one Content
- Tracks what type of edit created this version (generation, inline edit, regeneration, feedback-driven)

**MethodologySettings** — Global configuration for how the system works.
- Three records: voice_cloning, authenticity, platform_practices
- Has many **MethodologyVersions** tracking edit history
- Only the last 10 versions are retained per section

### Relationship Summary
```
VoiceClone (1) ──── (*) WritingSample
VoiceClone (1) ──── (*) VoiceDNAVersion
VoiceClone (1) ──── (*) Content
VoiceClone (1) ──── (*) MergedCloneSource (as merged clone)
VoiceClone (1) ──── (*) MergedCloneSource (as source clone)
Content    (1) ──── (*) ContentVersion
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

---

## 8. Open Questions & Risks

### Open Questions
1. **Default methodology content:** What should the default Voice Cloning Instructions, Authenticity Guidelines, and Platform Best Practices contain? These need to be high-quality out of the box. *Recommendation: Draft these during implementation using research on prompt engineering for style analysis.*
2. **Authenticity scoring calibration:** How do we validate that the 8-dimension scoring produces meaningful results? There's no ground truth to calibrate against. *Recommendation: Test with known writing samples and iterate on the scoring prompt.*
3. **Token costs:** Voice DNA analysis with 50,000 words of samples could use significant tokens. Should we show estimated cost before analysis? *Recommendation: Yes, show estimated token count and approximate cost based on the selected model's pricing.*
4. **Thread support for Twitter:** When content exceeds 280 characters, should we auto-split into a thread? What's the UX? *Recommendation: Offer a "Convert to thread" button that splits intelligently at sentence boundaries.*

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
/clones                  Voice clone list
/clones/new              Create new clone
/clones/[id]             Clone detail (samples, DNA, confidence)
/clones/merge            Voice merge tool
/create                  Content creator
/create/[id]             Edit/review content
/library                 Content library
/settings                Methodology settings
/settings/providers      LLM provider configuration
```

### Key Design Decisions
- **Full snapshots for versioning** (not diffs) — simpler code, instant revert, negligible storage for local app
- **LLM-driven voice merging** (not algorithmic) — qualitative style attributes can't be mathematically averaged
- **Deterministic confidence scoring** (except voice consistency) — fast, predictable, no LLM cost
- **AI-driven authenticity scoring** — requires nuanced judgment that heuristics can't provide
- **Platform constants in code** (not database) — type-safe, no migration needed, each platform needs custom logic anyway
