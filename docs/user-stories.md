# Sona — User Stories

Comprehensive user stories covering every feature, flow, and requirement from the PRD (`docs/plan.md`). Written for AI agent consumption — each story is self-contained with explicit acceptance criteria, scope boundaries, and technical notes.

---

## Best Practices (Agent Reference)

1. **One vertical slice per story** — each story delivers a complete capability across DB → service → API → UI
2. **Given/When/Then acceptance criteria** — translate directly to TDD test cases
3. **Scope boundaries** — every story states what it does NOT include
4. **No implicit knowledge** — all data models, API contracts, and UI expectations stated explicitly
5. **Deterministic pass/fail** — no subjective evaluation in acceptance criteria

---

## User Personas

### Alex — Solo Creator
Content creator who publishes across 2-4 platforms. Has one primary voice clone. Values speed and authenticity. Uses Sona a few times per week.

### Jordan — Agency Ghostwriter
Freelance writer managing 3-10 client voices. Uses Sona daily. Heavily uses content library organization. Values accuracy and voice management.

### Developer (Technical Enabler)
Represents the system/developer perspective for infrastructure stories that enable user-facing features.

---

## Epic Overview

| Epic | PRD Sections | Stories | Must/Should |
|------|-------------|---------|-------------|
| 1: Foundation & Provider Setup | 4.7, 4.1, I1, I3, Flow 6 | US-001 – US-007 | 7 Must |
| 2: Voice Clone Management | 4.2, I2, Flow 1 | US-008 – US-015 | 7 Must, 1 Should |
| 3: Voice DNA Analysis | 4.2 (DNA), I7 | US-016 – US-021 | 5 Must, 1 Should |
| 4: Content Generation Core | 4.4, 4.6, I3, I5, I10 | US-022 – US-029 | 5 Must, 3 Should |
| 5: Authenticity Scoring | 4.8, I6 | US-030 – US-033 | 3 Must, 1 Should |
| 6: Content Library & Versioning | 4.5 | US-034 – US-040 | 7 Must |
| 7: Voice Merge System | 4.3, I8 | US-041 – US-044 | 3 Must, 1 Should |
| 8: Polish & Enhancements | I4, I9, I11 | US-045 – US-049 | 0 Must, 5 Should |
| 9: Innovation & Safety | Gap analysis, competitive | US-050 – US-058 | 0 Must, 9 Should |

**Total: 58 stories** (35 Must-Have, 23 Should-Have)

---

## Story Dependencies

Inter-story dependency graph. Arrow means "must be completed before." Use for Beads task setup: `bd dep add <child> <parent>`.

```
US-001 → US-002, US-003, US-017, US-023, US-030, US-033
US-002 → US-007
US-003 → US-007
US-004 → US-005
US-005 → US-017, US-023, US-030
US-006 → US-007
US-008 → US-009, US-010, US-011, US-013, US-014, US-015
US-009 → US-013, US-017
US-013 → US-014
US-014 → US-015
US-015 → US-052
US-016 → US-017, US-019, US-020, US-021
US-017 → US-018, US-019
US-018 → US-013
US-019 → US-055
US-020 → US-041
US-021 → US-053
US-016 → US-053
US-022 → US-023
US-023 → US-024, US-025, US-029, US-030, US-045, US-046, US-050
US-024 → US-025
US-025 → US-026, US-051
US-026 → US-036
US-030 → US-031, US-051
US-031 → US-032
US-034 → US-035, US-036, US-058
US-036 → US-037, US-038, US-039, US-040, US-050, US-058
US-042 → US-043
US-043 → US-044
US-047 → US-049
US-048 → US-049
US-008 → US-056
```

**Reading the graph:** `US-001 → US-002` means "US-001 must complete before US-002 can start."

**No dependencies (can start immediately):** US-001, US-004, US-008, US-016, US-022, US-034, US-042, US-047, US-048, US-054, US-057

---

## Epic 1: Foundation & Provider Setup

Maps to: PRD 4.7 (LLM Provider Settings), 4.1 (Methodology Settings), I1 (Demo Clones), I3 (Token Cost Estimator), Flow 6 (First-Run & Provider Setup)

### US-001: Implement LLM provider abstraction layer

**Epic:** 1 | **Priority:** Must | **Size:** L

> As a developer, I want a unified LLM provider abstraction so that all AI features can work with OpenAI, Anthropic, or Google AI interchangeably.

**Acceptance Criteria:**

- [ ] **Given** the backend starts **When** no providers are configured **Then** all AI-dependent endpoints return 422 with `{"detail": "No AI provider configured"}`
- [ ] **Given** an `LLMProvider` protocol exists in `backend/app/llm/base.py` **When** a new provider is implemented **Then** it must implement `complete(prompt, model, temperature, max_tokens) -> str`, `stream(prompt, model, temperature, max_tokens) -> AsyncIterator[str]`, and `count_tokens(text, model) -> int`
- [ ] **Given** an OpenAI provider implementation **When** `complete()` is called with a valid API key **Then** it returns the completion text from the OpenAI SDK
- [ ] **Given** an Anthropic provider implementation **When** `complete()` is called with a valid API key **Then** it returns the completion text from the Anthropic SDK
- [ ] **Given** a Google AI provider implementation **When** `complete()` is called with a valid API key **Then** it returns the completion text from the Google Generative AI SDK
- [ ] **Given** a provider registry in `backend/app/llm/registry.py` **When** `get_provider(name)` is called **Then** it returns the correct provider instance based on current configuration
- [ ] **Given** the default provider is set to "anthropic" **When** `get_default_provider()` is called **Then** it returns the Anthropic provider instance
- [ ] **Given** any provider call fails with an API error **When** the error is caught **Then** it is re-raised as a typed `LLMError` subclass with provider name, error type (auth/rate_limit/network/quota), and original message
- [ ] **Given** any provider call fails with `LLMNetworkError` or `LLMRateLimitError` **When** the error is transient **Then** the call is automatically retried up to 2 times with exponential backoff (1s, 3s). `LLMAuthError` and `LLMQuotaError` are NOT retried — they fail immediately.

**Scope Boundary:** Does NOT include the settings UI, API key storage, or connection testing endpoint. Those are US-002 and US-003.

**Data/State Requirements:**
- Provider configuration stored in `.env` via `pydantic-settings`: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `DEFAULT_LLM_PROVIDER`, `OPENAI_MODEL`, `ANTHROPIC_MODEL`, `GOOGLE_MODEL`
- Model pricing table as a constant in `backend/app/constants.py` (hardcoded, updated manually)

**Technical Notes:**
- Files: `backend/app/llm/base.py` (protocol), `backend/app/llm/openai.py`, `backend/app/llm/anthropic.py`, `backend/app/llm/google.py`, `backend/app/llm/registry.py`
- Use native SDKs: `openai`, `anthropic`, `google-generativeai`
- Prompt templates in `backend/app/llm/prompts.py` (separate file for frequent iteration)
- Provider errors mapped to `backend/app/exceptions.py` subclasses: `LLMAuthError`, `LLMRateLimitError`, `LLMNetworkError`, `LLMQuotaError`
- FastAPI dependency `get_llm_provider` in `backend/app/api/deps.py`

---

### US-002: Build LLM provider configuration UI with .env key management

**Epic:** 1 | **Priority:** Must | **Size:** L

> As Alex, I want to configure my AI provider API keys so that I can use Sona's AI features.

**Acceptance Criteria:**

- [ ] **Given** the user navigates to `/settings/providers` **When** no keys are configured **Then** three provider cards are shown (OpenAI, Anthropic, Google AI) each with status "Not Configured" (gray dash icon)
- [ ] **Given** a provider card for OpenAI **When** the user enters an API key **Then** the key is masked after entry showing only the last 4 characters with a "Show" toggle to reveal temporarily
- [ ] **Given** a provider card **When** the user selects a model from the dropdown **Then** the dropdown shows provider-specific models (OpenAI: GPT-4o, GPT-4o-mini; Anthropic: Claude Sonnet, Claude Opus; Google: Gemini Pro, Gemini Flash)
- [ ] **Given** a valid API key is entered **When** the user clicks "Save" **Then** the backend writes the key to `.env` file and returns a masked version (last 4 chars only)
- [ ] **Given** multiple providers are configured **When** the user sets one as default via radio button **Then** only providers with successful connection tests can be selected as default
- [ ] **Given** only one provider is configured and tested **When** the page loads **Then** it is automatically the default (radio pre-selected)
- [ ] **Given** the API key is saved **When** the page is reloaded **Then** the key field shows `••••••••sk-1234` (masked) — the full key is NEVER returned to the browser

**Scope Boundary:** Does NOT include connection testing (US-003) or token cost tracking display (US-028).

**Data/State Requirements:**
- Backend API: `PUT /api/providers/{name}` with body `{api_key, model}` → writes to `.env`, returns `{name, model, status, masked_key}`
- Backend API: `GET /api/providers` → returns all providers with masked keys and status
- Backend API: `PUT /api/providers/default` with body `{name}` → sets default provider
- Keys stored in `.env` file (gitignored), never in database

**UI/UX Notes:**
- Route: `/settings/providers`
- Layout: Three cards in a column, one per provider (OpenAI, Anthropic, Google AI)
- Each card: provider name/logo, masked API key input, model dropdown, status indicator, Save button
- Default provider selector: radio button group below the cards (only enabled providers shown)
- Error states per PRD 4.7: invalid key, expired key, rate limited, network error, insufficient quota

**Technical Notes:**
- Frontend page: `frontend/src/pages/settings/ProvidersPage.tsx`
- Frontend components: `frontend/src/components/settings/ProviderCard.tsx`
- Backend route: `backend/app/api/providers.py`
- Backend service: `backend/app/services/provider_service.py` — reads/writes `.env` using `pydantic-settings`
- Backend schema: `backend/app/schemas/provider.py`
- Use React Hook Form + Zod for the form
- Use `sonner` toast for save confirmation

---

### US-003: Implement provider connection testing and status indicators

**Epic:** 1 | **Priority:** Must | **Size:** M

> As Alex, I want to test my API key connection so that I know it's working before I try to use AI features.

**Acceptance Criteria:**

- [ ] **Given** a provider has an API key entered **When** the user clicks "Test Connection" **Then** the backend sends a minimal API call (e.g., list models or a 1-token completion) to verify the key
- [ ] **Given** the test succeeds **When** the response returns **Then** the status indicator turns green with a checkmark and text "Connected"
- [ ] **Given** the test fails with an invalid key **When** the response returns **Then** the status shows red X with "This API key was not accepted by [Provider]. Please check and try again."
- [ ] **Given** the test fails with rate limiting **When** the response returns **Then** the status shows yellow with "Connection test was rate limited. The key appears valid — try again in a moment."
- [ ] **Given** the test fails with a network error **When** the response returns **Then** the status shows red X with "Could not reach [Provider]'s API. Check your internet connection."
- [ ] **Given** the test fails with insufficient quota **When** the response returns **Then** the status shows red X with "This API key has insufficient quota. Check your billing status at [Provider]."
- [ ] **Given** a provider key is saved **When** the save completes **Then** the connection test runs automatically
- [ ] **Given** a provider key has never been tested **When** the page loads **Then** the status shows yellow warning with "Untested"

