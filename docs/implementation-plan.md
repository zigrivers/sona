# Sona — Implementation Plan

Architecture patterns and implementation reference for the Sona build-out. This document defines **how** features are built — the Beads task graph defines **what** and **when**.

> **Companion docs:** [plan.md](plan.md) (PRD), [tech-stack.md](tech-stack.md) (libraries), [coding-standards.md](coding-standards.md) (code patterns), [tdd-standards.md](tdd-standards.md) (testing), [user-stories.md](user-stories.md) (acceptance criteria)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Browser (React 19 SPA)                                 │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ Pages   │ │Components│ │ Hooks    │ │ Stores     │  │
│  │ (routes)│ │ (UI)     │ │ (queries)│ │ (zustand)  │  │
│  └────┬────┘ └─────┬────┘ └────┬─────┘ └────────────┘  │
│       └─────────────┴──────────┘                        │
│                     │ fetch /api/*                       │
└─────────────────────┼───────────────────────────────────┘
                      │ Vite proxy (dev)
┌─────────────────────┼───────────────────────────────────┐
│  FastAPI Backend     │                                   │
│  ┌──────────────────┴──────────────────┐                │
│  │  api/ (route handlers + schemas)    │                │
│  │  ↓ Depends(get_session, get_llm)    │                │
│  │  services/ (business logic)         │                │
│  │  ↓                                  │                │
│  │  models/ (SQLAlchemy ORM)           │                │
│  │  ↓                                  │                │
│  │  SQLite (data/sona.db)              │                │
│  └──────────────────┬──────────────────┘                │
│                     │                                    │
│  ┌──────────────────┴──────────────────┐                │
│  │  llm/ (provider abstraction)        │                │
│  │  ├─ base.py (Protocol)              │                │
│  │  ├─ registry.py (factory)           │                │
│  │  ├─ openai.py / anthropic.py /      │                │
│  │  │  google.py (implementations)     │                │
│  │  └─ prompts.py (templates)          │                │
│  └─────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### Layer Rules

| Layer | Responsibility | Never Does |
|-------|---------------|------------|
| `api/` | Parse request → call service → return response | Business logic, direct DB queries |
| `schemas/` | Pydantic validation at API boundary | ORM mapping |
| `services/` | All business logic, orchestration | HTTP concerns, response formatting |
| `models/` | Column definitions, relationships, table config | Business logic |
| `llm/` | Provider abstraction, prompt construction | DB access, HTTP response handling |

### Key Design Decisions

- **No auth** — single-user local app per PRD
- **SQLite async** — `aiosqlite` via SQLAlchemy 2.0 async sessions
- **Full snapshot versioning** — DNA and content versions store complete snapshots (not diffs). Simpler code, instant revert, negligible storage for local app
- **LLM-driven merging** — qualitative style attributes can't be algorithmically averaged
- **Platform constants in code** — type-safe, no migration needed, each platform needs custom logic

---

## Key Patterns

### Backend: Domain Exception Hierarchy

All domain errors inherit from `SonaError`. The global exception handler in `main.py` maps error codes to HTTP status codes.

```python
# app/exceptions.py — append-only file
class SonaError(Exception):
    def __init__(self, detail: str, code: str) -> None:
        self.detail = detail
        self.code = code

class CloneNotFoundError(SonaError): ...
class SampleNotFoundError(SonaError): ...
class ProviderNotConfiguredError(SonaError): ...
class AnalysisFailedError(SonaError): ...
class LLMAuthError(SonaError): ...
class LLMRateLimitError(SonaError): ...
class LLMNetworkError(SonaError): ...
class LLMQuotaError(SonaError): ...
```

Status code mapping in the global handler:

```python
STATUS_MAP: dict[str, int] = {
    "CLONE_NOT_FOUND": 404,
    "SAMPLE_NOT_FOUND": 404,
    "CONTENT_NOT_FOUND": 404,
    "PROVIDER_NOT_CONFIGURED": 400,
    "ANALYSIS_FAILED": 502,
    "LLM_AUTH_ERROR": 401,
    "LLM_RATE_LIMIT": 429,
    "LLM_NETWORK_ERROR": 502,
    "LLM_QUOTA_ERROR": 402,
    "VALIDATION_ERROR": 422,
}
```

### Backend: Service Pattern

Every service receives an `AsyncSession` via constructor injection. Services are stateless — create per-request.

```python
class CloneService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, clone_id: str) -> VoiceClone:
        result = await self.session.execute(
            select(VoiceClone).where(VoiceClone.id == clone_id)
        )
        clone = result.scalar_one_or_none()
        if clone is None:
            raise CloneNotFoundError(clone_id)
        return clone
```

### Backend: Constants File

`app/constants.py` holds all magic numbers, thresholds, platform definitions, and model pricing:

```python
# Confidence score thresholds
CONFIDENCE_THRESHOLD_READY = 80
CONFIDENCE_THRESHOLD_USABLE = 60

# Confidence score component weights
CONFIDENCE_MAX_WORD_COUNT = 30
CONFIDENCE_MAX_SAMPLE_COUNT = 20
CONFIDENCE_MAX_TYPE_VARIETY = 20
CONFIDENCE_MAX_LENGTH_MIX = 15
CONFIDENCE_MAX_CONSISTENCY = 15

# Platform character limits
PLATFORMS: dict[str, dict] = {
    "twitter": {"char_limit": 280, "label": "Twitter/X"},
    "linkedin": {"char_limit": 3000, "label": "LinkedIn"},
    # ...
}

# Model pricing (per 1M tokens)
MODEL_PRICING: dict[str, dict] = {
    "gpt-4o": {"input": 2.50, "output": 10.00, "context_window": 128_000},
    "claude-sonnet-4-5-20250929": {"input": 3.00, "output": 15.00, "context_window": 200_000},
    # ...
}

# Version retention limits
MAX_DNA_VERSIONS = 10
MAX_METHODOLOGY_VERSIONS = 10
MAX_SAMPLE_WORDS = 50_000
```

### Frontend: TanStack Query for All Server State

```typescript
// lib/query-keys.ts — factory pattern
export const queryKeys = {
  clones: {
    all: ['clones'] as const,
    list: (filters?: CloneFilters) => [...queryKeys.clones.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.clones.all, 'detail', id] as const,
    dna: (id: string) => [...queryKeys.clones.all, 'dna', id] as const,
    samples: (id: string) => [...queryKeys.clones.all, 'samples', id] as const,
  },
  content: {
    all: ['content'] as const,
    list: (filters?: ContentFilters) => [...queryKeys.content.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.content.all, 'detail', id] as const,
    versions: (id: string) => [...queryKeys.content.all, 'versions', id] as const,
  },
  methodology: {
    all: ['methodology'] as const,
    section: (key: string) => [...queryKeys.methodology.all, key] as const,
    versions: (key: string) => [...queryKeys.methodology.all, 'versions', key] as const,
  },
  providers: {
    all: ['providers'] as const,
  },
  presets: {
    all: ['presets'] as const,
  },
} as const;
```

### Frontend: Zustand for Client-Only State

```typescript
// stores/ui-store.ts — persisted preferences
interface UiState {
  hideDemoClones: boolean;
  showInputPanel: boolean;  // before/after toggle
  sidebarCollapsed: boolean;
  // ... add fields as needed
}
```

### Frontend: API Client

```typescript
// lib/api.ts — typed fetch wrapper
class ApiClient {
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
  async post<T>(path: string, body?: unknown): Promise<T>;
  async put<T>(path: string, body?: unknown): Promise<T>;
  async delete(path: string): Promise<void>;
}

export const api = new ApiClient();
```

Handles JSON serialization, error extraction (`{ detail, code }` shape), and base URL.

### Frontend: Styling with cn()

```typescript
import { cn } from '@/lib/utils';

// Conditional classes
<div className={cn(
  'rounded-lg border p-4',
  isActive && 'border-primary bg-primary/5',
  isDisabled && 'opacity-50 pointer-events-none',
)} />
```

Only palette colors (`bg-primary`, `text-muted-foreground`) and scale spacing (`gap-2`, `p-4`). Never raw values.

---

## Shared Infrastructure

### LLM Provider Protocol

```python
# llm/base.py
from typing import Protocol, AsyncIterator

class LLMProvider(Protocol):
    async def complete(
        self, prompt: str, *, model: str | None = None,
        temperature: float = 0.7, max_tokens: int = 4096,
    ) -> str: ...

    async def stream(
        self, prompt: str, *, model: str | None = None,
        temperature: float = 0.7, max_tokens: int = 4096,
    ) -> AsyncIterator[str]: ...

    async def count_tokens(self, text: str, model: str | None = None) -> int: ...

    async def test_connection(self) -> bool: ...
```

### LLM Provider Registry

```python
# llm/registry.py
class ProviderRegistry:
    def get_provider(self, name: str) -> LLMProvider: ...
    def get_default_provider(self) -> LLMProvider: ...
    def list_configured(self) -> list[str]: ...
```

Reads from `Settings` (pydantic-settings). Instantiates providers lazily, caches per-request.

### Prompt Templates

`llm/prompts.py` contains all LLM prompt templates as string constants or functions:

- `build_dna_analysis_prompt(samples, methodology_instructions)` → analysis prompt
- `build_generation_prompt(dna, input_text, platform, properties, methodology)` → generation prompt
- `build_scoring_prompt(content, dna, methodology_guidelines)` → authenticity scoring prompt
- `build_merge_prompt(source_dnas, weight_matrix)` → merge prompt

### Frontend MSW Handlers

```typescript
// test/handlers/ — per-domain files
// test/handlers/clones.ts, content.ts, providers.ts, methodology.ts
// test/handlers.ts — composes all handlers + exports server
```

New domain handlers are added as files in `test/handlers/` and imported into the main `handlers.ts`. This is append-only — existing handlers never change when adding new domains.

### Router Composition

```python
# api/router.py — append-only
from fastapi import APIRouter
from app.api import clones, content, methodology, providers, samples

api_router = APIRouter(prefix="/api")
api_router.include_router(clones.router, tags=["clones"])
api_router.include_router(samples.router, tags=["samples"])
api_router.include_router(content.router, tags=["content"])
api_router.include_router(methodology.router, tags=["methodology"])
api_router.include_router(providers.router, tags=["providers"])
```

---

## Testing Strategy

### Test Pyramid

| Level | Tool | What | Coverage Target |
|-------|------|------|-----------------|
| Unit (service) | pytest-asyncio + in-memory SQLite | Business logic, scoring algorithms, validation | 90%+ |
| Integration (API) | httpx AsyncClient + test DB | Full request/response cycle | Key endpoints |
| Frontend unit | Vitest + RTL + MSW | Component behavior, hooks, stores | 90%+ |
| E2E | Playwright | Critical multi-page flows | 4-6 flows |

### Backend Test Infrastructure

- **In-memory SQLite** with `StaticPool` — fresh per test via transaction rollback
- **Factory fixtures** (`make_clone`, `make_sample`, etc.) in `conftest.py`
- **LLM always mocked** — `AsyncMock` for provider calls, never real API calls
- **pytest-httpx** for URL scraping tests

### Frontend Test Infrastructure

- **Custom `renderWithProviders`** — wraps with `QueryClientProvider` + `MemoryRouter`
- **MSW 2.x** — intercepts all API calls, `onUnhandledRequest: 'error'`
- **Test factories** (`buildClone`, `buildContent`, etc.) in `test/factories.ts`
- **Co-located tests** — `ComponentName.test.tsx` next to `ComponentName.tsx`

### E2E Coverage (Playwright)

| Flow | Pages |
|------|-------|
| Provider setup → first generation | Settings → Generator → Library |
| Clone creation → samples → DNA analysis | Clones → Clone detail |
| Content generation → review → save | Generator → Library |
| Library filtering and search | Library |

---

## LLM Integration

### Custom Protocol (Not LiteLLM)

Each provider implements the `LLMProvider` protocol directly using native SDKs. This gives full control over:
- Model lists and pricing info
- Connection testing
- Error type mapping
- Streaming behavior

### Error Handling & Retry

```python
# Retry logic (in each provider)
RETRYABLE_ERRORS = (LLMNetworkError, LLMRateLimitError)
MAX_RETRIES = 2
BACKOFF_DELAYS = [1.0, 3.0]  # seconds

# LLMAuthError, LLMQuotaError → fail immediately (no retry)
```

### Streaming

```python
# SSE via FastAPI StreamingResponse
async def _stream_generation(provider, prompt, ...):
    async for chunk in provider.stream(prompt, ...):
        yield f"data: {json.dumps({'text': chunk})}\n\n"
    yield "data: [DONE]\n\n"
```

### Prompt Construction

All prompts combine:
1. **System context** — methodology settings (voice cloning instructions, authenticity guidelines, platform practices)
2. **Data context** — Voice DNA JSON, writing samples, existing content
3. **User context** — input text, generation properties, feedback
4. **Output format** — structured JSON schema for analysis/scoring, plain text for generation

---

## Database

### Single Initial Migration

All models created in one Alembic migration (greenfield, interconnected FKs):

| Model | Table | Key Relationships |
|-------|-------|-------------------|
| `VoiceClone` | `voice_clones` | Has many samples, DNA versions, content |
| `WritingSample` | `writing_samples` | Belongs to clone |
| `VoiceDNAVersion` | `voice_dna_versions` | Belongs to clone |
| `Content` | `content` | Belongs to clone, has many versions |
| `ContentVersion` | `content_versions` | Belongs to content |
| `MergedCloneSource` | `merged_clone_sources` | Junction: clone ↔ source clone |
| `MethodologySettings` | `methodology_settings` | Has many versions |
| `MethodologyVersion` | `methodology_versions` | Belongs to settings |
| `GenerationPreset` | `generation_presets` | Referenced by content |

### Naming Convention

Enforced via SQLAlchemy `MetaData`:

```python
convention = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
```

### IDs

All entities use `nanoid` for primary keys. Format: 21-character URL-safe string.

### SQLite Considerations

- Use `batch_alter_table` for any ALTER TABLE in migrations
- `expire_on_commit=False` on session factory (prevents lazy-load failures in async)
- `selectinload` for collections, `joinedload` for single relations
- JSON columns stored as `Text` with Pydantic serialization/deserialization

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM output quality varies | DNA analysis and scoring unreliable | Editable methodology settings, prompt iteration, manual DNA editing |
| PDF parsing fragility | Garbled text from complex PDFs | Always show preview before adding, user can edit extracted text |
| URL scraping failures | Many sites block automated access | Clear error messages, copy/paste fallback |
| Voice merge unpredictability | Merged voices may not meet expectations | "Experimental" label, full review before save, manual DNA editing |
| Context window limits | Large sample sets exceed model limits | Token counting before analysis, truncation strategy, model upgrade suggestions |
| Provider API instability | Rate limits, outages | Retry with backoff, multiple provider support, clear error messages |

---

## Wave Execution Summary

| Wave | Focus | Tasks | Max Parallel Agents |
|------|-------|-------|---------------------|
| 0 | Shared infrastructure (models, schemas, LLM, layout, API client) | 12 | 4 |
| 1 | Core backend services (clone, content, DNA, methodology, providers) | 14 | 4-5 |
| 2 | Core frontend pages (settings, clones, content, library) | 12 | 3-4 |
| 3 | Integration features (DNA display, scoring display, merge, export) | 8 | 3 |
| 4 | Enhancements (auto-detect, cost estimator, presets, comparison) | 9 | 3 |
| 5 | Polish & innovation (A/B variants, shortcuts, timeline, soft-delete) | 11 | 3 |

**Append-only shared files** (serialize via Beads deps when touched):
- `backend/app/api/router.py`
- `backend/app/exceptions.py`
- `backend/app/constants.py`
- `frontend/src/App.tsx` (routes)
- `frontend/src/lib/query-keys.ts`
- `frontend/src/test/handlers.ts`
