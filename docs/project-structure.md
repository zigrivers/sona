# Sona — Project Structure

Canonical reference for file placement and directory organization. All agents and contributors follow this document when creating new files.

> **Related:** `docs/coding-standards.md` Section 1 for naming conventions and import ordering. `docs/plan.md` for architecture decisions.

---

## Table of Contents

1. [Complete Directory Tree](#1-complete-directory-tree)
2. [File Placement Rules](#2-file-placement-rules)
3. [Parallel Agent Conflict Mitigation](#3-parallel-agent-conflict-mitigation)
4. [Shared Code Rules](#4-shared-code-rules)
5. [Generated vs. Committed Files](#5-generated-vs-committed-files)

---

## 1. Complete Directory Tree

### Backend

Layer-based architecture. One file per domain per layer.

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app, lifespan, global exception handler
│   ├── config.py                   # pydantic-settings configuration
│   ├── constants.py                # Compile-time constants (platforms, thresholds, pricing)
│   ├── exceptions.py               # Domain exception classes (append-only)
│   ├── database.py                 # Engine, session factory, Base
│   ├── seed.py                     # Demo clones and default methodology content
│   ├── api/                        # Route handlers (thin — delegate to services)
│   │   ├── __init__.py
│   │   ├── router.py               # Single router composition entry point
│   │   ├── deps.py                 # Shared FastAPI dependencies (get_session, get_llm_provider)
│   │   ├── clones.py
│   │   ├── content.py
│   │   ├── samples.py
│   │   ├── methodology.py          # Methodology settings routes
│   │   └── providers.py            # LLM provider config routes
│   ├── models/                     # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── clone.py
│   │   ├── content.py
│   │   ├── dna.py                  # VoiceDNAVersion model
│   │   ├── sample.py
│   │   ├── methodology.py
│   │   └── preset.py               # GenerationPreset model
│   ├── schemas/                    # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── clone.py
│   │   ├── content.py
│   │   ├── dna.py
│   │   ├── sample.py
│   │   ├── methodology.py
│   │   ├── preset.py
│   │   ├── provider.py
│   │   └── scoring.py              # Authenticity scoring schemas
│   ├── services/                   # Business logic (testable, framework-agnostic)
│   │   ├── __init__.py
│   │   ├── clone_service.py
│   │   ├── content_service.py
│   │   ├── dna_service.py          # Voice DNA analysis orchestration
│   │   ├── sample_service.py
│   │   ├── methodology_service.py
│   │   ├── scoring_service.py      # Authenticity scoring
│   │   ├── preset_service.py
│   │   ├── provider_service.py     # Provider config management
│   │   ├── scraping_service.py     # URL scraping
│   │   └── file_parser.py          # .txt, .docx, .pdf extraction
│   └── llm/                        # LLM provider abstraction
│       ├── __init__.py
│       ├── base.py                 # LLMProvider protocol
│       ├── registry.py             # Provider factory (decouples services from imports)
│       ├── prompts.py              # Prompt templates (isolated for frequent iteration)
│       ├── openai.py
│       ├── anthropic.py
│       └── google.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py                 # Fixtures: test DB, async client, factories
│   ├── test_api/                   # Mirror of app/api/
│   │   ├── __init__.py
│   │   ├── test_clones.py
│   │   ├── test_content.py
│   │   ├── test_samples.py
│   │   ├── test_methodology.py
│   │   └── test_providers.py
│   ├── test_services/              # Mirror of app/services/
│   │   ├── __init__.py
│   │   ├── test_clone_service.py
│   │   ├── test_content_service.py
│   │   ├── test_dna_service.py
│   │   ├── test_sample_service.py
│   │   ├── test_methodology_service.py
│   │   ├── test_scoring_service.py
│   │   ├── test_preset_service.py
│   │   ├── test_provider_service.py
│   │   ├── test_scraping_service.py
│   │   └── test_file_parser.py
│   └── test_llm/                   # Mirror of app/llm/
│       ├── __init__.py
│       ├── test_openai.py
│       ├── test_anthropic.py
│       └── test_google.py
├── alembic/
│   ├── env.py
│   ├── script.py.mako              # Migration template with batch operations for SQLite
│   └── versions/                   # One migration file at a time (serialize via Beads deps)
├── alembic.ini
└── pyproject.toml                  # Tool config (ruff, pyright, pytest)
```

### Frontend

Feature folders under `components/`. Tests co-located with components.

```
frontend/
├── src/
│   ├── App.tsx                     # Route definitions (append-only route groups)
│   ├── main.tsx                    # React entry point
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (only barrel file allowed)
│   │   ├── layout/                 # AppLayout, Sidebar, Header
│   │   ├── shared/                 # Cross-feature reusable (2+ feature importers required)
│   │   ├── clones/                 # Voice clone feature components
│   │   ├── samples/                # Writing sample feature components
│   │   ├── content/                # Content generation + library components
│   │   ├── merge/                  # Voice merging components
│   │   └── settings/               # Provider config + methodology editor
│   ├── pages/                      # Route-level page components
│   │   ├── clones/
│   │   ├── create/
│   │   ├── library/
│   │   └── settings/
│   ├── hooks/                      # One file per domain
│   │   ├── use-clones.ts
│   │   ├── use-content.ts
│   │   ├── use-samples.ts
│   │   ├── use-methodology.ts
│   │   ├── use-providers.ts
│   │   └── use-presets.ts
│   ├── lib/                        # Pure functions, no React
│   │   ├── api.ts                  # HTTP client (fetch wrapper)
│   │   ├── query-keys.ts           # TanStack Query key factory (append-only)
│   │   ├── utils.ts                # Pure utility functions (split at 100+ lines)
│   │   └── platforms.ts            # Platform constants and formatting rules
│   ├── types/                      # Zod schemas + inferred types
│   │   ├── api.ts                  # API response types (organized by domain section)
│   │   ├── platforms.ts            # Platform type definitions
│   │   └── dna.ts                  # Voice DNA type definitions
│   ├── stores/                     # Zustand stores (client-only state)
│   │   ├── ui-store.ts             # UI preferences, toggles
│   │   └── generator-store.ts      # Content generator transient state
│   ├── test/                       # Shared test utilities
│   │   ├── setup.ts                # Vitest setup (jsdom, jest-dom matchers)
│   │   ├── render.tsx              # Custom render (QueryClient + Router)
│   │   ├── factories.ts            # Test data factories
│   │   ├── handlers.ts             # MSW handler composition (imports from handlers/)
│   │   └── handlers/               # Per-domain MSW handlers
│   │       ├── clones.ts
│   │       ├── content.ts
│   │       ├── samples.ts
│   │       ├── methodology.ts
│   │       └── providers.ts
│   └── styles/
│       └── globals.css             # Tailwind v4 entry point
├── e2e/                            # Playwright E2E tests
│   ├── pages/                      # Page objects
│   └── *.spec.ts                   # Test specs by flow name
├── index.html
├── vite.config.ts
├── eslint.config.mjs
├── tsconfig.json
├── tsconfig.node.json
├── .prettierrc
├── .prettierignore
└── package.json
```

### Root

```
sona/
├── backend/                        # Python FastAPI (see above)
├── frontend/                       # React + Vite (see above)
├── data/                           # SQLite DB + avatars at runtime (gitignored)
├── docs/
│   ├── plan.md                     # Product requirements
│   ├── tech-stack.md               # Technology choices
│   ├── coding-standards.md         # Code quality standards
│   ├── tdd-standards.md            # Test-driven development standards
│   ├── git-workflow.md             # Branching, commits, PRs
│   └── project-structure.md        # This file
├── scripts/
│   └── setup-agent-worktree.sh     # Worktree setup for parallel agents
├── tasks/
│   └── lessons.md                  # Patterns learned from past mistakes
├── .editorconfig
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── Makefile
└── Procfile
```

---

## 2. File Placement Rules

### Backend

| File Type | Location | Naming Convention | Example |
|-----------|----------|-------------------|---------|
| FastAPI app entry | `app/main.py` | — | `main.py` |
| App config | `app/config.py` | — | `config.py` |
| Constants | `app/constants.py` | — | `constants.py` |
| Domain exceptions | `app/exceptions.py` | — | `exceptions.py` |
| Database setup | `app/database.py` | — | `database.py` |
| Seed data | `app/seed.py` | — | `seed.py` |
| Router composition | `app/api/router.py` | — | `router.py` |
| Shared dependencies | `app/api/deps.py` | — | `deps.py` |
| Route handler | `app/api/{domain}.py` | `snake_case.py` | `clones.py`, `methodology.py` |
| ORM model | `app/models/{domain}.py` | `snake_case.py` | `clone.py`, `dna.py` |
| Pydantic schema | `app/schemas/{domain}.py` | `snake_case.py` | `clone.py`, `scoring.py` |
| Service | `app/services/{domain}_service.py` | `{domain}_service.py` | `clone_service.py` |
| Service (utility) | `app/services/{name}.py` | `snake_case.py` | `file_parser.py`, `scraping_service.py` |
| LLM provider | `app/llm/{provider}.py` | `snake_case.py` | `openai.py`, `anthropic.py` |
| LLM base protocol | `app/llm/base.py` | — | `base.py` |
| Provider registry | `app/llm/registry.py` | — | `registry.py` |
| Prompt templates | `app/llm/prompts.py` | — | `prompts.py` |
| API test | `tests/test_api/test_{domain}.py` | `test_{domain}.py` | `test_clones.py` |
| Service test | `tests/test_services/test_{domain}_service.py` | `test_{domain}_service.py` | `test_clone_service.py` |
| LLM test | `tests/test_llm/test_{provider}.py` | `test_{provider}.py` | `test_openai.py` |
| Test fixtures | `tests/conftest.py` | — | `conftest.py` |
| Migration | `alembic/versions/{timestamp}_{description}.py` | `YYYYMMDD_HHMM_{desc}.py` | `20260208_1430_add_writing_samples_table.py` |

### Frontend

| File Type | Location | Naming Convention | Example |
|-----------|----------|-------------------|---------|
| Route definitions | `src/App.tsx` | — | `App.tsx` |
| React entry | `src/main.tsx` | — | `main.tsx` |
| shadcn/ui primitive | `src/components/ui/{name}.tsx` | `kebab-case.tsx` | `button.tsx`, `input.tsx` |
| Layout component | `src/components/layout/{Name}.tsx` | `PascalCase.tsx` | `AppLayout.tsx`, `Sidebar.tsx` |
| Shared component | `src/components/shared/{Name}.tsx` | `PascalCase.tsx` | `LoadingSkeleton.tsx` |
| Feature component | `src/components/{feature}/{Name}.tsx` | `PascalCase.tsx` | `components/clones/CloneCard.tsx` |
| Component test | Co-located: `{Name}.test.tsx` | `PascalCase.test.tsx` | `CloneCard.test.tsx` |
| Page component | `src/pages/{feature}/{Name}.tsx` | `PascalCase.tsx` | `pages/clones/CloneListPage.tsx` |
| Custom hook | `src/hooks/use-{domain}.ts` | `use-kebab-case.ts` | `use-clones.ts` |
| HTTP client | `src/lib/api.ts` | — | `api.ts` |
| Query keys | `src/lib/query-keys.ts` | — | `query-keys.ts` |
| Utilities | `src/lib/utils.ts` | — | `utils.ts` |
| Platform constants | `src/lib/platforms.ts` | — | `platforms.ts` |
| Zod schema / types | `src/types/{domain}.ts` | `kebab-case.ts` | `api.ts`, `dna.ts` |
| Zustand store | `src/stores/{name}-store.ts` | `kebab-case-store.ts` | `ui-store.ts` |
| Test setup | `src/test/setup.ts` | — | `setup.ts` |
| Test render helper | `src/test/render.tsx` | — | `render.tsx` |
| Test factories | `src/test/factories.ts` | — | `factories.ts` |
| MSW handler (entry) | `src/test/handlers.ts` | — | `handlers.ts` |
| MSW handler (domain) | `src/test/handlers/{domain}.ts` | `kebab-case.ts` | `handlers/clones.ts` |
| Styles entry | `src/styles/globals.css` | — | `globals.css` |
| E2E test | `e2e/{flow-name}.spec.ts` | `kebab-case.spec.ts` | `clone-creation.spec.ts` |
| E2E page object | `e2e/pages/{Name}Page.ts` | `PascalCase.ts` | `CloneListPage.ts` |

---

## 3. Parallel Agent Conflict Mitigation

When up to 10 agents work in parallel, certain files are high-contention. These rules minimize merge conflicts:

### High-Contention Files

#### `backend/app/main.py`
- Registers ONE global exception handler for `SonaError` — never changes per feature
- Exception handler uses `SonaError.status_code` attribute on the exception class
- Each `SonaError` subclass defines its own `status_code` — no status map in main.py
- New features do NOT modify `main.py`; they add exception subclasses to `exceptions.py`

#### `backend/app/api/router.py`
- Append-only `include_router()` lines
- Each agent adds one line for their domain router
- Comment headers separate domain groups

```python
# router.py pattern
from fastapi import APIRouter

from app.api import clones, content, methodology, providers, samples

api_router = APIRouter(prefix="/api")

# --- Clones ---
api_router.include_router(clones.router)

# --- Content ---
api_router.include_router(content.router)

# --- Samples ---
api_router.include_router(samples.router)

# --- Methodology ---
api_router.include_router(methodology.router)

# --- Providers ---
api_router.include_router(providers.router)
```

#### `backend/app/exceptions.py`
- Append-only exception classes
- Each domain adds its exceptions at the end of the file
- Base `SonaError` class is defined once at the top

#### `backend/app/constants.py`
- Organized by section with comment headers
- Each agent appends to the relevant section or creates a new section

```python
# constants.py pattern

# --- Platforms ---
PLATFORMS = [...]

# --- Scoring ---
CONFIDENCE_THRESHOLD_READY = 80

# --- Pricing ---
MODEL_PRICING = {...}
```

#### `frontend/src/App.tsx`
- Append-only route groups with comment headers
- Each feature adds its routes in a clearly delimited block

```tsx
// App.tsx pattern
<Routes>
  {/* --- Clones --- */}
  <Route path="/clones" element={<ClonesPage />} />
  <Route path="/clones/:id" element={<CloneDetailPage />} />

  {/* --- Content --- */}
  <Route path="/create" element={<CreatePage />} />
  <Route path="/library" element={<LibraryPage />} />

  {/* --- Settings --- */}
  <Route path="/settings" element={<SettingsPage />} />
</Routes>
```

#### `frontend/src/lib/query-keys.ts`
- Append-only domain namespaces
- Each agent adds their domain's key factory at the end

#### `frontend/src/test/handlers.ts`
- Composes per-domain handler files from `test/handlers/`
- Each agent creates their own `handlers/{domain}.ts` file
- The main `handlers.ts` just imports and spreads them

```typescript
// handlers.ts pattern
import { cloneHandlers } from './handlers/clones';
import { contentHandlers } from './handlers/content';

export const handlers = [
  ...cloneHandlers,
  ...contentHandlers,
];
```

#### `frontend/src/types/api.ts`
- Organized by domain section with comment headers
- Split to per-domain files at 300+ lines (e.g., `types/clone.ts`, `types/content.ts`)
- Each agent adds types in their domain section

#### `backend/alembic/versions/`
- Serialize via Beads dependencies: only one migration in-flight at a time
- Use `bd dep add <migration-task> <previous-migration-task>` to enforce ordering

---

## 4. Shared Code Rules

### 2-Use Threshold
A component moves to `components/shared/` only when **2+ feature folders** import it. Until then, it lives in the feature folder that owns it.

### Shared Must Be Generic
Components in `shared/` must not contain feature-specific hooks, types, or business logic. They receive all data via props.

### Types Are Always Shared
All API types live in `src/types/`. No feature-local type definitions for API data.

### No Utils Catchall Growth
Split `lib/utils.ts` at **100+ lines** by category (e.g., `lib/format.ts`, `lib/date.ts`).

### Backend Shared Code
These files live in `app/` root because they are shared across all domains:
- `exceptions.py` — all domain exceptions
- `constants.py` — all compile-time constants
- `database.py` — engine and session factory
- `config.py` — settings and environment config

---

## 5. Generated vs. Committed Files

### Committed

- Source code (`.py`, `.ts`, `.tsx`, `.css`)
- Config files (`pyproject.toml`, `package.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.mjs`, `.prettierrc`, `.editorconfig`, `alembic.ini`)
- Migrations (`alembic/versions/`)
- Documentation (`docs/`, `CLAUDE.md`, `AGENTS.md`)
- Scripts (`scripts/`)
- Templates (`.env.example`)
- Build config (`Makefile`, `Procfile`)
- Lock files (`uv.lock`, `pnpm-lock.yaml`)
- Git config (`.gitignore`, `.gitattributes`)
- Scaffold markers (`__init__.py`, `.gitkeep`)

### Not Committed

| Path | Description |
|------|-------------|
| `node_modules/` | npm packages |
| `__pycache__/` | Python bytecode |
| `.venv/` | Python virtual environment |
| `data/` | SQLite DB + avatars (runtime data) |
| `.env` | Environment secrets |
| `frontend/dist/` | Frontend build output |
| `htmlcov/` | Coverage reports |
| `.ruff_cache/` | Ruff linter cache |
| `.pytest_cache/` | Pytest cache |
| `.mypy_cache/` | Mypy cache |
| `*.db`, `*.db-shm`, `*.db-wal` | SQLite files |
| `.DS_Store` | macOS metadata |

### .gitignore Verification

The `.gitignore` must cover:
- `data/` directory (with `!data/.gitkeep` exception)
- `frontend/dist/`
- All items in the "Not Committed" table above