**Scope Boundary:** Does NOT include provider selection for specific operations (that's part of individual AI feature stories).

**Data/State Requirements:**
- Backend API: `POST /api/providers/{name}/test` → returns `{status: "connected" | "error", error_type?, error_message?}`
- Status values: `not_configured` (gray), `connected` (green), `error` (red), `untested` (yellow)

**UI/UX Notes:**
- "Test Connection" button on each provider card (disabled when no key is entered)
- Loading spinner on button during test
- Status indicator: colored dot + text label + error detail if applicable

**Technical Notes:**
- Backend: add `test_connection()` method to each LLM provider in `backend/app/llm/`
- OpenAI: call `client.models.list()` as a lightweight test
- Anthropic: call `client.messages.create()` with 1 max token
- Google: call `genai.list_models()` as a lightweight test
- Map SDK-specific exceptions to the 5 error types from PRD 4.7

---

### US-004: Build methodology settings editor with markdown editing and version history

**Epic:** 1 | **Priority:** Must | **Size:** L

> As Jordan, I want to edit the methodology settings that control how Sona analyzes voices and generates content so that I can tune the system for my clients' needs.

**Acceptance Criteria:**

- [ ] **Given** the user navigates to `/settings` **When** the page loads **Then** three tabbed sections are shown: "Voice Cloning Instructions", "Authenticity Guidelines", "Platform Best Practices"
- [ ] **Given** a methodology section is selected **When** the user views it **Then** the current content is displayed in an editable textarea (plain text/markdown)
- [ ] **Given** the user edits a section **When** they click "Save" **Then** a new version is created, version counter increments, and a success toast appears
- [ ] **Given** no changes have been made **When** the user views the save button **Then** it is disabled with text "No changes to save"
- [ ] **Given** a section has multiple versions **When** the user clicks "Version History" **Then** the last 10 versions are shown with: version number, timestamp, trigger type (edit, revert, seed)
- [ ] **Given** the user views a previous version **When** they click "Revert" **Then** a NEW version is created with the reverted content (revert does not delete subsequent versions), trigger type is "revert"
- [ ] **Given** a section has 10 versions **When** a new version is saved **Then** the oldest version is automatically pruned (no user notification)
- [ ] **Given** the methodology content **When** it is used in LLM prompts **Then** the Voice Cloning Instructions are injected into DNA analysis prompts, Authenticity Guidelines into content generation prompts, and Platform Best Practices into per-platform generation prompts

**Scope Boundary:** Does NOT include the default seed content (US-005). Does NOT include a rich text editor — plain textarea with markdown is sufficient for v1.

**Data/State Requirements:**
- DB model: `MethodologySettings` with fields: `id` (nanoid), `section` (enum: voice_cloning, authenticity, platform_practices), `content` (text), `created_at`, `updated_at`
- DB model: `MethodologyVersion` with fields: `id` (nanoid), `methodology_id` (FK), `version_number` (int), `content` (text), `trigger_type` (enum: seed, edit, revert), `created_at`
- Backend API: `GET /api/methodology` → returns all 3 sections with current content
- Backend API: `GET /api/methodology/{section}` → returns one section with current content
- Backend API: `PUT /api/methodology/{section}` with body `{content}` → creates new version, returns updated section
- Backend API: `GET /api/methodology/{section}/versions` → returns last 10 versions
- Backend API: `POST /api/methodology/{section}/revert/{version_id}` → creates new version from specified version

**UI/UX Notes:**
- Route: `/settings` (methodology is the default settings page)
- Tabs component for the 3 sections
- Main area: large textarea (resizable) with current content
- Sidebar or drawer: version history list
- Each version row: `v3 — Jan 15, 2026 — edit` with a "Revert" button

**Technical Notes:**
- Frontend page: `frontend/src/pages/settings/MethodologyPage.tsx`
- Frontend components: `frontend/src/components/settings/MethodologyEditor.tsx`, `VersionHistory.tsx`
- Backend: `backend/app/api/methodology.py`, `backend/app/services/methodology_service.py`, `backend/app/models/methodology.py`, `backend/app/schemas/methodology.py`
- Use `react-markdown` for preview rendering (optional toggle between edit/preview)

---

### US-005: Seed default methodology content for all 3 sections

**Epic:** 1 | **Priority:** Must | **Size:** M

> As a developer, I want high-quality default methodology content seeded on first run so that users can start using Sona immediately without writing methodology from scratch.

**Acceptance Criteria:**

- [ ] **Given** Sona starts for the first time (empty database) **When** the app initializes **Then** all 3 methodology sections are seeded with default content as version 1 with trigger type "seed"
- [ ] **Given** the Voice Cloning Instructions default **When** it is reviewed **Then** it is >= 1,500 words and covers all 9 linguistic dimensions (vocabulary, sentence structure, paragraph structure, tone, rhetorical devices, punctuation, openings/closings, humor, signatures) with 3+ sub-instructions per dimension. It also includes: output format matching Voice DNA JSON schema, guidance on distinguishing patterns from anomalies, instructions to evaluate consistency, instructions to assign prominence scores (0-100).
- [ ] **Given** the Authenticity Guidelines default **When** it is reviewed **Then** it covers: avoiding AI tells (repetitive transitions, hedging, generic conclusions), incorporating voice elements (contractions, punctuation habits, sentence variety), maintaining natural imperfection, matching vocabulary complexity, authentic openings/closings
- [ ] **Given** the Platform Best Practices default **When** it is reviewed **Then** it has a dedicated section per platform for: LinkedIn, Twitter/X, Facebook, Instagram, Blog, Email, Newsletter, SMS — each section includes: character/word limit, formatting conventions, tone norms, hashtag/mention usage, CTA conventions
- [ ] **Given** the database already has methodology content **When** the app restarts **Then** the seed does NOT overwrite existing content

**Scope Boundary:** Does NOT include methodology editing (US-004). Content should be comprehensive but can be iterated post-launch.

**Data/State Requirements:**
- Seed data lives in `backend/app/seed.py`
- Check for existing methodology rows before seeding

**Technical Notes:**
- Called from FastAPI lifespan event in `backend/app/main.py`
- Content is stored as markdown strings — long but straightforward
- Reference PRD Section 4.1 "Default content structural outline" for the topics each section must cover

---

### US-006: Create demo voice clones with pre-analyzed DNA and samples

**Epic:** 1 | **Priority:** Must | **Size:** M

> As Alex, I want to see demo voice clones when I first open Sona so that I can understand the product and try content generation immediately after configuring a provider.

**Acceptance Criteria:**

- [ ] **Given** Sona starts for the first time **When** the app initializes **Then** 3 demo voice clones are created: "Professional Blogger" (formal, structured, educational), "Casual Social" (conversational, punchy, emoji-comfortable), "Technical Writer" (precise, jargon-comfortable, systematic)
- [ ] **Given** each demo clone **When** it is created **Then** it has: `type` = "demo", `is_demo` = true, 3-5 writing samples, pre-analyzed Voice DNA (version 1), prominence scores for radar chart, confidence score of 80+
- [ ] **Given** a demo clone **When** a user views it on the clone list **Then** it shows a "Demo" badge
- [ ] **Given** a demo clone **When** a user tries to add a sample **Then** the action is blocked (add sample button hidden or disabled)
- [ ] **Given** a demo clone **When** a user tries to delete it **Then** the delete action is hidden
- [ ] **Given** a demo clone **When** a user tries to re-analyze DNA **Then** the analyze button is hidden
- [ ] **Given** a demo clone **When** an AI provider is configured **Then** the user can generate content using the demo clone
- [ ] **Given** the database already has demo clones **When** the app restarts **Then** the seed does NOT create duplicates

**Scope Boundary:** Does NOT include the "Hide Demo Clones" toggle (that's part of US-014). Does NOT include actual LLM analysis — the DNA is hand-crafted seed data.

**Data/State Requirements:**
- Demo clones use the same `VoiceClone`, `WritingSample`, and `VoiceDNAVersion` models as user clones
- Each demo clone's DNA JSON must match the full Voice DNA schema (9 categories with all sub-fields + prominence scores)
- Seed data in `backend/app/seed.py`

**Technical Notes:**
- All 9 DNA categories must be populated (no empty arrays or null values). Prominence scores must be in the 20-95 range. DNA must be internally consistent: "Professional Blogger" formality > 60; "Casual Social" formality < 50. Each demo clone's scores must form a distinct shape on the radar chart.
- Demo writing samples should be 3-5 representative pieces per clone, each 200-800 words
- Confidence scores pre-calculated: word count component + sample count component + content type variety + length mix (deterministic components only, consistency score set to a reasonable value like 12/15)

---

### US-007: Implement first-run flow with empty states and setup CTAs

**Epic:** 1 | **Priority:** Must | **Size:** M

> As Alex, I want clear guidance when I first open Sona so that I know how to get started.

**Acceptance Criteria:**

- [ ] **Given** no API keys are configured **When** the user navigates to `/clones` **Then** a welcome empty state is shown with: app logo, tagline "Capture your writing voice, generate authentic content", primary CTA "Set Up AI Provider" linking to `/settings/providers`, secondary CTA "Explore Demo Voices" that scrolls to demo clones below
- [ ] **Given** demo clones exist but no provider is configured **When** the user views `/clones` **Then** demo clones are visible and browsable (can view DNA and samples) but content generation is blocked
- [ ] **Given** no provider is configured **When** the user tries any AI action (Analyze DNA, Generate Content, Check Authenticity) **Then** an inline message appears: "No AI provider configured. [Go to Settings]" with a link to `/settings/providers`
- [ ] **Given** the user configures a provider successfully **When** they are redirected back to `/clones` **Then** a success toast appears: "AI provider configured! You're ready to go."
- [ ] **Given** a provider is configured but no user clones exist **When** the user views `/clones` **Then** demo clones are shown with a "Create Your First Clone" CTA button
- [ ] **Given** the user skips provider setup **When** they navigate freely **Then** the app is fully navigable — creating clones, adding samples, browsing the library all work; only AI-powered actions are blocked
- [ ] **Given** the user navigates to `/` (root URL) **When** the route resolves **Then** they are redirected to `/clones`
- [ ] **Given** the `RequiresProvider` guard component **When** it checks provider status **Then** it checks live provider status (not just initial config). If an API key is removed mid-session, the same friendly "No AI provider configured" message appears on the next AI action attempt.

**Scope Boundary:** Does NOT include the clone list page itself (US-014) or clone creation (US-008). Only covers the empty/first-run states and provider-missing guard.

**UI/UX Notes:**
- Empty state uses app logo, clean typography, large CTAs (shadcn/ui Button with primary and outline variants)
- Provider-missing guard is a reusable component: `frontend/src/components/shared/RequiresProvider.tsx`
- Toast on successful provider setup via URL param or query state

**Technical Notes:**
- Frontend: check provider status via `GET /api/providers` — if none have `status: "connected"`, show first-run state
- Create a custom hook `frontend/src/hooks/use-providers.ts` with `useHasConfiguredProvider()` helper
- Guard component wraps AI action buttons and shows inline message when no provider configured

---

## Epic 2: Voice Clone Management

Maps to: PRD 4.2 (Clone CRUD, Samples, Confidence), I2 (Auto-detect Content Type), Flow 1 (Create a Voice Clone)

### US-008: Implement voice clone CRUD with database models

**Epic:** 2 | **Priority:** Must | **Size:** L

> As Alex, I want to create, view, update, and delete voice clones so that I can manage my writing voices.

**Acceptance Criteria:**

- [ ] **Given** the user clicks "New Clone" **When** they enter a name and optionally a description and tags **Then** a new clone is created with `type` = "original", confidence score 0, and the user lands on the clone detail page
- [ ] **Given** a clone exists **When** the user views the clone detail page header **Then** they see: clone name (inline-editable), type badge, confidence score badge, action buttons
- [ ] **Given** the user edits clone metadata (name, description, tags) **When** they save (blur or explicit save) **Then** the changes are persisted; name is required, others optional
- [ ] **Given** the user uploads an avatar (JPG, PNG, WebP, max 2MB) **When** it is saved **Then** it is auto-resized to 128×128 using Pillow with LANCZOS resampling, converted to WebP format, and stored in `data/avatars/{clone_id}.webp`
- [ ] **Given** the user uploads a non-JPG/PNG/WebP file or a file >2MB **When** validation runs **Then** an error toast appears: "Avatars must be JPG, PNG, or WebP and under 2MB."
- [ ] **Given** no avatar is uploaded **When** the clone is displayed **Then** a colored circle with the clone's initials is shown as default
- [ ] **Given** the user creates a clone with a name that already exists **When** saved **Then** the clone is created successfully — duplicate clone names are allowed
- [ ] **Given** the user clicks "Delete" on a non-demo clone **When** the confirmation dialog appears **Then** it reads: "Delete [name]? This clone and all its writing samples and DNA versions will be permanently deleted. Content generated from this clone will be preserved but will show '[Deleted clone]' as the voice source."
- [ ] **Given** the user confirms deletion **When** the clone is deleted **Then** all associated samples and DNA versions are deleted; content records retain the clone name for display but the FK is nullified
- [ ] **Given** a demo clone **When** the user views it **Then** the delete action is hidden

**Scope Boundary:** Does NOT include writing samples (US-009–US-012), DNA analysis (Epic 3), confidence scoring (US-013), or the clone list page (US-014). This story covers the clone entity CRUD and detail page shell.

**Data/State Requirements:**
- DB model `VoiceClone`: `id` (nanoid), `name` (str, required), `description` (str, nullable), `tags` (JSON array), `avatar_path` (str, nullable), `type` (enum: original, merged, demo), `is_demo` (bool, default false), `is_hidden` (bool, default false), `confidence_score` (int, default 0), `created_at`, `updated_at`
- Backend API: `POST /api/clones` with body `{name, description?, tags?}` → creates clone, returns full clone
- Backend API: `GET /api/clones/:id` → returns clone with all fields
- Backend API: `PATCH /api/clones/:id` with body `{name?, description?, tags?}` → updates clone
- Backend API: `POST /api/clones/:id/avatar` (multipart) → uploads and resizes avatar
- Backend API: `DELETE /api/clones/:id` → soft-nullifies content FKs, hard-deletes clone + samples + DNA

**UI/UX Notes:**
- Route: `/clones/new` for creation, `/clones/:id` for detail
- Clone detail page has 3 tabs: Samples | Voice DNA | Generated Content (tab content from later stories)
- Inline-editable name: click to edit, blur or Enter to save
- Confirmation dialog uses shadcn/ui Dialog component

**Technical Notes:**
- Backend: `backend/app/models/clone.py`, `backend/app/schemas/clone.py`, `backend/app/services/clone_service.py`, `backend/app/api/clones.py`
- Frontend page: `frontend/src/pages/clones/CloneDetailPage.tsx`
- Frontend components: `frontend/src/components/clones/CloneHeader.tsx`, `CloneMetadataForm.tsx`
- Avatar resize: use Pillow or similar on the backend; store at `data/avatars/{clone_id}.webp`
- Use nanoid for clone IDs

---

### US-009: Add writing samples via paste with content type selection

**Epic:** 2 | **Priority:** Must | **Size:** M

> As Alex, I want to paste my writing into Sona so that it can analyze my voice from my existing content.

**Acceptance Criteria:**

- [ ] **Given** the user is on the Samples tab of a clone detail page **When** they click "Add Sample" **Then** a dialog/panel opens with: a large textarea, a content type dropdown, and "Add" / "Cancel" buttons
- [ ] **Given** the user pastes text into the textarea **When** they view the content type dropdown **Then** options are: Tweet, Thread, LinkedIn Post, Blog Post, Article, Email, Newsletter, Essay, Other
- [ ] **Given** the user selects a content type and clicks "Add" **When** the sample is saved **Then** it records: content text (stored as-is), word count (auto-calculated), source type "paste", content type, length category (auto: short <300 words, medium 300-1000, long >1000), timestamp
- [ ] **Given** a sample is added **When** the samples list refreshes **Then** the new sample appears with: content type, word count, source type "paste", date added, delete button
- [ ] **Given** the user clicks delete on a sample **When** confirmed **Then** the sample is permanently deleted; confidence score updates for deterministic components; DNA is NOT re-analyzed automatically
- [ ] **Given** the textarea is empty **When** the user tries to add **Then** the "Add" button is disabled
- [ ] **Given** the user pastes text exceeding 50,000 words **When** the paste is processed **Then** a warning appears: "Your text exceeds 50,000 words. Only the first 50,000 words will be used." The text is truncated to the limit.

**Scope Boundary:** Does NOT include file upload (US-010), URL scraping (US-011), or auto-detect content type (US-012). Content type is manually selected in this story.

**Data/State Requirements:**
- DB model `WritingSample`: `id` (nanoid), `clone_id` (FK), `content` (text), `word_count` (int), `source_type` (enum: paste, file, url), `source_url` (str, nullable), `source_filename` (str, nullable), `content_type` (enum: tweet, thread, linkedin_post, blog_post, article, email, newsletter, essay, other), `content_type_detected` (bool, default false), `length_category` (enum: short, medium, long), `created_at`
- Backend API: `POST /api/clones/:id/samples` with body `{content, content_type, source_type: "paste"}` → auto-calculates word_count and length_category, returns sample
- Backend API: `GET /api/clones/:id/samples` → returns all samples for a clone
- Backend API: `DELETE /api/clones/:id/samples/:sample_id` → deletes sample

**UI/UX Notes:**
- Add sample dialog: shadcn/ui Dialog with textarea + dropdown
- Samples list: table or card list showing each sample's metadata
- No sample content preview in the list (just metadata) — clicking a sample could expand to show content

**Technical Notes:**
- Backend: `backend/app/models/sample.py`, `backend/app/schemas/sample.py`, `backend/app/services/sample_service.py`, `backend/app/api/samples.py`
- Frontend components: `frontend/src/components/samples/AddSampleDialog.tsx`, `SampleList.tsx`
- Word count: `len(content.split())`
- Length category: short (<300), medium (300-1000), long (>1000)

---

### US-010: Add writing samples via file upload (txt, docx, pdf) with preview

**Epic:** 2 | **Priority:** Must | **Size:** L

> As Jordan, I want to upload my clients' documents so that I can quickly build voice clones from their existing writing.

**Acceptance Criteria:**

- [ ] **Given** the user clicks "Add Sample" and selects "File Upload" **When** the upload panel appears **Then** it shows a drag-and-drop zone accepting .txt, .docx, and .pdf files
- [ ] **Given** a .txt file is uploaded **When** text is extracted **Then** the full text content is shown in a preview area for confirmation
- [ ] **Given** a .docx file is uploaded **When** text is extracted via python-docx **Then** the extracted text is shown in a preview for confirmation
- [ ] **Given** a .pdf file is uploaded **When** text is extracted via pymupdf/pymupdf4llm **Then** the extracted text is shown in a preview for confirmation
- [ ] **Given** a PDF extracts garbled text **When** the preview is shown **Then** a warning appears: "This PDF may not have extracted cleanly. Please review the text below and edit if needed before adding." The preview text is editable.
- [ ] **Given** a file exceeds 50,000 words **When** it is processed **Then** a warning appears: "This file is very large. Only the first 50,000 words will be used." Processing continues with truncation.
- [ ] **Given** an unsupported file type is uploaded **When** validation runs **Then** an error appears: "Sona supports .txt, .docx, and .pdf files. Please convert your file and try again."
- [ ] **Given** an empty or unreadable file is uploaded **When** extraction fails **Then** an error appears: "No readable text found in this file."
- [ ] **Given** the preview is confirmed **When** the user selects a content type and clicks "Add" **Then** the sample is saved with `source_type: "file"` and `source_filename` set to the original filename

**Scope Boundary:** Does NOT include URL scraping (US-011). Does NOT include OCR for scanned PDFs (out of scope for v1).

**Data/State Requirements:**
- Backend API: `POST /api/clones/:id/samples/upload` (multipart form) → extracts text, returns `{extracted_text, word_count, warnings[]}`
- After user confirms preview: uses the same `POST /api/clones/:id/samples` endpoint with `source_type: "file"`

**UI/UX Notes:**
- Use `react-dropzone` for drag-and-drop
- Preview area: textarea (editable for cleanup), word count display, warning banners if applicable
- Two-step flow: upload → preview/confirm → save

**Technical Notes:**
- Backend file parser: `backend/app/services/file_parser.py`
- Use `python-docx` for .docx, `pymupdf` + `pymupdf4llm` for .pdf, built-in Python for .txt
- Upload endpoint is separate from save endpoint — file is processed server-side, text returned for preview, then user confirms

---

### US-011: Add writing samples via URL scraping with error handling

**Epic:** 2 | **Priority:** Must | **Size:** M

> As Jordan, I want to import writing samples from URLs so that I can quickly capture a client's published work.

**Acceptance Criteria:**

- [ ] **Given** the user clicks "Add Sample" and selects "URL" **When** the URL input appears **Then** it shows a text input for the URL and a "Fetch" button
- [ ] **Given** a valid URL is entered **When** the user clicks "Fetch" **Then** the backend scrapes the page, extracts the main text content, and returns it for preview
- [ ] **Given** the URL scrape succeeds **When** the preview is shown **Then** the extracted text, word count, and source URL are displayed; user selects content type and clicks "Add"
- [ ] **Given** the URL scrape fails (bot detection, JS-heavy SPA, paywall, network error) **When** the error is returned **Then** a toast appears: "Could not extract text from this URL. The site may block automated access. Try copying the text and pasting it instead." Sample is not added.
- [ ] **Given** the scrape returns very little text (<50 words) **When** the preview is shown **Then** a warning appears: "Only [N] words were extracted. The page may not have loaded fully. Review the text or try pasting instead."
- [ ] **Given** the preview is confirmed **When** the user saves **Then** the sample is saved with `source_type: "url"` and `source_url` set to the original URL

**Scope Boundary:** Does NOT include JavaScript rendering — uses standard HTTP fetch only. Does NOT include pagination or multi-page scraping.

**Data/State Requirements:**
- Backend API: `POST /api/samples/scrape` with body `{url}` → returns `{extracted_text, word_count, source_url, warnings[]}`

**Technical Notes:**
- Backend: `backend/app/services/scraping_service.py`
- Use `httpx` for async HTTP requests, `beautifulsoup4` with `lxml` parser for HTML text extraction
- Extract from `<article>`, `<main>`, or largest text block as heuristic
- Set a reasonable User-Agent header and timeout (10 seconds)

---

### US-012: Implement auto-detect content type heuristics

**Epic:** 2 | **Priority:** Should | **Size:** S

> As Alex, I want the content type to be auto-detected when I add a sample so that I don't have to manually classify every piece.

**Acceptance Criteria:**

- [ ] **Given** the user pastes text into the add sample dialog **When** the text is entered **Then** the content type dropdown is pre-selected with the detected type and a "(detected)" label
- [ ] **Given** text for auto-detection **When** the heuristic runs **Then** rules are evaluated in priority order (first match wins):
  1. **Tweet:** <300 chars AND 1+ hashtag → "Tweet (detected)"
  2. **Email:** greeting pattern (e.g., "Hi", "Hello", "Dear") AND sign-off pattern (e.g., "Best", "Regards", "Thanks", "Cheers") → "Email (detected)"
  3. **Newsletter:** >200 words AND 2+ markdown-style headings AND greeting pattern → "Newsletter (detected)"
  4. **Blog Post:** >500 words AND 1+ markdown-style heading → "Blog Post (detected)"
  5. **Thread:** 3+ numbered items or 3+ segments separated by blank lines (each <300 chars) → "Thread (detected)"
  6. **LinkedIn Post:** 300-3000 chars AND no heading patterns → "LinkedIn Post (detected)"
  7. **Other:** fallback when no rule matches → "Other (detected)"
- [ ] **Given** a content type is auto-detected **When** the user changes it manually **Then** the "(detected)" label disappears and the manual selection is used
- [ ] **Given** a sample is saved with auto-detected type **When** it is stored **Then** `content_type_detected` is true
- [ ] **Given** a file upload or URL import **When** text is extracted **Then** auto-detect also runs on the extracted content

**Scope Boundary:** This is heuristic-based only — no LLM calls for detection.

**Technical Notes:**
- Frontend utility function in `frontend/src/lib/utils.ts` or `frontend/src/lib/content-type-detector.ts`
- Simple rule-based detection: check character count, presence of patterns (hashtags, headings, greetings)
- Also implement on backend in `backend/app/services/sample_service.py` for URL/file imports

---

### US-013: Implement confidence scoring algorithm (5 deterministic components)

**Epic:** 2 | **Priority:** Must | **Size:** M

> As Jordan, I want to see a confidence score for each voice clone so that I know when a clone is ready to use for client work.

**Acceptance Criteria:**

- [ ] **Given** a clone with samples **When** the confidence score is calculated **Then** it uses 5 components summing to 100 max:
  - Total word count (30 pts): <500w=5, 500-1000=10, 1000-2500=15, 2500-5000=22, 5000+=30
  - Sample count (20 pts): 1=4, 2=8, 3=12, 4-5=16, 6+=20
  - Content type variety (20 pts): 1 type=5, 2=10, 3=15, 4+=20
  - Length mix (15 pts): 1 category=5, 2=10, all 3=15
  - Voice consistency (15 pts): LLM-derived, only set during DNA analysis, mapped 0-100 → 0-15
- [ ] **Given** a sample is added or removed **When** the score updates **Then** the 4 deterministic components (85 pts max) recalculate immediately; voice consistency stays at its last value (or 0 if no analysis yet)
- [ ] **Given** a score of 80-100 **When** displayed **Then** green badge with "Ready for use"
- [ ] **Given** a score of 60-79 **When** displayed **Then** yellow badge with "Usable — add more samples for better results"
- [ ] **Given** a score below 60 **When** displayed **Then** red badge with "Add more samples before generating content"
- [ ] **Given** the score breakdown **When** displayed on the clone detail page **Then** each component's contribution is shown (e.g., "Word count: 22/30, Samples: 16/20, Type variety: 10/20, Length mix: 10/15, Consistency: 0/15")
- [ ] **Given** low scores in specific areas **When** recommendations are shown **Then** specific suggestions appear per PRD (low word count → "Add more writing samples. You have X words; aim for 5,000+ for best results.", low variety → "You only have [types]. Try adding a [missing type]", etc.)

**Scope Boundary:** Does NOT include voice consistency calculation (that's part of US-018). This story implements the algorithm and the 4 deterministic components.

**Data/State Requirements:**
- Confidence score stored on `VoiceClone.confidence_score` (int)
- Recalculated server-side whenever samples change
- Backend API: `GET /api/clones/:id` includes `confidence_score` and `confidence_breakdown` (object with each component's value)

**Technical Notes:**
- Backend: scoring logic in `backend/app/services/clone_service.py` method `calculate_confidence(clone_id)`
- Called after every sample add/delete
- Frontend component: `frontend/src/components/clones/ConfidenceScore.tsx` (badge + breakdown panel)

---

### US-014: Build clone list page with search, type filter, and demo toggle

**Epic:** 2 | **Priority:** Must | **Size:** M

> As Jordan, I want to see all my voice clones in an organized list so that I can quickly find and manage client voices.

**Acceptance Criteria:**

- [ ] **Given** clones exist **When** the user navigates to `/clones` **Then** a card grid layout shows each clone with: name, avatar (or colored circle with initials), confidence score badge, type badge (Original / Merged / Demo), radar chart thumbnail (small, non-interactive), sample count, last updated date
- [ ] **Given** multiple clones **When** displayed **Then** they are sorted by last updated (most recent first)
- [ ] **Given** the search input **When** the user types a name **Then** clones are filtered by name match (case-insensitive)
- [ ] **Given** the type filter **When** the user selects "Original", "Merged", or "Demo" **Then** only clones of that type are shown; "All" shows everything
- [ ] **Given** the "Hide Demo Clones" toggle **When** toggled on **Then** demo clones are hidden from the list; toggle state is persisted in localStorage
- [ ] **Given** no clones exist (fresh install) **When** the user views `/clones` **Then** the empty state from US-007 is shown
- [ ] **Given** a clone card **When** the user clicks the "..." overflow menu **Then** options include: "View Details", "Quick Generate" (if provider configured), "Delete" (not shown for demo clones)

**Scope Boundary:** Does NOT include clone creation form (part of US-008) or the clone comparison selection (US-041). Radar chart thumbnail requires US-020 to be complete (show placeholder until then).

**UI/UX Notes:**
- Route: `/clones`
- Card grid: responsive, 2-3 columns on desktop
- Search: text input at top
- Type filter: button group or tabs (All | Original | Merged | Demo)
- "Hide Demo Clones" toggle: small switch in filter area, persisted to localStorage

**Technical Notes:**
- Frontend page: `frontend/src/pages/clones/CloneListPage.tsx`
- Frontend components: `frontend/src/components/clones/CloneCard.tsx`, `CloneFilters.tsx`
- Backend API: `GET /api/clones` → returns all clones with summary fields
- Use Zustand store for hide-demo preference (persisted to localStorage via `ui-store.ts`)

---

### US-015: Build clone detail page with 3-tab layout

**Epic:** 2 | **Priority:** Must | **Size:** L

> As Jordan, I want a detailed view of each voice clone with tabs for samples, DNA, and generated content so that I can manage all aspects of a client's voice in one place.

**Acceptance Criteria:**

- [ ] **Given** the user navigates to `/clones/:id` **When** the page loads **Then** the header shows: clone name (inline-editable), type badge, confidence score badge, and action buttons: "Analyze Voice DNA" (or "Re-analyze" after first analysis), "Quick Generate" (placeholder until US-029), "Delete"
- [ ] **Given** the clone detail page **When** viewed **Then** 3 tabs are shown: "Samples", "Voice DNA", "Generated Content"
- [ ] **Given** the Samples tab is selected **When** viewed **Then** it shows: sample list (from US-009), "Add Sample" button, confidence score breakdown panel on the side
- [ ] **Given** the Voice DNA tab is selected and no DNA exists **When** viewed **Then** an empty state appears: "No Voice DNA yet. Add writing samples and click 'Analyze Voice DNA' to generate a voice profile."
- [ ] **Given** the Voice DNA tab is selected and DNA exists **When** viewed **Then** it shows: radar chart (placeholder until US-020), structured DNA fields by category, version history sidebar
- [ ] **Given** the Generated Content tab is selected **When** viewed **Then** it shows a filtered view of the content library for this clone only (pre-filtered, same columns as main library)
- [ ] **Given** a demo clone **When** viewed on detail page **Then** "Add Sample", "Analyze Voice DNA", and "Delete" buttons are hidden; metadata is read-only
- [ ] **Given** the "Analyze Voice DNA" button **When** no provider is configured **Then** inline message "No AI provider configured. [Go to Settings]" replaces the button action

**Scope Boundary:** This story builds the page shell and tab structure. Tab content components are from other stories: Samples (US-009), DNA display (US-016/US-019), Generated Content (US-036 filtered). "Quick Generate" panel is US-029.

**UI/UX Notes:**
- Route: `/clones/:id`
- Use shadcn/ui Tabs component
- Header layout: name on left, badges in middle, action buttons on right
- Confidence breakdown panel: card on the side of Samples tab showing each component's contribution

**Technical Notes:**
- Frontend page: `frontend/src/pages/clones/CloneDetailPage.tsx`
- Composes: `CloneHeader`, `SampleList`, `VoiceDNAPanel`, `CloneContentList`
- Backend: `GET /api/clones/:id` returns full clone data; related data loaded via separate endpoints

---

## Epic 3: Voice DNA Analysis

Maps to: PRD 4.2 (DNA analysis, DNA versioning, radar chart), I7 (Radar Chart Visualization)

### US-016: Design Voice DNA JSON schema with 9 categories and prominence scores

**Epic:** 3 | **Priority:** Must | **Size:** M

> As a developer, I want a well-defined Voice DNA JSON schema so that all AI analysis, content generation, and UI display use a consistent structure.

**Acceptance Criteria:**

- [ ] **Given** the Voice DNA schema **When** reviewed **Then** it contains 9 top-level categories: `vocabulary`, `sentence_structure`, `paragraph_structure`, `tone`, `rhetorical_devices`, `punctuation`, `openings_and_closings`, `humor`, `signatures`
- [ ] **Given** the `vocabulary` category **When** examined **Then** it contains: `complexity` (low/medium/high), `favorites` (string[]), `avoided` (string[]), `jargon` (string[]), `contractions` (frequency: never/rare/occasional/frequent/always)
- [ ] **Given** the `sentence_structure` category **When** examined **Then** it contains: `avg_length` (short/medium/long), `complexity` (simple/compound/complex/varied), `fragments` (frequency), `parallelism` (frequency)
- [ ] **Given** the `paragraph_structure` category **When** examined **Then** it contains: `avg_length` (short/medium/long), `transition_style` (string)
- [ ] **Given** the `tone` category **When** examined **Then** it contains: `primary` (string), `secondary` (string), `formality` (0-100), `warmth` (0-100)
- [ ] **Given** the `rhetorical_devices` category **When** examined **Then** it contains: `metaphors` (frequency), `analogies` (frequency), `repetition` (frequency), `rhetorical_questions` (frequency), `storytelling` (frequency)
- [ ] **Given** the `punctuation` category **When** examined **Then** it contains: `em_dashes` (frequency), `semicolons` (frequency), `exclamations` (frequency), `ellipses` (frequency), `parentheticals` (frequency)
- [ ] **Given** the `openings_and_closings` category **When** examined **Then** it contains: `opening_patterns` (string[]), `hook_style` (string), `closing_patterns` (string[]), `cta_style` (string)
- [ ] **Given** the `humor` category **When** examined **Then** it contains: `frequency` (never/rare/occasional/frequent), `types` (string[]), `sarcasm_level` (0-100)
- [ ] **Given** the `signatures` category **When** examined **Then** it contains: `catchphrases` (string[]), `recurring_themes` (string[]), `unique_mannerisms` (string[])
- [ ] **Given** the DNA JSON **When** examined at the top level **Then** it also contains `prominence_scores`: a map of `{category_name: number}` (0-100 per category) used for the radar chart
- [ ] **Given** the schema **When** validated via Pydantic **Then** all fields have proper types, defaults, and validation
- [ ] **Given** the schema **When** validated via Zod **Then** the frontend TypeScript types match the backend schema exactly

**Scope Boundary:** Does NOT include the LLM analysis that populates the schema (US-017) or the UI display (US-020/US-021).

**Data/State Requirements:**
- DB model `VoiceDNAVersion`: `id` (nanoid), `clone_id` (FK), `version_number` (int), `dna_json` (JSON, the full DNA), `prominence_scores` (JSON, map of category → 0-100), `trigger_type` (enum: initial_analysis, regeneration, manual_edit, revert, sample_change), `llm_model` (str, nullable), `created_at`
- Backend Pydantic schema: `backend/app/schemas/dna.py`
- Frontend Zod schema: `frontend/src/types/dna.ts`

**Technical Notes:**
- The `frequency` type used throughout should be an enum: `never`, `rare`, `occasional`, `frequent`, `always`
- DNA JSON is stored as a JSON column in SQLite (via SQLAlchemy JSON type)
- Create migration for `voice_dna_versions` table

---

### US-017: Implement DNA analysis orchestration with LLM integration

**Epic:** 3 | **Priority:** Must | **Size:** L

> As Alex, I want to analyze my writing samples to extract my Voice DNA so that Sona can generate content that sounds like me.

**Acceptance Criteria:**

- [ ] **Given** a clone with samples **When** the user clicks "Analyze Voice DNA" **Then** ALL samples are sent to the selected LLM in a single request along with the Voice Cloning Instructions from methodology settings
- [ ] **Given** the analysis prompt **When** constructed **Then** it includes: all sample texts, the Voice Cloning Instructions content, instructions to produce structured JSON matching the DNA schema, instructions to assign prominence scores (0-100) per category
- [ ] **Given** the LLM returns a response **When** parsed **Then** the DNA JSON is validated against the schema and stored as a new VoiceDNAVersion with `trigger_type: "initial_analysis"` (or "regeneration" for re-analysis)
- [ ] **Given** analysis completes **When** the DNA is stored **Then** the version number increments and the clone's current DNA pointer is updated
- [ ] **Given** the analysis takes 10-30 seconds **When** in progress **Then** a loading indicator is shown on the clone detail page
- [ ] **Given** the analysis fails (LLM error) **When** the error is returned **Then** a toast appears: "Voice analysis failed. Please check your API key settings and try again." Clone retains previous DNA (or none if first analysis)
- [ ] **Given** the user clicks "Re-analyze Voice DNA" **When** a confirmation dialog appears **Then** it reads: "This will create a new DNA version using all current samples. Your previous DNA is preserved in version history."
- [ ] **Given** samples total exceeds 80% of the model's context window **When** analysis is initiated **Then** a warning is shown: "Your samples total ~X tokens. [Model] supports Y tokens. Some samples were excluded." Truncation prioritizes: (1) most recent samples, (2) content-type variety. Oldest and most-similar samples are excluded first. The warning banner lists excluded sample IDs/titles.
- [ ] **Given** the LLM returns invalid JSON **When** parsing fails **Then** the system retries once with an explicit instruction: "Respond only with valid JSON matching the schema." If the retry also fails, an error toast appears: "Voice analysis produced invalid results. Please try again."
- [ ] **Given** the LLM model used **When** DNA is stored **Then** the `llm_model` field records which model produced this version

**Scope Boundary:** Does NOT include the DNA display UI (US-020/US-021) or voice consistency scoring (US-018). This story covers the analysis orchestration and storage.

**Data/State Requirements:**
- Backend API: `POST /api/clones/:id/analyze` → triggers analysis, returns the new DNA version
- Uses `GET /api/methodology/voice_cloning` to get the analysis framework

**Technical Notes:**
- Backend service: `backend/app/services/dna_service.py` method `analyze_voice_dna(clone_id)`
- Prompt construction in `backend/app/llm/prompts.py` method `build_analysis_prompt(samples, methodology_content)`
- Use the default LLM provider from settings
- Parse LLM response as JSON — handle malformed JSON gracefully with retry or error
- Token counting via provider's `count_tokens()` method for context window check

---

### US-018: Add voice consistency scoring (LLM-driven confidence component)

**Epic:** 3 | **Priority:** Must | **Size:** M

> As Jordan, I want the voice consistency score to reflect how consistent the writing voice is across samples so that I can identify when samples may be from different authors.

**Acceptance Criteria:**

- [ ] **Given** DNA analysis runs **When** the LLM evaluates samples **Then** it also rates voice consistency 0-100 (how consistent the voice is across all samples)
- [ ] **Given** the consistency score is 0-100 **When** mapped to confidence points **Then** it maps linearly to 0-15 points (e.g., 100 → 15, 50 → 7.5 rounded to 8, 0 → 0)
- [ ] **Given** the consistency component updates **When** the total confidence score recalculates **Then** the overall confidence score includes the new consistency value
- [ ] **Given** low consistency (below 50) **When** recommendations are shown **Then** the recommendation says: "Your samples show inconsistent voice patterns. This may be intentional (different contexts) or may indicate samples from different authors."
- [ ] **Given** no DNA analysis has been run **When** the confidence score is shown **Then** the consistency component shows 0/15 with note "Run Voice DNA analysis to calculate"

**Scope Boundary:** Does NOT change the DNA analysis prompt structure (US-017 handles that). This story adds the consistency evaluation to the existing analysis flow and integrates it into confidence scoring.

**Technical Notes:**
- Add `voice_consistency_score` to the analysis prompt in `backend/app/llm/prompts.py`
- Store consistency score on the `VoiceDNAVersion` model (add field `consistency_score` int)
- After analysis completes, call `calculate_confidence()` to update the clone's confidence score with the new consistency component

---

### US-019: Implement DNA versioning with 10-version retention and revert

**Epic:** 3 | **Priority:** Must | **Size:** M

> As Jordan, I want to see the version history of a voice clone's DNA and revert to previous versions so that I can recover from bad re-analyses or manual edits.

**Acceptance Criteria:**

- [ ] **Given** a clone with DNA **When** a new analysis/edit/revert occurs **Then** a new version is created with: full DNA snapshot, incremented version number, trigger type, LLM model (if applicable), timestamp
- [ ] **Given** a clone has 10 DNA versions **When** an 11th is created **Then** the oldest version is automatically pruned
- [ ] **Given** the version history **When** displayed on the Voice DNA tab sidebar **Then** it shows: version number, timestamp, trigger type (initial_analysis, regeneration, manual_edit, revert), and a "Revert" button
- [ ] **Given** the user clicks "Revert" on version 3 **When** confirmed **Then** a NEW version (e.g., version 6) is created with version 3's DNA content, trigger type "revert" — no versions are deleted
- [ ] **Given** the version list **When** the user clicks a version **Then** they can view that version's DNA in a read-only preview

**Scope Boundary:** Does NOT include DNA diff view between versions. Just list + preview + revert.

**Data/State Requirements:**
- Backend API: `GET /api/clones/:id/dna/versions` → returns last 10 versions (summary)
- Backend API: `GET /api/clones/:id/dna/versions/:version_id` → returns full DNA for one version
- Backend API: `POST /api/clones/:id/dna/revert/:version_id` → creates new version from specified version

**Technical Notes:**
- Pruning logic in `backend/app/services/dna_service.py`: after creating a new version, delete all versions beyond the 10 most recent
- Frontend component: `frontend/src/components/clones/DNAVersionHistory.tsx`

---

### US-020: Build interactive Voice DNA radar chart visualization

**Epic:** 3 | **Priority:** Should | **Size:** M

> As Alex, I want to see a visual radar chart of my voice profile so that I can quickly understand my writing style's strengths and characteristics.

**Acceptance Criteria:**

- [ ] **Given** a clone has DNA with prominence scores **When** the Voice DNA tab is viewed **Then** a radar chart is displayed with 9 axes: Vocabulary, Sentence Structure, Paragraph Structure, Tone, Rhetorical Devices, Punctuation, Openings/Closings, Humor, Signatures
- [ ] **Given** each axis **When** scored **Then** values come from `prominence_scores` in the DNA (0-100 per category)
- [ ] **Given** the radar chart **When** the user hovers over an axis **Then** a tooltip shows key details (e.g., hovering "Humor" shows "Frequency: moderate, Types: dry wit, sarcasm")
- [ ] **Given** the clone list page **When** a clone card is displayed **Then** a small, non-interactive thumbnail version of the radar chart is shown
- [ ] **Given** the chart **When** rendered **Then** it is color-coded by clone (the clone's assigned color — useful for comparison view in US-041)
- [ ] **Given** no DNA exists **When** the chart area is viewed **Then** a placeholder message is shown: "Analyze Voice DNA to see the radar chart"

**Scope Boundary:** Does NOT include the comparison overlay view (US-041). This is the single-clone radar chart only.

**Technical Notes:**
- Use `Recharts` `RadarChart` component
- Frontend component: `frontend/src/components/clones/VoiceDNARadarChart.tsx`
- Thumbnail variant: smaller, no interactivity, no labels — just the shape
- Chart colors: use `chart-1` through `chart-5` CSS variables for consistency

---

### US-021: Implement DNA manual editing and recommendations engine

**Epic:** 3 | **Priority:** Must | **Size:** M

> As Jordan, I want to manually edit Voice DNA fields and see recommendations for improving a clone so that I can fine-tune a client's voice profile.

**Acceptance Criteria:**

- [ ] **Given** the Voice DNA tab shows DNA fields **When** the user clicks an editable field **Then** text fields become editable inputs, enum fields become dropdowns (no free-text entry), array fields become tag inputs, numeric fields (0-100) become sliders or number inputs
- [ ] **Given** a numeric DNA field (0-100) **When** the user enters a value outside range **Then** the value is clamped to 0-100 with an inline error: "Value must be between 0 and 100"
- [ ] **Given** an array DNA field (e.g., favorites, catchphrases) **When** the user adds items **Then** whitespace is trimmed, empty strings are rejected, and a maximum of 50 items is enforced. Attempting to add a 51st item shows: "Maximum 50 items allowed."
- [ ] **Given** the user edits one or more DNA fields **When** they click "Save Changes" **Then** a new DNA version is created with trigger type "manual_edit" and all changes applied
- [ ] **Given** no changes have been made **When** the save button is viewed **Then** it is disabled
- [ ] **Given** the confidence score breakdown panel **When** specific components are low **Then** recommendations appear:
  - Low word count (<15 pts): "Add more writing samples. You have X words; aim for 5,000+ for best results."
  - Low sample count (<16 pts): "Add more samples. Variety helps capture your voice more accurately."
  - Low content type variety (<15 pts): "You only have [types]. Try adding a [missing type] for more complete voice capture."
  - Low length mix (<10 pts): "All your samples are [category]. Add some [missing category] content for better analysis."
  - Low consistency (<8 pts): "Your samples show inconsistent voice patterns."

**Scope Boundary:** Does NOT include DNA analysis (US-017) or radar chart (US-020). This story covers manual editing and the recommendations display.

**UI/UX Notes:**
- DNA fields organized by category with collapsible sections
- Each category header shows the prominence score
- Edit mode: inline editing (not a separate edit page)

**Technical Notes:**
- Frontend component: `frontend/src/components/clones/VoiceDNAEditor.tsx`, `Recommendations.tsx`
- Backend API: `PUT /api/clones/:id/dna` with body `{dna_json}` → validates against schema, creates new version with trigger "manual_edit"
- Recommendations logic can be frontend-only (calculated from confidence breakdown)

---

## Epic 4: Content Generation Core

Maps to: PRD 4.4 (Content Generator), 4.6 (Platform Output Manager), I3 (Token Cost Estimator), I5 (Generation Presets), I10 (Quick Generate)

### US-022: Build content generator page (voice selector, input, properties form)

**Epic:** 4 | **Priority:** Must | **Size:** L

> As Alex, I want a content generation page where I select my voice, enter my ideas, and configure output settings so that I can generate voice-matched content.

**Acceptance Criteria:**

- [ ] **Given** the user navigates to `/create` **When** the page loads **Then** it shows: voice clone selector, text input area, generation properties form, and a disabled "Generate" button
- [ ] **Given** the voice clone selector **When** opened **Then** it shows a searchable dropdown with clone name + confidence score badge; clones with confidence <60 show a warning icon
- [ ] **Given** the user has previously selected a clone **When** they return to `/create` **Then** the most recently used clone is pre-selected
- [ ] **Given** no clone is selected **When** the Generate button is viewed **Then** it is disabled with tooltip: "Select a voice clone to continue"
- [ ] **Given** the input text area **When** viewed **Then** it has placeholder: "Enter your ideas, bullets, draft, or topic..."
- [ ] **Given** the input is empty **When** the Generate button is viewed **Then** it is disabled with tooltip: "Enter your content brief to continue"
- [ ] **Given** the properties form **When** viewed **Then** it contains:
  - Target platform(s): multi-select checkboxes (LinkedIn, Twitter/X, Facebook, Instagram, Email, Blog, Newsletter, SMS, Generic) — required, at least one
  - Length: radio buttons (Short, Medium, Long) + optional custom word count input
  - Tone override: slider 1-10, default "Inherit from DNA"
  - Humor override: slider 1-10, default "Inherit from DNA"
  - Formality override: slider 1-10, default "Inherit from DNA"
  - Target audience: text input (optional)
  - CTA style: dropdown (None, Soft, Direct, Urgent)
  - Include phrases: tag input (optional)
  - Exclude phrases: tag input (optional)
- [ ] **Given** a clone with confidence <60 is selected **When** the user views below the selector **Then** a warning appears: "This clone has low confidence. Results may not accurately match the target voice."

**Scope Boundary:** Does NOT include the actual generation call (US-023), review panel (US-024/US-025), or saving (US-026). This story builds the input form only.

**UI/UX Notes:**
- Route: `/create`
- Layout: two-column on desktop — left column: input + properties; right column: output/review (empty until generation)
- Use shadcn/ui components: Select (clone picker), Textarea (input), Checkbox (platforms), RadioGroup (length), Slider (overrides), Input (audience), Select (CTA), tag input pattern

**Technical Notes:**
- Frontend page: `frontend/src/pages/create/CreatePage.tsx`
- Frontend components: `frontend/src/components/content/VoiceSelector.tsx`, `GenerationProperties.tsx`
- Use React Hook Form + Zod for form validation
- Store last-used clone in Zustand store (`generator-store.ts`)
- Use TanStack Query for clone list in the selector

---

### US-023: Implement LLM content generation with prompt construction

**Epic:** 4 | **Priority:** Must | **Size:** L

> As Alex, I want to click Generate and receive content that matches my voice so that I can publish authentic content quickly.

**Acceptance Criteria:**

- [ ] **Given** valid form inputs (clone selected, input entered, at least one platform) **When** the user clicks "Generate" **Then** the backend generates one content version per selected platform
- [ ] **Given** a generation request **When** the prompt is constructed **Then** it combines: Voice DNA JSON of selected clone, Authenticity Guidelines from methodology, Platform Best Practices for the selected platform, user input text, all configured properties (length, tone/humor/formality overrides, audience, CTA, include/exclude phrases)
- [ ] **Given** multiple platforms are selected **When** generation runs **Then** all platform LLM calls run in parallel via `asyncio.gather()` with per-platform error handling. If one platform fails, the others continue. A progress indicator shows completed/total platforms (e.g., "3/5 platforms generated").
- [ ] **Given** one platform fails during multi-platform generation **When** results are displayed **Then** successful platforms show their content; the failed platform shows an individual error message with a per-platform "Retry" button (retries only that platform, not all)
- [ ] **Given** generation per platform **When** timing is measured **Then** target is <30 seconds per platform
- [ ] **Given** generation completes **When** results are returned **Then** each platform version includes: generated content text, word count, character count
- [ ] **Given** a generation takes longer than 60 seconds **When** the user is waiting **Then** a "Still working..." message appears (no timeout — let it complete)
- [ ] **Given** an LLM error (rate limit, auth, network) **When** generation fails **Then** an error panel appears: "Generation failed: [specific error]. Check your API key in Settings > Providers." with a Retry button
- [ ] **Given** no provider is configured **When** the user clicks Generate **Then** inline message: "No AI provider configured. [Go to Settings]"

**Scope Boundary:** Does NOT include authenticity scoring (Epic 5), the review/edit UI (US-025), or saving to library (US-026). This story covers the generation backend and basic result display.

**Data/State Requirements:**
- Backend API: `POST /api/content/generate` with body `{clone_id, input_text, platforms[], properties}` → returns `{results: [{platform, content, word_count, char_count}]}`
- Each platform result is generated independently (can be parallelized on backend)

**Technical Notes:**
- Backend service: `backend/app/services/content_service.py` method `generate_content()`
- Prompt construction: `backend/app/llm/prompts.py` method `build_generation_prompt(dna, methodology, platform_practices, input_text, properties)`
- Fetch methodology sections: Authenticity Guidelines + Platform Best Practices for the selected platform
- Use `asyncio.gather()` to parallelize multi-platform generation

---

### US-024: Build platform-specific output formatting with limit checking

**Epic:** 4 | **Priority:** Must | **Size:** M

> As Alex, I want to see platform-specific previews with character limit indicators so that I know my content fits each platform's constraints.

**Acceptance Criteria:**

- [ ] **Given** generated content for a platform **When** displayed in the review panel **Then** it shows: content text, word count, character count, platform limit indicator
- [ ] **Given** platform character limits **When** checked **Then** limits are enforced per PRD 4.6: Twitter 280, LinkedIn 3000, Facebook 63206, Instagram 2200, Blog no limit, Email no limit, Newsletter no limit, SMS 160, Generic no limit
- [ ] **Given** content under the platform limit **When** the indicator is shown **Then** it displays a green progress bar with character count
- [ ] **Given** content approaching the limit (>80%) **When** the indicator is shown **Then** it displays a yellow progress bar
- [ ] **Given** content over the limit **When** the indicator is shown **Then** it displays a red progress bar with the overage
- [ ] **Given** Twitter content exceeds 280 characters **When** the user clicks "Convert to thread?" **Then** content is split into numbered tweets using the following algorithm: split on sentence-ending punctuation (`.!?`), respect 280-character limit per tweet (including `1/N` numbering suffix), add `1/N` numbering to each tweet. If a single sentence exceeds 280 characters, split at the nearest word boundary before the limit.
- [ ] **Given** multiple platforms are generated **When** displayed **Then** each platform version appears in its own tab

**Scope Boundary:** Does NOT include pixel-perfect platform previews — v1 shows content with formatting hints and constraint checking only.

**UI/UX Notes:**
- Tab per platform in the review panel
- Character/word count display with progress bar
- Platform-specific formatting hints (e.g., hashtag highlighting for Twitter, section headers for blog)

**Technical Notes:**
- Frontend component: `frontend/src/components/content/PlatformPreview.tsx`
- Platform constants: `frontend/src/lib/platforms.ts` (character limits, formatting rules)
- Thread splitting: `frontend/src/lib/platforms.ts` utility function `splitIntoThread(content, limit)`

---

### US-025: Implement content editing (inline, full regen, feedback-driven, partial)

**Epic:** 4 | **Priority:** Must | **Size:** L

> As Alex, I want to edit and refine generated content in multiple ways so that I can get the output exactly right.

**Acceptance Criteria:**

- [ ] **Given** generated content in the review panel **When** the user types directly in the content area **Then** inline editing works — changes are tracked
- [ ] **Given** the "Regenerate" button **When** clicked **Then** the content is completely regenerated using the same inputs (new LLM call), creating a new version
- [ ] **Given** the feedback input area **When** the user enters feedback (e.g., "make it shorter", "more humor") and clicks "Regenerate with Feedback" **Then** the feedback + current content + DNA are sent to the LLM for targeted improvement; result replaces current content as a new version
- [ ] **Given** the user selects a portion of text **When** a floating "Regenerate Selection" button appears above the selection and is clicked **Then** only the selected portion is regenerated while surrounding text stays intact. The LLM receives: selected text + 500 characters before + 500 characters after + Voice DNA. No right-click context menu in v1.
- [ ] **Given** any edit or regeneration **When** it completes **Then** a new content version is created for history tracking with the appropriate trigger type (inline_edit, regeneration, feedback_driven)
- [ ] **Given** partial regeneration **When** it completes **Then** a note is shown: "Partial regeneration is best-effort. Review the boundaries between regenerated and original text."

**Scope Boundary:** Does NOT include content saving (US-026) or version history UI (US-035).

**Technical Notes:**
- Backend API: `POST /api/content/regenerate` with body `{content_id, feedback?}` → full regeneration
- Backend API: `POST /api/content/regenerate-partial` with body `{content_id, selected_text, surrounding_context}` → partial regeneration
- Frontend: `frontend/src/components/content/ContentEditor.tsx`, `FeedbackInput.tsx`

---

### US-026: Implement content saving with version tracking

**Epic:** 4 | **Priority:** Must | **Size:** M

> As Alex, I want to save generated content to my library so that I can find and reuse it later.

**Acceptance Criteria:**

- [ ] **Given** generated content in the review panel **When** the user clicks "Save to Library" **Then** the content is saved with status "draft" and all metadata: clone reference, platform, user input, generation properties, word/char count, timestamps
- [ ] **Given** the "Save & Create Another" button **When** clicked **Then** content is saved and the form resets (keeping clone and property selections)
- [ ] **Given** the route `/create/:id` **When** loaded **Then** the Content Generator is pre-populated with the existing content record (clone, input, properties, generated content)
- [ ] **Given** editing existing content via `/create/:id` **When** "Save" is clicked **Then** the existing record is updated (new content version created)
- [ ] **Given** editing existing content via `/create/:id` **When** "Save as New" is clicked **Then** a separate copy is created in the library as a new draft
- [ ] **Given** a content record **When** saved **Then** the original first-generated content is stored immutably (never overwritten); only the current content field updates

**Scope Boundary:** Does NOT include the content library page (Epic 6) or full version history navigation (US-035).

**Data/State Requirements:**
- DB model `Content`: `id` (nanoid), `clone_id` (FK, nullable), `clone_name` (str, denormalized), `platform` (str), `content_current` (text), `content_original` (text, immutable after first save), `user_input` (text), `generation_properties` (JSON), `authenticity_score` (int, nullable), `authenticity_breakdown` (JSON, nullable), `status` (enum: draft, review, approved, published, archived), `topic` (str, nullable), `campaign` (str, nullable), `tags` (JSON array), `word_count` (int), `char_count` (int), `created_at`, `updated_at`
- DB model `ContentVersion`: `id` (nanoid), `content_id` (FK), `version_number` (int), `content_text` (text), `trigger_type` (enum: generation, inline_edit, regeneration, feedback_driven), `word_count` (int), `created_at`
- Backend API: `POST /api/content` → creates new content record + version 1
- Backend API: `PUT /api/content/:id` → updates content, creates new version
- Backend API: `GET /api/content/:id` → returns full content with metadata

**Technical Notes:**
- Backend: `backend/app/models/content.py`, `backend/app/schemas/content.py`, `backend/app/services/content_service.py`, `backend/app/api/content.py`
- `clone_name` is denormalized so it persists even if the clone is deleted

---

### US-027: Build generation presets CRUD and management UI

**Epic:** 4 | **Priority:** Should | **Size:** M

> As Jordan, I want to save my frequently used generation settings as presets so that I can quickly configure the generator for different clients.

**Acceptance Criteria:**

- [ ] **Given** the generation properties form **When** the user clicks "Save as Preset" **Then** a dialog prompts for a preset name and saves: target platform(s), length, tone/humor/formality overrides, target audience, CTA style, include/exclude phrases
- [ ] **Given** a preset does NOT store **When** saved **Then** it excludes: voice clone selection and input text
- [ ] **Given** presets exist **When** the user views the properties form **Then** a "Load Preset" dropdown appears at the top with all saved presets
- [ ] **Given** a preset is loaded **When** selected **Then** all property fields are filled with the preset values; the user can still adjust before generating
- [ ] **Given** the user navigates to `/settings/presets` **When** the page loads **Then** all presets are listed with: name, created date, platforms, and actions (Edit, Rename, Delete)
- [ ] **Given** a preset is deleted **When** confirmed **Then** it is permanently removed; existing content that used this preset is not affected

**Scope Boundary:** Does NOT include preset suggestions or auto-creation.

**Data/State Requirements:**
- DB model `GenerationPreset`: `id` (nanoid), `name` (str, required, unique), `properties` (JSON), `created_at`, `updated_at`
- Backend API: CRUD at `/api/presets`

**Technical Notes:**
- Backend: `backend/app/models/preset.py`, `backend/app/schemas/preset.py`, `backend/app/services/preset_service.py`, `backend/app/api/presets.py`
- Frontend page: `frontend/src/pages/settings/PresetsPage.tsx`
- Frontend component: `frontend/src/components/content/PresetSelector.tsx`

---

### US-028: Implement token cost estimator with per-operation estimates

**Epic:** 4 | **Priority:** Should | **Size:** M

> As Alex, I want to see estimated API costs before running AI operations so that I'm not surprised by my LLM bill.

**Acceptance Criteria:**

- [ ] **Given** the user is about to analyze Voice DNA **When** the Analyze button area is viewed **Then** an estimated cost is shown: "$0.03 estimated" with hover tooltip showing: input tokens, output tokens, per-token rates for the selected model
- [ ] **Given** the user is about to generate content **When** the Generate button area is viewed **Then** an estimated cost per platform version is shown
- [ ] **Given** the Settings > Providers page **When** viewed **Then** cumulative estimated spend per provider is shown (tracked locally, reset monthly)
- [ ] **Given** cost estimates **When** calculated **Then** they use a hardcoded pricing table in `backend/app/constants.py` mapping model → input/output per-token price
- [ ] **Given** any cost estimate **When** displayed **Then** a disclaimer is shown: "Estimates are approximate and may differ from actual provider billing"

**Scope Boundary:** Does NOT include actual API billing tracking — estimates only based on token counts and hardcoded pricing.

**Technical Notes:**
- Backend utility: token counting via provider's `count_tokens()` method
- Pricing table in `backend/app/constants.py`: `MODEL_PRICING` dict
- Frontend component: `frontend/src/components/shared/CostEstimate.tsx`
- Monthly spend tracking: Zustand store persisted to localStorage

---

### US-029: Build quick generate panel on clone detail page

**Epic:** 4 | **Priority:** Should | **Size:** M

> As Alex, I want to quickly generate content directly from a clone's detail page so that I don't have to navigate to the full generator for simple tasks.

**Acceptance Criteria:**

- [ ] **Given** the clone detail page header **When** the user clicks "Quick Generate" **Then** an inline generation panel appears (slide-out or expandable section)
- [ ] **Given** the quick generate panel **When** opened **Then** it shows: text input, platform selector, length selector, and "Generate" button — the current clone is automatically used
- [ ] **Given** properties in the panel **When** configured **Then** it inherits default generation properties (or the last-used preset if presets exist)
- [ ] **Given** content is generated **When** it appears inline **Then** it shows the content with authenticity score
- [ ] **Given** generated content in the panel **When** "Save to Library" is clicked **Then** the content is saved to the library
- [ ] **Given** generated content in the panel **When** "Open in Generator" is clicked **Then** the full Content Generator page opens with the content pre-loaded for further refinement
- [ ] **Given** no provider is configured **When** "Quick Generate" is clicked **Then** the provider-missing message is shown instead

**Scope Boundary:** This is a simplified version of the full generator — no feedback-driven regen, no partial regen, no variant generation.

**Technical Notes:**
- Frontend component: `frontend/src/components/clones/QuickGeneratePanel.tsx`
- Reuses the same backend `POST /api/content/generate` endpoint
- Uses the same `VoiceSelector` logic but pre-filled with the current clone

---

## Epic 5: Authenticity Scoring

Maps to: PRD 4.8 (Authenticity Scoring System), I6 (AI Detection Preview)

### US-030: Design and implement 8-dimension authenticity scoring service

**Epic:** 5 | **Priority:** Must | **Size:** L

> As a developer, I want an authenticity scoring service that evaluates generated content across 8 dimensions so that users get specific, actionable feedback on voice match quality.

**Acceptance Criteria:**

- [ ] **Given** generated content and a voice clone's DNA **When** scoring is triggered **Then** the LLM evaluates the content across 8 dimensions, each scored 0-100:
  1. Vocabulary Match (evaluates: word choice, complexity, jargon, contractions → DNA `vocabulary`)
  2. Sentence Flow (evaluates: length distribution, complexity variation, fragments → DNA `sentence_structure`)
  3. Structural Rhythm (evaluates: paragraph length, transitions, organization → DNA `paragraph_structure`)
  4. Tone Fidelity (evaluates: formality, warmth, primary/secondary tone → DNA `tone`)
  5. Rhetorical Fingerprint (evaluates: metaphors, analogies, repetition, questions, storytelling → DNA `rhetorical_devices`)
  6. Punctuation Signature (evaluates: em dashes, semicolons, exclamations, ellipses, parentheticals → DNA `punctuation`)
  7. Hook & Close (evaluates: opening patterns, hook style, closing/CTA → DNA `openings_and_closings`)
  8. Voice Personality (evaluates: humor frequency/type, catchphrases, themes, mannerisms → DNA `humor` + `signatures`)
- [ ] **Given** all 8 dimension scores **When** the overall score is calculated **Then** it is the unweighted average, rounded to the nearest integer
- [ ] **Given** the scoring prompt **When** constructed **Then** it includes: generated content, Voice DNA JSON, Authenticity Guidelines from methodology, instructions to score each dimension 0-100 with justifications
- [ ] **Given** a dimension scores below 70 **When** feedback is generated **Then** specific, actionable feedback is provided referencing concrete examples from the content (e.g., "The target voice uses em dashes frequently (avg. 2 per paragraph) but the generated content uses none.")
- [ ] **Given** the LLM returns scores **When** parsed **Then** results are validated and stored on the content record

**Scope Boundary:** Does NOT include the score display UI (US-031) or integration into the review panel (US-032).

**Data/State Requirements:**
- Authenticity score stored on `Content.authenticity_score` (int) and `Content.authenticity_breakdown` (JSON: `{dimensions: [{name, score, feedback}]}`)
- Backend API: `POST /api/content/:id/score` → triggers scoring, returns score + breakdown

**Technical Notes:**
- Backend service: `backend/app/services/scoring_service.py` method `score_authenticity(content_id)`
- Prompt: `backend/app/llm/prompts.py` method `build_scoring_prompt(content, dna, methodology)`
- Parse LLM response as structured JSON with dimension scores and feedback

---

### US-031: Build authenticity score display with dimension breakdown

**Epic:** 5 | **Priority:** Must | **Size:** M

> As Alex, I want to see my content's authenticity score with a detailed breakdown so that I know how well it matches my voice and where to improve.

**Acceptance Criteria:**

- [ ] **Given** a content piece with an authenticity score **When** displayed **Then** the overall score appears as a prominent badge: green (75+), yellow (50-74), red (<50)
- [ ] **Given** the dimension breakdown **When** displayed **Then** all 8 dimensions are shown as a list/grid with individual scores and color coding, sorted by score (lowest first)
- [ ] **Given** a dimension **When** expanded **Then** it shows the specific feedback from the LLM
- [ ] **Given** a score below 50 **When** displayed **Then** a banner appears: "This content scored low on authenticity. Consider regenerating with feedback or editing manually."
- [ ] **Given** specific low-scoring dimensions **When** viewed **Then** the feedback references concrete examples (e.g., "4 of 6 paragraphs start with 'The' — vary your openings")

**Scope Boundary:** Does NOT include the AI detection preview (US-033).

**UI/UX Notes:**
- Overall score: large badge with number and color
- Dimension list: compact cards or rows with score bar + expandable feedback
- Sorted lowest-first to surface most actionable items

**Technical Notes:**
- Frontend component: `frontend/src/components/content/AuthenticityScore.tsx`, `DimensionBreakdown.tsx`

---

### US-032: Integrate authenticity scoring into content review panel

**Epic:** 5 | **Priority:** Must | **Size:** M

> As Alex, I want the authenticity score to appear automatically in the content review panel after generation so that I can immediately see how well the content matches my voice.

**Acceptance Criteria:**

- [ ] **Given** content is generated **When** generation completes **Then** authenticity scoring runs automatically for the first generated platform only. The score appears in the review panel next to the content.
- [ ] **Given** multiple platforms are generated **When** the user switches to a non-scored platform tab **Then** scoring is triggered on-demand for that platform (with a "Scoring..." loading indicator). This avoids unnecessary LLM calls for platforms the user may not review.
- [ ] **Given** content is regenerated or edited **When** saved **Then** the authenticity score is recalculated for the new version
- [ ] **Given** the review panel **When** the score is displayed **Then** it shows: overall score badge + expandable 8-dimension breakdown (reusing US-031 components)
- [ ] **Given** a platform tab in the review panel **When** selected **Then** its specific authenticity score is shown (each platform version scored independently)

**Scope Boundary:** Does NOT include score comparison across versions or historical score tracking.

**Technical Notes:**
- After `POST /api/content/generate` returns, automatically call `POST /api/content/:id/score` for each generated piece
- Frontend: integrate `AuthenticityScore` component into the review panel alongside content

---

### US-033: Implement AI detection preview with flagged passages

**Epic:** 5 | **Priority:** Should | **Size:** M

> As Alex, I want to check if my generated content might be flagged as AI-written so that I can make it sound more natural before publishing.

**Acceptance Criteria:**

- [ ] **Given** the review panel **When** the user clicks "Check AI Detection" **Then** the LLM evaluates the content for common AI-detection signals
- [ ] **Given** the AI detection evaluation **When** it runs **Then** it checks for: repetitive sentence openers, overuse of transition words, lack of personal anecdotes, overly balanced paragraph lengths, hedging language, generic conclusions
- [ ] **Given** the results **When** displayed **Then** they show: overall risk level derived from flagged passage count (Low = 0-1 flagged passages, Medium = 2-3, High = 4+) with green/yellow/red color coding, specific flagged passages with explanations, suggested fixes
- [ ] **Given** a flagged passage **When** viewed **Then** it shows: highlighted text + reason (e.g., "3 consecutive paragraphs start with 'Furthermore' — AI detectors flag repetitive transitions") + suggested fix
- [ ] **Given** the feature **When** displayed **Then** a disclaimer is shown: "This checks for common AI-detection patterns. No tool can guarantee undetectability."
- [ ] **Given** the check **When** initiated **Then** the estimated cost is shown upfront before running
- [ ] **Given** the feature **When** considered **Then** it is entirely optional — users can skip it

**Scope Boundary:** This is advisory only — it does not modify the content.

**Data/State Requirements:**
- Backend API: `POST /api/content/:id/ai-detection` → returns `{risk_level, flagged_passages: [{text, reason, suggestion}]}`

**Technical Notes:**
- Backend service: `backend/app/services/scoring_service.py` method `check_ai_detection(content_id)`
- Separate LLM call from authenticity scoring
- Frontend component: `frontend/src/components/content/AIDetectionPreview.tsx`

---

## Epic 6: Content Library & Versioning

Maps to: PRD 4.5 (Content Library)

### US-034: Implement content storage model with 18 metadata fields

**Epic:** 6 | **Priority:** Must | **Size:** M

> As a developer, I want a robust content storage model so that all generated content is persisted with full metadata for filtering, search, and version tracking.

**Acceptance Criteria:**

- [ ] **Given** the Content model **When** reviewed **Then** it stores all 18 fields per PRD 4.5: content_current, content_original, clone_id, clone_name, platform, user_input, generation_properties, authenticity_score, authenticity_breakdown, status, topic, campaign, tags, word_count, char_count, created_at, updated_at (+ id)
- [ ] **Given** content_original **When** set on first save **Then** it is immutable — never modified after initial creation
- [ ] **Given** the status field **When** used **Then** it accepts: draft, review, approved, published, archived — transitions are flexible (any → any, not enforced)
- [ ] **Given** clone_name **When** stored **Then** it is denormalized from the voice clone (persists even if clone is deleted)
- [ ] **Given** the ContentVersion model **When** reviewed **Then** it stores: version_number, content_text, trigger_type (generation, inline_edit, regeneration, feedback_driven), word_count, created_at
- [ ] **Given** the database migration **When** run **Then** Content and ContentVersion tables are created with proper indexes on: clone_id, platform, status, created_at

**Scope Boundary:** This is the data layer only — no API endpoints or UI. Those are in subsequent stories.

**Technical Notes:**
- Backend: `backend/app/models/content.py` (if not already created in US-026 — may need to merge or extend)
- Migration: `backend/alembic/versions/` — create content + content_versions tables
- Indexes: on frequently filtered columns for query performance

---

### US-035: Implement content version management with restore capability

**Epic:** 6 | **Priority:** Must | **Size:** M

> As Alex, I want to see the version history of my content and restore previous versions so that I can recover earlier drafts.

**Acceptance Criteria:**

- [ ] **Given** content detail view **When** the user clicks "History" tab **Then** a list of versions is shown with: version number, timestamp, trigger type, word count delta (e.g., "+42 words" or "-15 words")
- [ ] **Given** a version in the list **When** clicked **Then** its content is shown in a read-only preview panel
- [ ] **Given** the "Restore this version" button **When** clicked **Then** a new version is created with the selected version's content (non-destructive — previous versions preserved)
- [ ] **Given** the version list **When** ordered **Then** newest versions appear first

**Scope Boundary:** Does NOT include diff view between versions — list + preview + restore is sufficient for v1.

**Data/State Requirements:**
- Backend API: `GET /api/content/:id/versions` → returns version list (summary)
- Backend API: `GET /api/content/:id/versions/:version_id` → returns full version content
- Backend API: `POST /api/content/:id/versions/:version_id/restore` → creates new version from selected

**Technical Notes:**
- Frontend component: `frontend/src/components/content/VersionHistory.tsx`
- Reuse similar pattern from DNA versioning (US-019)

---

### US-036: Build content library page with data table and virtual scrolling

**Epic:** 6 | **Priority:** Must | **Size:** L

> As Jordan, I want a content library page that shows all my generated content in a sortable, scannable table so that I can manage content across all my clients.

**Acceptance Criteria:**

- [ ] **Given** content exists **When** the user navigates to `/library` **Then** a data table shows all content sorted by newest first
- [ ] **Given** the data table **When** columns are displayed **Then** they include: content preview (truncated), voice clone name, platform, status badge, authenticity score, word count, created date, updated date
- [ ] **Given** 1000+ items **When** the table is rendered **Then** virtual scrolling is used for performance (no pagination lag)
- [ ] **Given** the table headers **When** clicked **Then** sorting toggles between: date (newest/oldest), authenticity score (high/low), status
- [ ] **Given** a content row **When** clicked **Then** the user navigates to a detail view or a slide-out panel showing full content, metadata, and actions
- [ ] **Given** a content detail view **When** the status badge is clicked **Then** a dropdown appears with all 5 statuses (draft, review, approved, published, archived). Selecting a status updates immediately. Transitions are unrestricted (any status → any status).
- [ ] **Given** no content exists **When** the library is viewed **Then** an empty state appears: "No content yet. Create your first piece in the Content Generator." with a link to `/create`
- [ ] **Given** the backend content list endpoint **When** queried **Then** it uses cursor-based pagination keyed on `(created_at, id)` with a default page size of 50. Response includes `next_cursor` field (null when no more results). Frontend uses virtual scroll for rendering + infinite scroll for fetching next pages.

**Scope Boundary:** Does NOT include filtering (US-037), search (US-038), or bulk actions (US-039).

**UI/UX Notes:**
- Route: `/library`
- Use `@tanstack/react-table` for the data table with `@tanstack/react-virtual` for virtual scrolling
- Content preview: first 100 characters + "..."
- Status badges: color-coded per status

**Technical Notes:**
- Frontend page: `frontend/src/pages/library/LibraryPage.tsx`
- Frontend component: `frontend/src/components/content/ContentTable.tsx`
- Backend API: `GET /api/content` → returns paginated content list with summary fields
- Use cursor-based or offset pagination on backend; virtual scrolling on frontend

---

### US-037: Implement library filtering (clone, platform, status, date, tags)

**Epic:** 6 | **Priority:** Must | **Size:** L

> As Jordan, I want to filter my content library by client, platform, status, date, and tags so that I can quickly find the content I need.

**Acceptance Criteria:**

- [ ] **Given** the library page **When** filter controls are displayed **Then** they include:
  - Voice clone: dropdown multi-select
  - Platform: checkboxes
  - Status: tabs across top (All, Draft, Review, Approved, Published, Archived)
  - Topic/Campaign: dropdown with autocomplete from existing values
  - Date range: date picker
  - Tags: tag selector with autocomplete from existing tags
- [ ] **Given** multiple filters are applied **When** results are shown **Then** all filters combine with AND logic
- [ ] **Given** filter state **When** set **Then** it is persisted in URL params (shareable/bookmarkable)
- [ ] **Given** filters return no results **When** the empty state is shown **Then** it reads: "No content matches your filters. Try broadening your search." with a "Clear filters" button

**Scope Boundary:** Does NOT include full-text search (US-038) or bulk actions (US-039).

**Data/State Requirements:**
- Backend API: `GET /api/content?clone_id=X&platform=Y&status=Z&date_from=A&date_to=B&tags=C` → filtered results

**Technical Notes:**
- Frontend: `frontend/src/components/content/LibraryFilters.tsx`
- URL params: use React Router `useSearchParams` for filter state
- Backend: build SQLAlchemy query dynamically based on filter params

---

### US-038: Implement full-text search across content

**Epic:** 6 | **Priority:** Must | **Size:** M

> As Jordan, I want to search my content library by keyword so that I can find specific content quickly.

**Acceptance Criteria:**

- [ ] **Given** the library page **When** the user types in the search input **Then** content is filtered by full-text keyword match across the content text
- [ ] **Given** search results **When** displayed **Then** matching keywords are contextually shown in the content preview
- [ ] **Given** search is combined with filters **When** applied **Then** search narrows the filtered results (AND logic)
- [ ] **Given** search with no results **When** displayed **Then** the empty state reads: "No content matches your search."

**Scope Boundary:** Uses SQLite's basic LIKE search for v1 — no full-text search engine needed.

**Data/State Requirements:**
- Backend API: `GET /api/content?q=keyword` → adds LIKE filter on content_current field

**Technical Notes:**
- SQLite LIKE query: `WHERE content_current LIKE '%keyword%'`
- Debounce search input on frontend (300ms)
- Keyboard shortcut `Cmd+F` focuses the search input (implemented in US-048)

---

### US-039: Implement bulk actions (status change, tag add, delete)

**Epic:** 6 | **Priority:** Must | **Size:** M

> As Jordan, I want to perform bulk actions on multiple content items so that I can efficiently manage large amounts of client content.

**Acceptance Criteria:**

- [ ] **Given** the content table **When** the user selects multiple rows via checkboxes **Then** a bulk action bar appears with: "Change Status", "Add Tags", "Delete"
- [ ] **Given** "Change Status" bulk action **When** selected **Then** a dropdown appears with all status options; selecting one updates all selected items
- [ ] **Given** "Add Tags" bulk action **When** selected **Then** a tag input appears; entered tags are added to all selected items (existing tags preserved)
- [ ] **Given** "Delete" bulk action **When** selected **Then** a confirmation dialog appears: "Delete N items? This cannot be undone." with Cancel/Delete buttons
- [ ] **Given** individual content delete **When** confirmed **Then** the confirmation reads: "Delete this content? This cannot be undone."
- [ ] **Given** bulk operations **When** completed **Then** a success toast shows the count: "Updated 5 items" or "Deleted 3 items"

**Scope Boundary:** Does NOT include bulk export (US-040).

**Data/State Requirements:**
- Backend API: `PATCH /api/content/bulk` with body `{ids[], action, value}` → bulk update
- Backend API: `DELETE /api/content/bulk` with body `{ids[]}` → bulk delete

**Technical Notes:**
- Frontend component: `frontend/src/components/content/BulkActionBar.tsx`
- Use `@tanstack/react-table` row selection feature

---

### US-040: Implement export functionality (copy, txt, PDF, multi-item)

**Epic:** 6 | **Priority:** Must | **Size:** M

> As Alex, I want to export my content in various formats so that I can use it outside of Sona.

**Acceptance Criteria:**

- [ ] **Given** a content detail view **When** the user clicks "Copy" **Then** the platform-formatted content is copied to clipboard with a success toast
- [ ] **Given** a content detail view **When** the user clicks "Export as Text" **Then** a .txt file is downloaded with the content
- [ ] **Given** a content detail view **When** the user clicks "Export as PDF" **Then** a PDF file is generated via jspdf and downloaded
- [ ] **Given** multiple items selected in the library **When** "Export" bulk action is selected **Then** options are: "Export as Text" (single .txt with separators) or "Export as PDF" (single PDF with page breaks)
- [ ] **Given** a multi-item export **When** generated **Then** each item includes a separator with: content title/clone name, platform, date

**Scope Boundary:** Does NOT include export to specific platforms (no direct publishing).

**Technical Notes:**
- Copy to clipboard: `navigator.clipboard.writeText()`
- PDF generation: `jspdf` library on the frontend
- Text file: create Blob and trigger download
- Frontend component: `frontend/src/components/content/ExportActions.tsx`

---

## Epic 7: Voice Merge System

Maps to: PRD 4.3 (Voice Clone Merger), I8 (Clone Comparison View)

### US-041: Build clone comparison view with overlaid radar charts

**Epic:** 7 | **Priority:** Should | **Size:** M

> As Jordan, I want to compare two voice clones side by side so that I can understand their differences before merging.

**Acceptance Criteria:**

- [ ] **Given** the clone list page **When** exactly 2 clones are selected via checkboxes **Then** a "Compare" button appears
- [ ] **Given** the comparison page at `/clones/compare?a=[id]&b=[id]` **When** loaded **Then** it shows two radar charts overlaid on the same axes with different colors per clone
- [ ] **Given** the overlaid charts **When** displayed **Then** clone names and a color legend appear at the top
- [ ] **Given** the comparison **When** displayed below the chart **Then** a dimension-by-dimension comparison table shows: dimension name, Clone A summary, Clone B summary, difference indicator ("Similar" ≤15 pts, "Different" 15-40 pts, "Very Different" 40+ pts)
- [ ] **Given** a clone without DNA **When** comparison is attempted **Then** a message appears: "Analyze [clone name]'s Voice DNA first to enable comparison."
- [ ] **Given** the URL **When** shared or bookmarked **Then** the comparison is reproducible (URL-based with query params)

**Scope Boundary:** Does NOT include the merge UI (US-042). This is viewing/comparison only.

**UI/UX Notes:**
- Route: `/clones/compare?a=[id]&b=[id]`
- Overlaid radar chart: two different-colored data series on the same RadarChart
- Difference indicators: badges with color coding

**Technical Notes:**
- Frontend page: `frontend/src/pages/clones/CompareClonePage.tsx`
- Reuse `VoiceDNARadarChart` component with multi-data-series support
- Backend: `GET /api/clones/:id` for each clone's DNA

---

### US-042: Build merge UI with source selection and per-element weight controls

**Epic:** 7 | **Priority:** Must | **Size:** L

> As Jordan, I want to select voice clones and adjust per-element weights so that I can create a custom blended voice for a client.

**Acceptance Criteria:**

- [ ] **Given** the user navigates to `/clones/merge` **When** the page loads **Then** it shows: a searchable multi-select for source clones, weight control panels, and a "Create Merged Clone" button
- [ ] **Given** the source clone selector **When** used **Then** it allows selecting 2-5 clones; clones without analyzed DNA are disabled with tooltip: "This clone hasn't been analyzed yet. Analyze it first."
- [ ] **Given** only 1 clone is selected **When** the merge button is viewed **Then** it is disabled: "Select at least 2 voice clones to merge"
- [ ] **Given** 2+ clones are selected **When** weight panels appear **Then** each selected clone shows sliders (0-100%) for each of the 9 mergeable elements: Vocabulary, Sentence Structure, Paragraph Structure, Tone, Rhetorical Devices, Punctuation, Openings/Closings, Humor, Personality/Signatures
- [ ] **Given** weight sliders **When** adjusted **Then** weights are relative (e.g., Clone A=60, Clone B=40 for vocabulary means 60/40 split)
- [ ] **Given** all weights at 0% for an element **When** merge runs **Then** equal distribution is used (treated as "no preference")
- [ ] **Given** the weight controls **When** viewed **Then** a live visual preview shows the weight distribution as a matrix
- [ ] **Given** the user enters a name for the merged clone **When** "Create Merged Clone" is clicked **Then** the merge process begins (US-043)
- [ ] **Given** each pair of selected clones **When** the merge page is shown **Then** a "Compare" button appears for each pair linking to the comparison view

**Scope Boundary:** Does NOT include the actual merge orchestration (US-043) or merged clone behavior (US-044).

**UI/UX Notes:**
- Route: `/clones/merge`
- Layout: source selection at top, weight matrix below, name input + merge button at bottom
- Weight sliders: horizontal, one per element per clone, grouped by element
- "Experimental" badge/label on the page

**Technical Notes:**
- Frontend page: `frontend/src/pages/clones/MergeClonePage.tsx`
- Frontend components: `frontend/src/components/merge/SourceSelector.tsx`, `WeightControls.tsx`, `WeightMatrix.tsx`
- Use React Hook Form for the merge configuration form

---

### US-043: Implement merge orchestration with LLM integration

**Epic:** 7 | **Priority:** Must | **Size:** L

> As a developer, I want the merge system to send source DNAs and weights to the LLM so that it produces a coherent blended Voice DNA.

**Acceptance Criteria:**

- [ ] **Given** 2-5 source clones with DNA and a weight matrix **When** merge is triggered **Then** all source DNA JSONs + the weight matrix are sent to the LLM with a merge prompt
- [ ] **Given** the merge prompt **When** constructed **Then** it instructs the LLM to: blend each DNA element according to the specified weights, produce a new VoiceDNA JSON matching the standard schema, assign new prominence scores reflecting the blended result
- [ ] **Given** the LLM returns merged DNA **When** parsed **Then** it is validated against the Voice DNA schema and displayed for user review before saving
- [ ] **Given** the user reviews the merged DNA **When** they click "Confirm" **Then** a new VoiceClone is created with: `type: "merged"`, the merged DNA as version 1, and source lineage recorded
- [ ] **Given** the merge fails (LLM error) **When** the error is returned **Then** a toast appears: "Voice merge failed. Please try again." No clone is created.
- [ ] **Given** the merged clone **When** created **Then** source lineage records: which clones were merged, with what per-element weights

**Scope Boundary:** Does NOT include the merge UI (US-042) or merged clone behavior (US-044).

**Data/State Requirements:**
- DB model `MergedCloneSource`: `id` (nanoid), `merged_clone_id` (FK), `source_clone_id` (FK), `weights` (JSON: map of element → weight), `created_at`
- Backend API: `POST /api/clones/merge` with body `{name, sources: [{clone_id, weights: {element: weight}}]}` → triggers merge, returns merged clone on confirm

**Technical Notes:**
- Backend service: `backend/app/services/dna_service.py` method `merge_voice_dna(sources, weights)`
- Prompt: `backend/app/llm/prompts.py` method `build_merge_prompt(source_dnas, weight_matrix)`
- Two-step flow: merge → preview → confirm (or cancel)

---

### US-044: Implement merged clone behavior and lineage tracking

**Epic:** 7 | **Priority:** Must | **Size:** M

> As Jordan, I want merged clones to work like regular clones but with visible lineage so that I can use them for content generation and understand their origin.

**Acceptance Criteria:**

- [ ] **Given** a merged clone **When** used for content generation **Then** it functions identically to original clones
- [ ] **Given** a merged clone **When** viewed on the clone list **Then** it shows a "Merged" badge
- [ ] **Given** a merged clone **When** viewed on the detail page **Then** source lineage is visible: which clones it was merged from, with what weights
- [ ] **Given** a merged clone **When** used as a source for another merge **Then** it works (merged clones can be further merged)
- [ ] **Given** a merged clone **When** the user tries to add writing samples **Then** the action is blocked (add sample button hidden) — samples come from source clones
- [ ] **Given** a merged clone's DNA **When** manually edited **Then** it creates a new version like any other clone
- [ ] **Given** a source clone is deleted **When** the merged clone's lineage is viewed **Then** it shows "[Deleted clone]" for the deleted source but retains its own DNA

**Scope Boundary:** Does NOT change how regular clones work. This story only defines merged clone-specific behavior.

**Technical Notes:**
- Frontend: conditional rendering in clone detail page based on `clone.type === "merged"`
- Lineage display: `frontend/src/components/clones/MergeLineage.tsx`
- Backend: `GET /api/clones/:id` includes `merge_sources` if type is "merged"

---

## Epic 8: Polish & Enhancements

Maps to: I4 (A/B Variants), I9 (Keyboard Shortcuts), I11 (Before/After View)

### US-045: Implement A/B content variants with comparison view

**Epic:** 8 | **Priority:** Should | **Size:** L

> As Alex, I want to generate multiple content variants so that I can pick the best one.

**Acceptance Criteria:**

- [ ] **Given** the content generator **When** the user clicks "Generate Variants" (next to the standard "Generate" button) **Then** 3 variations are generated per platform using the same inputs but with LLM temperature variation
- [ ] **Given** variants are generated **When** displayed **Then** they appear in a horizontal comparison view (side by side on wide screens, swipeable cards on narrow)
- [ ] **Given** each variant **When** displayed **Then** it shows: content text, word count, authenticity score
- [ ] **Given** the user selects a preferred variant **When** selected **Then** it becomes the primary content; unselected variants are discarded (not saved to library)
- [ ] **Given** variant generation **When** initiated **Then** the estimated cost (3× standard) is shown upfront: "Generating 3 variants will cost approximately $X"
- [ ] **Given** multiple platforms are selected **When** variants are generated **Then** variants are per-platform (not cross-platform — 3 variants per platform)

**Scope Boundary:** Does NOT include variant history or saving multiple variants.

**Technical Notes:**
- Backend: reuse `POST /api/content/generate` with a `variants: 3` parameter and varying temperature
- Frontend component: `frontend/src/components/content/VariantComparison.tsx`

---

### US-046: Implement before/after view toggle in content generator

**Epic:** 8 | **Priority:** Should | **Size:** S

> As Jordan, I want to see my original input alongside the generated content so that I can show clients the transformation.

**Acceptance Criteria:**

- [ ] **Given** the review panel toolbar **When** the user toggles "Show Input" **Then** a split view appears: original user input on the left (read-only), generated content on the right (editable)
- [ ] **Given** the toggle **When** off (default) **Then** only the output is shown
- [ ] **Given** the toggle state **When** changed **Then** it is persisted in localStorage
- [ ] **Given** the split view **When** displayed **Then** the input panel is clearly labeled "Your Input" and the output panel is labeled "Generated Content"

**Scope Boundary:** Simple toggle + split view only. No diff highlighting.

**Technical Notes:**
- Frontend component: `frontend/src/components/content/BeforeAfterView.tsx`
- Toggle state in Zustand `ui-store.ts` (persisted to localStorage)

---

### US-047: Implement global keyboard shortcuts (Cmd+K, Cmd+N)

**Epic:** 8 | **Priority:** Should | **Size:** M

> As Alex, I want global keyboard shortcuts so that I can navigate Sona quickly.

**Acceptance Criteria:**

- [ ] **Given** any page **When** the user presses `Cmd+K` **Then** a quick navigation dialog opens (search for clones, content, pages)
- [ ] **Given** the quick nav dialog **When** the user types **Then** results show: matching clone names, content titles, and page names
- [ ] **Given** a result is selected **When** Enter is pressed **Then** the user navigates to that item
- [ ] **Given** any page **When** the user presses `Cmd+N` **Then** the user navigates to `/clones/new` (new clone)
- [ ] **Given** shortcuts **When** used **Then** they do not conflict with browser defaults

**Scope Boundary:** Does NOT include context-specific shortcuts (US-048) or the help overlay (US-049).

**Technical Notes:**
- Use shadcn/ui Command component (cmdk) for the quick nav dialog
- Frontend: `frontend/src/components/shared/CommandPalette.tsx`
- Register keyboard listeners in a top-level component or hook

---

### US-048: Implement context-specific keyboard shortcuts

**Epic:** 8 | **Priority:** Should | **Size:** M

> As Alex, I want keyboard shortcuts in the content generator and library so that I can work faster.

**Acceptance Criteria:**

- [ ] **Given** the Content Generator page **When** `Cmd+Enter` is pressed **Then** content is generated
- [ ] **Given** the Content Generator page **When** `Cmd+Shift+Enter` is pressed **Then** variants are generated
- [ ] **Given** the Content Generator page **When** `Cmd+S` is pressed **Then** content is saved to library (browser default save prevented)
- [ ] **Given** the Content Library page **When** `Cmd+F` is pressed **Then** the search input is focused (browser default find prevented)
- [ ] **Given** the Content Library page **When** `Cmd+A` is pressed **Then** all visible items are selected (browser default select-all prevented)
- [ ] **Given** buttons that have shortcuts **When** hovered **Then** the shortcut is displayed in the tooltip (e.g., "Generate (⌘+Enter)")

**Scope Boundary:** Shortcuts are not customizable in v1.

**Technical Notes:**
- Frontend: hook `useKeyboardShortcut(key, modifier, callback)` or use existing library
- Register per-page shortcuts in the page components
- Add tooltip hints to Button components

---

### US-049: Build keyboard shortcut help overlay

**Epic:** 8 | **Priority:** Should | **Size:** S

> As Alex, I want to see all available keyboard shortcuts in a help overlay so that I can learn and remember them.

**Acceptance Criteria:**

- [ ] **Given** any page **When** the user presses `?` **Then** a keyboard shortcut cheat sheet overlay appears
- [ ] **Given** the overlay **When** displayed **Then** it shows all shortcuts organized by context: Global, Content Generator, Content Library
- [ ] **Given** the overlay **When** the user presses `Escape` or clicks outside **Then** it closes
- [ ] **Given** the overlay **When** displayed **Then** each shortcut shows: key combination, description

**Scope Boundary:** Display-only — no shortcut customization.

**Technical Notes:**
- Frontend component: `frontend/src/components/shared/ShortcutHelp.tsx`
- Use shadcn/ui Dialog component
- Shortcut definitions in a single constant file for DRY display in both the overlay and button tooltips

---

## Epic 9: Innovation & Safety

New stories identified through gap analysis and competitive research. All "Should" priority.

### US-050: One-click content repurposing from library

**Epic:** 9 | **Priority:** Should | **Size:** S

> As Alex, I want to repurpose existing content for a different platform directly from my library so that I can maximize the value of content I've already created.

**Acceptance Criteria:**

- [ ] **Given** a content detail view in the library **When** the user clicks "Repurpose for..." **Then** a dropdown lists all platforms NOT yet generated for this content (based on the original input + clone)
- [ ] **Given** the user selects a platform from the repurpose dropdown **When** they confirm **Then** the app navigates to `/create` pre-populated with: the original user input, the same voice clone, and the newly selected platform
- [ ] **Given** the pre-populated content generator **When** the user clicks "Generate" **Then** the standard generation flow runs (reuses US-023 backend). The resulting content is a new content record linked to the same clone.
- [ ] **Given** content that was generated for all available platforms **When** the "Repurpose for..." dropdown is opened **Then** it shows "All platforms covered" (disabled state)

**Scope Boundary:** Does NOT create a new content record automatically — the user still clicks Generate. This is a navigation/pre-fill shortcut only.

**Data/State Requirements:**
- No new backend endpoints — uses existing generation flow
- Frontend reads the content's `platform` field and the global platform list to compute available platforms

**Technical Notes:**
- Frontend component: "Repurpose" dropdown in `frontend/src/components/content/ContentActions.tsx`
- Navigation: uses React Router `navigate()` with state to pre-fill the create page

---

### US-051: Real-time authenticity preview during editing

**Epic:** 9 | **Priority:** Should | **Size:** M

> As Alex, I want to see my authenticity score update in real-time as I edit content so that I can immediately see if my changes improve or hurt voice match.

**Acceptance Criteria:**

- [ ] **Given** the review panel toolbar **When** the user toggles "Live Score" (default: off) **Then** a debounced authenticity score refresh activates — the score recalculates 2 seconds after the user stops typing
- [ ] **Given** live scoring is active **When** the score refreshes **Then** a small "live score" badge appears next to the content showing the updated overall score with a delta indicator (e.g., "+3", "-5") compared to the previous score
- [ ] **Given** live scoring detects a dimension dropping below 70 **When** the score refreshes **Then** that dimension's label flashes briefly (CSS animation) to draw attention
- [ ] **Given** the "Live Score" toggle state **When** changed **Then** it is persisted in localStorage (default: off to avoid unnecessary API calls)
- [ ] **Given** live scoring is active **When** the score is recalculated **Then** it uses the same `POST /api/content/:id/score` endpoint as US-030 (full re-score, not partial)

**Scope Boundary:** Does NOT include partial scoring or dimension-specific re-scoring. Full re-score only. Does NOT auto-save edits — scoring runs on the in-memory content.

**Data/State Requirements:**
- No new backend endpoints — reuses existing scoring endpoint
- Frontend debounce timer in component state

**Technical Notes:**
- Frontend component: `frontend/src/components/content/LiveScoreBadge.tsx`
- Debounce: 2-second delay after last keystroke before triggering score API call
- Toggle state: Zustand `ui-store.ts` persisted to localStorage

---

### US-052: Sample gap heatmap visualization

**Epic:** 9 | **Priority:** Should | **Size:** S

> As Alex, I want to see a visual map of which content types and lengths I've provided samples for so that I know exactly what's missing.

**Acceptance Criteria:**

- [ ] **Given** the Samples tab on a clone detail page **When** displayed **Then** a visual grid (heatmap) appears above the sample list. Rows = content types (tweet, thread, LinkedIn post, blog post, article, email, newsletter, essay). Columns = length categories (short, medium, long).
- [ ] **Given** a cell in the heatmap **When** it has samples **Then** it is colored green and shows the sample count
- [ ] **Given** a cell in the heatmap **When** it has no samples **Then** it is colored gray/empty
- [ ] **Given** the heatmap **When** rendered below it **Then** auto-generated recommendation text appears based on empty cells (e.g., "Add a long blog post sample to improve voice capture for longer-form content"). This replaces/augments the text-only recommendations from US-021.
- [ ] **Given** the heatmap **When** implemented **Then** it uses a simple HTML `<table>` with Tailwind CSS classes — no chart library required

**Scope Boundary:** Does NOT include clickable cells or drag-and-drop. Display only.

**Data/State Requirements:**
- Uses existing `GET /api/clones/:id/samples` endpoint — frontend groups by content_type × length_category

**Technical Notes:**
- Frontend component: `frontend/src/components/samples/SampleGapHeatmap.tsx`
- Built with HTML table + Tailwind (bg-green-100/bg-muted for cells)

---

### US-053: Voice DNA export as portable prompt

**Epic:** 9 | **Priority:** Should | **Size:** S

> As Jordan, I want to export a voice clone's DNA as a human-readable prompt so that I can use it in other AI tools.

**Acceptance Criteria:**

- [ ] **Given** the Voice DNA tab **When** the user clicks "Export as Prompt" **Then** a human-readable text version of the Voice DNA is generated, formatted as AI instructions
- [ ] **Given** the exported prompt **When** generated **Then** it translates DNA fields to natural language (e.g., "Write with a professional, authoritative tone. Use complex vocabulary including industry jargon. Favor long sentences with compound-complex structures...")
- [ ] **Given** the exported prompt **When** generated **Then** it includes a header: `# Voice Profile: [Clone Name] — Generated by Sona`
- [ ] **Given** the exported prompt **When** displayed **Then** a "Copy to Clipboard" button copies the full text with a success toast
- [ ] **Given** the export **When** generated **Then** it does NOT include raw JSON — all fields are translated to natural language instructions

**Scope Boundary:** Does NOT include import of external prompts. Export only.

**Data/State Requirements:**
- No new backend endpoint — DNA-to-prompt translation runs on the frontend using the existing DNA JSON

**Technical Notes:**
- Frontend utility: `frontend/src/lib/dna-to-prompt.ts` — maps each DNA category to a natural language paragraph
- Frontend component: "Export as Prompt" button in `frontend/src/components/clones/VoiceDNAActions.tsx`

---

### US-054: Data transparency page

**Epic:** 9 | **Priority:** Should | **Size:** S

> As Alex, I want to understand what data Sona stores and sends to LLM providers so that I can trust the product with my writing.

**Acceptance Criteria:**

- [ ] **Given** the user navigates to `/settings/privacy` **When** the page loads **Then** a static page (no backend calls) displays data transparency information
- [ ] **Given** the transparency page **When** viewed **Then** it shows:
  - Header: "Your data stays on your machine"
  - Section "Stored locally": SQLite database, avatar images, .env API keys
  - Section "Sent to LLM providers": writing samples (during DNA analysis), generated content (during scoring), prompts (during generation)
  - Section "NOT sent anywhere": API keys are never sent to Sona servers, no analytics or telemetry, no data leaves your machine except to configured LLM providers
  - Links to each provider's data/privacy policy (OpenAI, Anthropic, Google)
- [ ] **Given** the Settings page **When** viewed **Then** "Privacy" appears as a tab alongside "Providers" and "Methodology"

**Scope Boundary:** Static informational page only — no data export, no data deletion tools. Those are separate stories (US-057).

**Technical Notes:**
- Frontend page: `frontend/src/pages/settings/PrivacyPage.tsx`
- No backend endpoint — all content is hardcoded in the component
- Add to Settings layout tabs

---

### US-055: Voice evolution timeline

**Epic:** 9 | **Priority:** Should | **Size:** M

> As Jordan, I want to see how a voice clone's DNA has changed over time so that I can track voice evolution across re-analyses and edits.

**Acceptance Criteria:**

- [ ] **Given** the Voice DNA tab **When** a clone has 2+ DNA versions **Then** a "Voice Evolution" section appears below the radar chart
- [ ] **Given** the evolution timeline **When** displayed **Then** it shows a vertical timeline of DNA version changes: version number, date, trigger type (initial_analysis, regeneration, manual_edit, revert, sample_change)
- [ ] **Given** each timeline entry **When** displayed **Then** it shows a mini diff summary: for each dimension whose prominence score changed by > 5 points compared to the previous version, show the change as a badge (e.g., "+12 Humor", "-8 Tone")
- [ ] **Given** a timeline entry **When** no dimensions changed by > 5 points **Then** it shows "Minor adjustments" instead of dimension badges
- [ ] **Given** the timeline **When** interacted with **Then** it is read-only (revert functionality remains in the version history sidebar from US-019)
- [ ] **Given** the timeline **When** implemented **Then** it uses a simple vertical timeline component built with Tailwind CSS — no chart library required

**Scope Boundary:** Does NOT include revert functionality (that's US-019). Display only.

**Data/State Requirements:**
- Uses existing `GET /api/clones/:id/dna/versions` endpoint — frontend computes diffs between consecutive versions

**Technical Notes:**
- Frontend component: `frontend/src/components/clones/VoiceEvolutionTimeline.tsx`
- Diff computation: compare `prominence_scores` between consecutive versions, filter to changes > 5 points

---

### US-056: Soft-delete for voice clones

**Epic:** 9 | **Priority:** Should | **Size:** S

> As Jordan, I want deleted clones to go to trash instead of being permanently removed so that I can recover from accidental deletions.

**Acceptance Criteria:**

- [ ] **Given** the user clicks "Delete" on a non-demo clone **When** confirmed **Then** the clone is soft-deleted: `deleted_at` timestamp is set. The clone is NOT permanently removed.
- [ ] **Given** a soft-deleted clone **When** any query fetches clones **Then** deleted clones are filtered out by default (WHERE deleted_at IS NULL)
- [ ] **Given** the clone list page **When** soft-deleted clones exist **Then** a collapsible "Trash" section appears at the bottom of the list showing deleted clones with a "days remaining" badge (e.g., "27 days left") indicating time until permanent deletion
- [ ] **Given** a clone in the trash **When** the user clicks "Restore" **Then** `deleted_at` is set to NULL and the clone reappears in the normal list
- [ ] **Given** a clone in the trash **When** the user clicks "Permanently Delete" **Then** a confirmation dialog appears: "This will permanently delete [name] and all its data. This cannot be undone." On confirm, the clone and all associated data (samples, DNA, content FKs) are hard-deleted per the original US-008 behavior.
- [ ] **Given** the backend starts **When** initialization runs **Then** clones with `deleted_at` older than 30 days are auto-purged (permanently deleted)
- [ ] **Given** a demo clone **When** delete is attempted **Then** the action is blocked — demo clones cannot be soft-deleted or hard-deleted

**Scope Boundary:** Does NOT include trash for content items (only clones). Does NOT include bulk restore.

**Data/State Requirements:**
- Add `deleted_at` (datetime, nullable) column to `VoiceClone` model
- Backend API: `DELETE /api/clones/:id` now sets `deleted_at` instead of hard-deleting
- Backend API: `POST /api/clones/:id/restore` → clears `deleted_at`
- Backend API: `DELETE /api/clones/:id/permanent` → hard-deletes (only available for soft-deleted clones)
- Backend API: `GET /api/clones?include_deleted=true` → includes soft-deleted clones (for trash display)

**Technical Notes:**
- Backend: add migration for `deleted_at` column
- Auto-purge: runs in FastAPI lifespan event on startup
- Frontend: `frontend/src/components/clones/TrashSection.tsx`

---

### US-057: One-click database backup and restore

**Epic:** 9 | **Priority:** Should | **Size:** S

> As Alex, I want to backup and restore my Sona database so that I don't lose my voice clones and content if something goes wrong.

**Acceptance Criteria:**

- [ ] **Given** the Settings page **When** the user clicks "Backup Database" **Then** a native file save dialog opens (via backend endpoint that streams the SQLite file). The file is named `sona-backup-{YYYY-MM-DD}.db`.
- [ ] **Given** the Settings page **When** a "Last backup" date exists **Then** it is displayed next to the Backup button (stored in localStorage)
- [ ] **Given** the Settings page **When** the user clicks "Restore from Backup" **Then** a file upload dialog opens accepting `.db` files, followed by a confirmation: "This will replace ALL current data with the backup. The app will restart. Are you sure?"
- [ ] **Given** the user confirms restore **When** the backup file is uploaded **Then** the backend stops DB connections, replaces the SQLite file, and triggers an app restart. On restart, all data from the backup is available.
- [ ] **Given** the Backup/Restore buttons **When** displayed **Then** they are at the top level of `/settings` (not nested under a tab)

**Scope Boundary:** Does NOT include scheduled/automatic backups. Manual only. Does NOT include backup validation or corruption detection.

**Data/State Requirements:**
- Backend API: `GET /api/backup` → streams the SQLite database file as a download
- Backend API: `POST /api/restore` (multipart) → accepts a `.db` file, replaces the current database, triggers restart
- Last backup date stored in localStorage

**Technical Notes:**
- Backend: `backend/app/api/backup.py`
- SQLite backup: use `shutil.copy2()` of the database file (ensure WAL is checkpointed first via `PRAGMA wal_checkpoint(TRUNCATE)`)
- Restore requires app restart — return a response instructing the frontend to reload after a delay

---

### US-058: Content import to library

**Epic:** 9 | **Priority:** Should | **Size:** M

> As Jordan, I want to import content I've written outside of Sona into my library so that I can track all my content in one place.

**Acceptance Criteria:**

- [ ] **Given** the content library page **When** the user clicks "Import Content" **Then** a dialog opens with: paste textarea OR file upload (.txt, .docx, .pdf — reuses parsing from US-010)
- [ ] **Given** the import dialog **When** text is entered/uploaded **Then** the user fills in metadata: platform (dropdown, required), status (dropdown, default "published"), topic (text, optional), campaign (text, optional), tags (tag input, optional)
- [ ] **Given** the import dialog **When** metadata is filled **Then** the user can optionally link to a voice clone (dropdown, optional — for organization only, not for scoring)
- [ ] **Given** an imported content record **When** saved **Then** it has: `content_current` = the imported text, `content_original` = same text, no `authenticity_score`, no `authenticity_breakdown`, no `generation_properties`, no content versions beyond version 1
- [ ] **Given** imported content **When** displayed in the library **Then** it shows an "Imported" badge (distinct from generated content)
- [ ] **Given** imported content **When** the user tries to score authenticity **Then** the action is blocked unless a voice clone is linked: "Link a voice clone to this content to enable authenticity scoring."

**Scope Boundary:** Does NOT include bulk import (one piece at a time). Does NOT include import from URLs (paste or file only).

**Data/State Requirements:**
- Add `is_imported` (bool, default false) to `Content` model (or derive from null `generation_properties`)
- Backend API: `POST /api/content/import` with body `{content_text, platform, status?, topic?, campaign?, tags?, clone_id?}` → creates content record
- Reuses file parsing from US-010 (`POST /api/clones/:id/samples/upload` endpoint logic extracted to shared service)

**Technical Notes:**
- Frontend component: `frontend/src/components/content/ImportContentDialog.tsx`
- Backend: extract file parsing from `sample_service.py` into shared `backend/app/services/file_parser.py` (if not already extracted)

---

## Won't-Have v1 (Explicit Exclusions)

These items are explicitly out of scope per PRD Section 9. Do NOT implement these in any story:

- User authentication / multi-tenancy
- Usage-based billing / payment integration
- Direct publishing to platforms (LinkedIn, Twitter API, etc.)
- Content scheduling / calendar
- Analytics / performance tracking
- Collaboration features (sharing, commenting, approval workflows)
- Mobile optimization (below 1024px)
- OCR for scanned PDFs
- Audio/video voice cloning
- Real-time co-editing
- Import/export of voice clones between installations
- Custom platform definitions (platform list is hardcoded)
- Prompt history / general undo system
- Internationalization (English-only)
- ~~Database backup/restore UI~~ → Now covered by US-057
- ~~Privacy dashboard~~ → Now covered by US-054 (data transparency page)
- Content brief templates
- Style drift detection
- Content calendar view

---

## PRD Coverage Matrix

Every PRD section and enhancement mapped to story IDs:

| PRD Section | Description | Story IDs |
|-------------|-------------|-----------|
| 4.1 | Voice Clone Methodology Settings | US-004, US-005 |
| 4.2 | Voice Clone Generator (CRUD) | US-008, US-009, US-010, US-011, US-014, US-015 |
| 4.2 | Voice Clone Generator (Confidence) | US-013, US-021 |
| 4.2 | Voice Clone Generator (DNA Analysis) | US-016, US-017, US-018, US-019, US-021 |
| 4.2 | Voice Clone Generator (DNA Versioning) | US-019 |
| 4.3 | Voice Clone Merger | US-042, US-043, US-044 |
| 4.4 | Content Generator | US-022, US-023, US-025, US-026 |
| 4.5 | Content Library | US-034, US-035, US-036, US-037, US-038, US-039, US-040 |
| 4.6 | Platform Output Manager | US-024, US-040 |
| 4.7 | LLM Provider Settings | US-001, US-002, US-003 |
| 4.8 | Authenticity Scoring System | US-030, US-031, US-032 |
| I1 | Demo Voice Clones | US-006 |
| I2 | Auto-detect Content Type | US-012 |
| I3 | Token Cost Estimator | US-028 |
| I4 | A/B Content Variants | US-045 |
| I5 | Generation Presets | US-027 |
| I6 | AI Detection Preview | US-033 |
| I7 | Voice DNA Radar Chart | US-020 |
| I8 | Clone Comparison View | US-041 |
| I9 | Keyboard Shortcuts | US-047, US-048, US-049 |
| I10 | Quick Generate from Clone | US-029 |
| I11 | Before/After View | US-046 |
| Flow 1 | Create a Voice Clone | US-008, US-009, US-010, US-011, US-013, US-017 |
| Flow 2 | Generate Content | US-022, US-023, US-024, US-025, US-026, US-030, US-032 |
| Flow 3 | Merge Voices | US-042, US-043, US-044 |
| Flow 4 | Manage Content Library | US-036, US-037, US-038, US-039, US-040 |
| Flow 5 | Configure Methodology | US-004, US-005 |
| Flow 6 | First-Run & Provider Setup | US-001, US-002, US-003, US-006, US-007 |
| Section 5 | Data Model | US-008, US-009, US-016, US-026, US-034, US-043 |
| Section 7 | Non-Functional (Performance) | US-023, US-036 |
| Section 7 | Non-Functional (Context Window) | US-017, US-028 |
| Section 7 | Non-Functional (Security) | US-001, US-002 |
| Section 9 | Out of Scope | Won't-Have section above |
| Innovation | Content repurposing | US-050 |
| Innovation | Live authenticity preview | US-051 |
| Innovation | Sample gap visualization | US-052 |
| Innovation | DNA export as prompt | US-053 |
| Innovation | Data transparency | US-054 |
| Innovation | Voice evolution timeline | US-055 |
| Innovation | Soft-delete clones | US-056 |
| Innovation | Database backup/restore | US-057 |
| Innovation | Content import | US-058 |

---

## Resolved Ambiguities

All ambiguities from the original gap analysis have been resolved inline in their respective stories:

| # | Ambiguity | Resolution | Story |
|---|-----------|------------|-------|
| 1 | Avatar resize mechanism | Pillow with LANCZOS resampling, WebP output format | US-008 |
| 2 | Clone selector "most recently used" | Zustand store (`generator-store.ts`) persisted to localStorage | US-022 |
| 3 | Thread splitting algorithm | Split on sentence-ending punctuation (`.!?`), 280-char limit, `1/N` numbering, word-boundary fallback | US-024 |
| 4 | Partial regeneration UX | Floating "Regenerate Selection" button appears on text highlight. No right-click menu in v1. | US-025 |
| 5 | Multi-platform parallelism | `asyncio.gather()` with per-platform error handling. Failed platforms get individual Retry buttons. | US-023 |
| 6 | Authenticity scoring timing | Auto-score only the first generated platform. Additional platforms scored on-demand when user switches tabs. | US-032 |
| 7 | Content library pagination | Cursor-based pagination keyed on `(created_at, id)`, default page size 50, `next_cursor` in response. | US-036 |

### Risks

1. **Voice DNA quality is the product.** If LLM analysis produces shallow profiles, nothing downstream works. Mitigated by editable methodology settings, but defaults must be excellent (US-005).

2. **LLM consistency varies.** Different models produce different DNA analyses. Mitigated by storing the model used per DNA version (US-017).

3. **PDF parsing unreliability.** Complex PDFs will extract poorly. Mitigated by preview step (US-010).

4. **URL scraping fragility.** JS-heavy sites will fail. Mitigated by clear error messages and paste fallback (US-011).

5. **Voice merging is experimental.** No established algorithm exists. Mitigated by "Experimental" label and user review before save (US-043).

6. **Context window limits.** Large sample collections may exceed model context windows. Mitigated by token counting and warnings (US-017), but truncation strategy needs careful implementation.

7. **Cost accumulation.** Power users (Jordan persona) running many operations per day could accumulate significant API costs. Mitigated by cost estimates (US-028), but users may still be surprised.
