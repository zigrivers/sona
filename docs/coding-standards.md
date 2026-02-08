# Sona — Coding Standards

Definitive code quality reference for the Sona project. Every AI agent and human contributor follows these standards. If a pattern isn't documented here, follow the conventions established in existing code.

> **Enforcement:** Most standards are mechanically enforced by tooling config files. See [Section 11: Tooling Quick Reference](#11-tooling-quick-reference) for where each rule lives.

---

## Table of Contents

1. [Project Structure & Organization](#1-project-structure--organization)
2. [Naming Conventions](#2-naming-conventions)
3. [Code Patterns & Conventions](#3-code-patterns--conventions)
4. [Type Safety & Data Validation](#4-type-safety--data-validation)
5. [Security Standards](#5-security-standards)
6. [Database & Data Access](#6-database--data-access)
7. [API Design](#7-api-design)
8. [Logging & Observability](#8-logging--observability)
9. [AI-Specific Coding Rules](#9-ai-specific-coding-rules)
10. [Code Review Checklist](#10-code-review-checklist)
11. [Tooling Quick Reference](#11-tooling-quick-reference)

---

## 1. Project Structure & Organization

### Directory Layout

```
sona/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, lifespan, global exception handlers
│   │   ├── config.py            # pydantic-settings configuration
│   │   ├── exceptions.py        # Domain exception classes
│   │   ├── database.py          # Engine, session factory, Base
│   │   ├── api/                 # Route handlers (thin — delegate to services)
│   │   │   ├── __init__.py
│   │   │   ├── clones.py
│   │   │   ├── content.py
│   │   │   ├── samples.py
│   │   │   ├── settings.py
│   │   │   └── providers.py
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── clone.py
│   │   │   ├── content.py
│   │   │   ├── sample.py
│   │   │   └── methodology.py
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── clone.py
│   │   │   ├── content.py
│   │   │   ├── sample.py
│   │   │   └── settings.py
│   │   ├── services/            # Business logic (testable, framework-agnostic)
│   │   │   ├── __init__.py
│   │   │   ├── clone_service.py
│   │   │   ├── content_service.py
│   │   │   ├── sample_service.py
│   │   │   └── methodology_service.py
│   │   ├── llm/                 # LLM provider abstraction
│   │   │   ├── __init__.py
│   │   │   ├── base.py          # LLMProvider protocol
│   │   │   ├── openai.py
│   │   │   ├── anthropic.py
│   │   │   └── google.py
│   │   └── seed.py              # Demo clones and default methodology content
│   ├── tests/
│   │   ├── conftest.py          # Fixtures: test DB, async client, factories
│   │   ├── test_api/
│   │   ├── test_services/
│   │   └── test_llm/
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   └── pyproject.toml           # Tool config (ruff, pyright, pytest)
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # shadcn/ui primitives (Button, Input, etc.)
│   │   │   └── ...              # App-specific components (CloneCard, DnaRadar, etc.)
│   │   ├── pages/               # Route-level page components
│   │   │   ├── clones/
│   │   │   ├── create/
│   │   │   ├── library/
│   │   │   └── settings/
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── use-clones.ts
│   │   │   ├── use-content.ts
│   │   │   └── ...
│   │   ├── lib/                 # Non-React utilities
│   │   │   ├── api.ts           # HTTP client (fetch wrapper)
│   │   │   ├── query-keys.ts    # TanStack Query key factory
│   │   │   └── utils.ts         # Pure utility functions
│   │   ├── types/               # TypeScript type definitions
│   │   │   ├── api.ts           # API response types (derived from Zod schemas)
│   │   │   └── ...
│   │   ├── stores/              # Zustand stores (client-only state)
│   │   │   └── ui-store.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/
│   │   ├── setup.ts             # Vitest setup, MSW handlers
│   │   └── ...
│   ├── index.html
│   ├── vite.config.ts
│   ├── eslint.config.mjs
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── .prettierrc
│   ├── .prettierignore
│   └── package.json
├── data/                        # SQLite DB + avatars (gitignored)
├── docs/
│   ├── plan.md
│   ├── tech-stack.md
│   ├── coding-standards.md      # This file
│   └── git-workflow.md
├── tasks/
│   └── lessons.md
├── .editorconfig
├── .env.example
├── .gitignore
├── Makefile
├── Procfile
└── CLAUDE.md
```

### Layer Architecture (Backend)

Requests flow through three layers:

```
HTTP Request → api/ (route handler) → services/ (business logic) → models/ (data access)
                 ↓                        ↓                            ↓
              schemas/               Domain types                 SQLAlchemy ORM
           (validation)            (typed objects)               (database I/O)
```

**Rules:**
- **Route handlers** (`api/`): Parse requests via Pydantic schemas, call services, return responses. No business logic here.
- **Services** (`services/`): All business logic. Accept and return typed objects (Pydantic models or domain types). Receive a database session via dependency injection.
- **Models** (`models/`): SQLAlchemy ORM definitions. No business logic — only column definitions, relationships, and table configuration.
- **Schemas** (`schemas/`): Pydantic models for API request/response validation. Separate from ORM models.

### File Naming Conventions

| Stack | Convention | Example |
|-------|-----------|---------|
| Python modules | `snake_case.py` | `clone_service.py`, `voice_dna.py` |
| Python test files | `test_*.py` | `test_clone_service.py` |
| React components | `PascalCase.tsx` | `CloneCard.tsx`, `DnaRadar.tsx` |
| React hooks | `use-kebab-case.ts` | `use-clones.ts`, `use-content.ts` |
| Non-component TS | `kebab-case.ts` | `query-keys.ts`, `api.ts` |
| Type definition files | `kebab-case.ts` | `api.ts` in `types/` |
| Test files (frontend) | `*.test.ts` / `*.test.tsx` | `CloneCard.test.tsx` |
| Zustand stores | `kebab-case.ts` | `ui-store.ts` |
| CSS / config | `kebab-case` | `.prettierrc`, `vite.config.ts` |

### Import Ordering

**Python** (enforced by `ruff` isort):
```python
# 1. Standard library
import asyncio
from datetime import datetime

# 2. Third-party packages
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

# 3. First-party (app)
from app.models.clone import VoiceClone
from app.schemas.clone import CloneCreate, CloneResponse
from app.services.clone_service import CloneService
```

**TypeScript** (enforced by `simple-import-sort`):
```typescript
// 1. External packages
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// 2. Internal aliases (@/*)
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/query-keys';

// 3. Relative imports
import { CloneCard } from './CloneCard';
```

### Barrel File Policy

- **Backend:** No barrel files. Always use explicit imports: `from app.models.clone import VoiceClone` — never `from app.models import VoiceClone`.
- **Frontend:** Limited `index.ts` re-exports in `components/ui/` only (shadcn/ui convention). All other directories use direct file imports.

---

## 2. Naming Conventions

### Python

| Element | Convention | Good | Bad |
|---------|-----------|------|-----|
| Variables | `snake_case` | `clone_name`, `word_count` | `cloneName`, `WordCount` |
| Functions | `snake_case` | `get_clone_by_id`, `analyze_dna` | `getCloneById`, `AnalyzeDNA` |
| Classes | `PascalCase` | `VoiceClone`, `CloneService` | `voice_clone`, `clone_service` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_SAMPLES`, `DEFAULT_MODEL` | `maxSamples`, `default_model` |
| Modules | `snake_case` | `clone_service.py` | `CloneService.py` |
| Private | `_leading_underscore` | `_parse_dna_json` | `parseDnaJsonPrivate` |
| Pydantic models | `PascalCase` + suffix | `CloneCreate`, `CloneResponse` | `CreateCloneSchema`, `CloneOut` |
| SQLAlchemy models | `PascalCase` (noun) | `VoiceClone`, `WritingSample` | `VoiceCloneModel`, `TblClone` |
| Enums | `PascalCase` class, `UPPER_SNAKE_CASE` members | `CloneType.ORIGINAL` | `clone_type.original` |

**Pydantic model suffixes:**
- `*Create` — request body for creating a resource
- `*Update` — request body for updating a resource
- `*Response` — response body for a single resource
- `*ListResponse` — response body for a list of resources

### TypeScript

| Element | Convention | Good | Bad |
|---------|-----------|------|-----|
| Variables | `camelCase` | `cloneName`, `wordCount` | `clone_name`, `WordCount` |
| Functions | `camelCase` | `getCloneById`, `analyzeDna` | `GetCloneById`, `get_clone` |
| React components | `PascalCase` | `CloneCard`, `DnaRadar` | `cloneCard`, `dna-radar` |
| Custom hooks | `camelCase` with `use` prefix | `useClones`, `useContent` | `UseClones`, `getClones` |
| Types / Interfaces | `PascalCase` | `Clone`, `ContentResponse` | `IClone`, `TContent` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `API_BASE_URL` | `maxFileSize`, `apiBaseUrl` |
| Zod schemas | `camelCase` + `Schema` suffix | `cloneCreateSchema`, `contentFilterSchema` | `CloneCreateSchema`, `createClone` |
| Query keys | factory object | `queryKeys.clones.list()` | `['clones', 'list']` |
| Zustand store hooks | `use*Store` | `useUiStore` | `uiStore`, `UIStore` |
| Enum-like objects | `UPPER_SNAKE_CASE` keys | `PLATFORMS.LINKEDIN` | `platforms.linkedin` |
| Props types | `PascalCase` + `Props` | `CloneCardProps` | `ICloneCardProps` |
| Event handlers | `on*` / `handle*` | `onSubmit`, `handleDelete` | `submitForm`, `doDelete` |

### Database

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | `plural_snake_case` | `voice_clones`, `writing_samples` |
| Column names | `snake_case` | `word_count`, `created_at` |
| Foreign keys | `referenced_table_singular_id` | `clone_id`, `content_id` |
| Junction tables | `table1_table2` | `merged_clone_sources` |
| Indexes | `ix_{table}_{column}` | `ix_writing_samples_clone_id` |
| Unique constraints | `uq_{table}_{column}` | `uq_voice_clones_name` |
| Check constraints | `ck_{table}_{column}` | `ck_content_status` |
| Primary keys | `pk_{table}` | `pk_voice_clones` |
| Foreign key constraints | `fk_{table}_{column}_{ref_table}` | `fk_writing_samples_clone_id_voice_clones` |

**Note:** Constraint naming is enforced via SQLAlchemy's `naming_convention` on `MetaData`:

```python
convention = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata = MetaData(naming_convention=convention)
Base = DeclarativeBase(metadata=metadata)
```

---

## 3. Code Patterns & Conventions

### 3a. Error Handling Strategy

**Backend — Domain Exceptions:**

Define domain exceptions in `app/exceptions.py`:

```python
class SonaError(Exception):
    """Base exception for all Sona domain errors."""

    def __init__(self, detail: str, code: str) -> None:
        self.detail = detail
        self.code = code
        super().__init__(detail)


class CloneNotFoundError(SonaError):
    def __init__(self, clone_id: str) -> None:
        super().__init__(
            detail=f"Voice clone '{clone_id}' not found",
            code="CLONE_NOT_FOUND",
        )


class ProviderNotConfiguredError(SonaError):
    def __init__(self) -> None:
        super().__init__(
            detail="No AI provider configured. Add an API key in Settings > Providers.",
            code="PROVIDER_NOT_CONFIGURED",
        )


class AnalysisFailedError(SonaError):
    def __init__(self, provider: str, reason: str) -> None:
        super().__init__(
            detail=f"Voice analysis failed via {provider}: {reason}",
            code="ANALYSIS_FAILED",
        )
```

Register global exception handlers in `app/main.py`:

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.exceptions import SonaError

app = FastAPI()

@app.exception_handler(SonaError)
async def sona_error_handler(request: Request, exc: SonaError) -> JSONResponse:
    status_map = {
        "CLONE_NOT_FOUND": 404,
        "PROVIDER_NOT_CONFIGURED": 400,
        "ANALYSIS_FAILED": 502,
    }
    status_code = status_map.get(exc.code, 400)
    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.detail, "code": exc.code},
    )
```

**Frontend — Error Handling:**

```typescript
// TanStack Query error handling in hooks
import { toast } from 'sonner';

export function useDeleteClone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/clones/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clones.all });
      toast.success('Clone deleted');
    },
    onError: (error: ApiError) => {
      toast.error(error.detail ?? 'Failed to delete clone');
    },
  });
}
```

**Rules:**
- Never catch and swallow errors silently
- Backend: Raise domain exceptions — let the global handler format the response
- Frontend: TanStack Query `onError` → toast notification for user-facing errors
- Use error boundaries for unexpected React crashes (wrap route-level components)
- Log unexpected errors server-side before returning 500

### 3b. Async Patterns

**Backend:**

```python
# CORRECT: async route handler + async service
@router.get("/clones/{clone_id}")
async def get_clone(
    clone_id: str,
    session: AsyncSession = Depends(get_session),
) -> CloneResponse:
    service = CloneService(session)
    clone = await service.get_by_id(clone_id)
    return CloneResponse.model_validate(clone)

# CORRECT: async service method with async DB
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

**What NEVER to do in async code:**

```python
# WRONG: sync HTTP in async context
import requests  # NEVER — use httpx
response = requests.get(url)

# WRONG: sync sleep in async context
import time
time.sleep(5)  # NEVER — use asyncio.sleep

# WRONG: sync DB call in async context
session.execute(query)  # NEVER — use await session.execute(query)

# CORRECT alternatives:
import httpx
async with httpx.AsyncClient() as client:
    response = await client.get(url)

await asyncio.sleep(5)
result = await session.execute(query)
```

For CPU-bound work (e.g., PDF parsing), use `run_in_threadpool`:

```python
from starlette.concurrency import run_in_threadpool

async def parse_pdf(file_bytes: bytes) -> str:
    return await run_in_threadpool(_sync_parse_pdf, file_bytes)

def _sync_parse_pdf(file_bytes: bytes) -> str:
    # pymupdf is sync — safe to call in thread pool
    doc = pymupdf.open(stream=file_bytes, filetype="pdf")
    return "\n".join(page.get_text() for page in doc)
```

**Frontend:**

```typescript
// CORRECT: TanStack Query handles async, loading, and error states
function ClonesPage() {
  const { data: clones, isLoading, error } = useClones();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <CloneGrid clones={clones} />;
}

// WRONG: manual useEffect + useState for data fetching
function ClonesPage() {
  const [clones, setClones] = useState([]);      // NEVER
  const [loading, setLoading] = useState(true);   // NEVER
  useEffect(() => {                               // NEVER
    fetch('/api/clones')
      .then((r) => r.json())
      .then(setClones)
      .finally(() => setLoading(false));
  }, []);
}
```

### 3c. State Management

**TanStack Query — All server state:**

```typescript
// lib/query-keys.ts — Query key factory
export const queryKeys = {
  clones: {
    all: ['clones'] as const,
    list: (filters?: CloneFilters) => [...queryKeys.clones.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.clones.all, 'detail', id] as const,
    dna: (id: string) => [...queryKeys.clones.all, 'dna', id] as const,
  },
  content: {
    all: ['content'] as const,
    list: (filters?: ContentFilters) => [...queryKeys.content.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.content.all, 'detail', id] as const,
  },
  methodology: {
    all: ['methodology'] as const,
    section: (key: string) => [...queryKeys.methodology.all, key] as const,
  },
} as const;

// hooks/use-clones.ts
export function useClones(filters?: CloneFilters) {
  return useQuery({
    queryKey: queryKeys.clones.list(filters),
    queryFn: () => api.get<CloneListResponse>('/api/clones', { params: filters }),
  });
}

export function useClone(id: string) {
  return useQuery({
    queryKey: queryKeys.clones.detail(id),
    queryFn: () => api.get<CloneResponse>(`/api/clones/${id}`),
  });
}
```

**Zustand — Client-only state:**

```typescript
// stores/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  hideDemoClones: boolean;
  toggleHideDemoClones: () => void;
  showInputPanel: boolean;
  toggleShowInputPanel: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hideDemoClones: false,
      toggleHideDemoClones: () => set((s) => ({ hideDemoClones: !s.hideDemoClones })),
      showInputPanel: false,
      toggleShowInputPanel: () => set((s) => ({ showInputPanel: !s.showInputPanel })),
    }),
    { name: 'sona-ui' }
  )
);
```

**Rules:**
- TanStack Query for ALL data from the API. Never duplicate server data in Zustand.
- Zustand for UI preferences, filter states, and client-only toggles. Use `persist` middleware for anything that should survive page refresh.
- Never store derived data — compute it inline or via `useMemo`.

**React Hook Form + Zod — All form state:**

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const cloneCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).default([]),
});

type CloneCreateInput = z.infer<typeof cloneCreateSchema>;

function CreateCloneForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CloneCreateInput>({
    resolver: zodResolver(cloneCreateSchema),
  });

  const createClone = useCreateClone();

  const onSubmit = (data: CloneCreateInput) => {
    createClone.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register('name')} />
      {errors.name && <p>{errors.name.message}</p>}
    </form>
  );
}
```

### 3d. API Response Format

**Single resource — return Pydantic model directly:**

```python
@router.get("/clones/{clone_id}")
async def get_clone(clone_id: str, ...) -> CloneResponse:
    clone = await service.get_by_id(clone_id)
    return CloneResponse.model_validate(clone)
```

FastAPI serializes the Pydantic model to JSON automatically. No envelope pattern.

**List endpoints — items + total:**

```python
class CloneListResponse(BaseModel):
    items: list[CloneResponse]
    total: int

@router.get("/clones")
async def list_clones(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    ...,
) -> CloneListResponse:
    clones, total = await service.list(offset=offset, limit=limit)
    return CloneListResponse(
        items=[CloneResponse.model_validate(c) for c in clones],
        total=total,
    )
```

**Error responses:**

```json
{
  "detail": "Voice clone 'abc123' not found",
  "code": "CLONE_NOT_FOUND"
}
```

All errors follow this shape. `detail` is human-readable, `code` is machine-readable.

---

## 4. Type Safety & Data Validation

### Backend (Python)

**Pyright strict mode** is configured in `backend/pyproject.toml`:

```toml
[tool.pyright]
typeCheckingMode = "strict"
```

**Rules:**
- Type hints on ALL function signatures (parameters and return types)
- Use `int | None`, not `Optional[int]` (modern union syntax)
- Pydantic models validate data at the API boundary
- Service methods accept and return typed objects — never raw `dict`
- Use `Sequence` for read-only collections, `list` for mutable ones

```python
# CORRECT: fully typed service method
async def get_clones_by_type(
    self,
    clone_type: CloneType,
    limit: int = 20,
) -> list[VoiceClone]:
    result = await self.session.execute(
        select(VoiceClone)
        .where(VoiceClone.type == clone_type)
        .limit(limit)
    )
    return list(result.scalars().all())

# WRONG: untyped, returns dict
async def get_clones_by_type(self, clone_type, limit=20):
    result = await self.session.execute(...)
    return [dict(row) for row in result]
```

### Frontend (TypeScript)

**Strict mode** is configured in `frontend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Rules:**
- No `any` — use `unknown` and narrow with type guards
- Derive types from Zod schemas via `z.infer<typeof schema>` when possible
- API response types live in `types/api.ts`
- Shared between query hooks and components via import

```typescript
// types/api.ts — derived from Zod schemas
import { z } from 'zod';

export const cloneSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: z.enum(['original', 'merged', 'demo']),
  confidence_score: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Clone = z.infer<typeof cloneSchema>;

export const cloneListResponseSchema = z.object({
  items: z.array(cloneSchema),
  total: z.number(),
});

export type CloneListResponse = z.infer<typeof cloneListResponseSchema>;
```

```typescript
// CORRECT: narrow unknown
function handleApiError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred';
}

// WRONG: use any
function handleApiError(error: any): string {
  return error.message;  // unsafe
}
```

### Validation Boundaries

| Boundary | Tool | What It Validates |
|----------|------|-------------------|
| API request body | Pydantic (backend) | Shape, types, required fields, value constraints |
| API query params | FastAPI `Query()`/`Path()` | Type, min/max, enum values |
| Form submission | Zod + React Hook Form (frontend) | Field presence, format, length, custom rules |
| API response (optional) | Zod (frontend) | Response shape matches expected contract |

Service layer code trusts validated input — no redundant validation inside services.

---

## 5. Security Standards

### API Key Management

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_ai_api_key: str = ""
    database_url: str = "sqlite+aiosqlite:///data/sona.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )
```

**Rules:**
- API keys in `.env` only, loaded via `pydantic-settings`
- `.env` is in `.gitignore` — never committed
- Never log API keys or include them in error responses
- The `/api/providers` endpoint returns masked keys only (last 4 characters)
- Keys are never sent to the browser after initial configuration

### Input Sanitization

| Stack | Tool | What It Handles |
|-------|------|----------------|
| Backend | Pydantic | Type coercion, string length limits, enum validation |
| Backend | SQLAlchemy ORM | SQL injection prevention (parameterized queries) |
| Frontend | Zod | Form validation, string constraints |
| Frontend | React | XSS prevention (default JSX escaping) |

**Rules:**
- Never use raw SQL strings — always use SQLAlchemy ORM queries
- Never use `dangerouslySetInnerHTML` without sanitization (exception: `react-markdown` which is safe by default)
- No auth needed — single-user local app per PRD

### Dependency Policy

Only add packages listed in `docs/tech-stack.md`. Adding a new dependency requires:

1. Update `docs/tech-stack.md` with the library, version, and rationale
2. Then add it to `pyproject.toml` or `package.json`

This prevents dependency creep and ensures every package is a deliberate choice.

---

## 6. Database & Data Access

### SQLAlchemy 2.0 Async Patterns

**Engine and session setup:**

```python
# app/database.py
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncSession
from sqlalchemy.orm import DeclarativeBase, MappedAsDataclass, Mapped, mapped_column

engine = create_async_engine(
    "sqlite+aiosqlite:///data/sona.db",
    echo=False,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

**Key setting:** `expire_on_commit=False` — prevents lazy loading after commit, which would fail in async context.

**Session lifecycle — one session per request:**

```python
# app/database.py
from collections.abc import AsyncGenerator
from fastapi import Depends

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

# Used in route handlers:
@router.get("/clones")
async def list_clones(session: AsyncSession = Depends(get_session)) -> ...:
    ...
```

### Relationship Loading (N+1 Prevention)

Always specify a loading strategy when defining or querying relationships:

```python
# In the model — specify default loading
class VoiceClone(Base):
    __tablename__ = "voice_clones"

    id: Mapped[str] = mapped_column(primary_key=True)
    name: Mapped[str]

    # Always specify loading strategy
    samples: Mapped[list["WritingSample"]] = relationship(
        back_populates="clone",
        lazy="selectin",  # Loaded automatically in a second SELECT
    )

# In a query — override loading when needed
from sqlalchemy.orm import joinedload, selectinload

result = await session.execute(
    select(VoiceClone)
    .options(selectinload(VoiceClone.samples))
    .where(VoiceClone.id == clone_id)
)
```

**Rules:**
- Never access lazy-loaded relationships in async code — it triggers sync I/O
- Use `selectinload` for collections (one-to-many)
- Use `joinedload` for single relations (many-to-one)
- Always specify loading strategy explicitly in queries that need related data

### Alembic Migrations

**Naming convention:** `YYYYMMDD_HHMM_short_description.py`

```bash
# Generate a migration
alembic revision --autogenerate -m "add_writing_samples_table"
# Then rename: 20260208_1430_add_writing_samples_table.py
```

**Rules:**
- Every migration must be reversible — `downgrade()` must work
- Use batch operations for SQLite ALTER TABLE limitations:

```python
def upgrade() -> None:
    with op.batch_alter_table("voice_clones") as batch_op:
        batch_op.add_column(sa.Column("is_hidden", sa.Boolean(), default=False))

def downgrade() -> None:
    with op.batch_alter_table("voice_clones") as batch_op:
        batch_op.drop_column("is_hidden")
```

- Test migrations: `alembic upgrade head && alembic downgrade base && alembic upgrade head`

### Constraint Naming Convention

Defined on `Base.metadata` so Alembic can auto-generate constraint names:

```python
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

convention = {
    "ix": "ix_%(table_name)s_%(column_0_N_name)s",
    "uq": "uq_%(table_name)s_%(column_0_N_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)
```

### Seed Data

`backend/app/seed.py` populates demo clones and default methodology content on first startup. Called from the FastAPI lifespan event when the database is empty.

---

## 7. API Design

### URL Structure

All endpoints under `/api/` prefix:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/clones` | List clones (paginated, filterable) |
| POST | `/api/clones` | Create clone |
| GET | `/api/clones/{id}` | Get clone detail |
| PUT | `/api/clones/{id}` | Update clone |
| DELETE | `/api/clones/{id}` | Delete clone |
| POST | `/api/clones/{id}/analyze` | Trigger DNA analysis |
| GET | `/api/clones/{id}/samples` | List samples for a clone |
| POST | `/api/clones/{id}/samples` | Add sample to clone |
| DELETE | `/api/clones/{id}/samples/{sample_id}` | Delete sample |
| GET | `/api/clones/{id}/dna` | Get current DNA |
| GET | `/api/clones/{id}/dna/versions` | List DNA versions |
| POST | `/api/clones/{id}/dna/revert/{version}` | Revert to DNA version |
| POST | `/api/clones/merge` | Create merged clone |
| GET | `/api/content` | List content (paginated, filterable) |
| POST | `/api/content/generate` | Generate content |
| GET | `/api/content/{id}` | Get content detail |
| PUT | `/api/content/{id}` | Update content |
| DELETE | `/api/content/{id}` | Delete content |
| GET | `/api/methodology/{section}` | Get methodology section |
| PUT | `/api/methodology/{section}` | Update methodology section |
| GET | `/api/providers` | List provider configs |
| PUT | `/api/providers/{provider}` | Update provider config |
| POST | `/api/providers/{provider}/test` | Test provider connection |

### RESTful Conventions

- Plural nouns for resources: `/clones`, `/content`
- HTTP methods for operations: GET (read), POST (create), PUT (full update), PATCH (partial update), DELETE (remove)
- Nested resources for clear ownership: `/clones/{id}/samples`
- Action endpoints use verbs: `/clones/{id}/analyze`, `/providers/{provider}/test`

### Pagination

```
GET /api/clones?offset=0&limit=20
```

Response:
```json
{
  "items": [...],
  "total": 42
}
```

### Filtering

Query parameters for filtering:

```
GET /api/content?status=draft&platform=linkedin&clone_id=abc123
GET /api/clones?type=original&search=marketing
```

### SSE Streaming

For LLM streaming responses:

```python
from fastapi.responses import StreamingResponse

@router.post("/content/generate/stream")
async def generate_content_stream(...) -> StreamingResponse:
    return StreamingResponse(
        content=_stream_generation(clone, input_text, settings),
        media_type="text/event-stream",
    )

async def _stream_generation(...):
    async for chunk in llm_provider.stream_completion(prompt):
        yield f"data: {json.dumps({'text': chunk})}\n\n"
    yield "data: [DONE]\n\n"
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful read or update |
| 201 | Created | Successful resource creation |
| 204 | No Content | Successful delete |
| 400 | Bad Request | Business logic validation failure |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Pydantic request validation error (auto) |
| 500 | Internal Server Error | Unexpected server failure |
| 502 | Bad Gateway | LLM provider error |

---

## 8. Logging & Observability

### Backend Logging

Use Python's `logging` module with structured format:

```python
import logging

logger = logging.getLogger(__name__)

# In service methods:
logger.info("DNA analysis started", extra={"clone_id": clone_id, "sample_count": len(samples)})
logger.info(
    "DNA analysis completed",
    extra={"clone_id": clone_id, "duration_ms": elapsed_ms, "model": model_name},
)
logger.error("LLM call failed", extra={"provider": provider, "error": str(exc)}, exc_info=True)
```

### What to Log

**DO log:**
- Request lifecycle: method, path, status code, duration
- Errors with full traceback
- Key business events: DNA analysis started/completed, content generated, provider connection tested
- Performance metrics: LLM call duration, token counts

**NEVER log:**
- API keys (even partially)
- Full writing sample text (log word count instead)
- Full LLM responses (log token counts instead)
- Full Voice DNA JSON (log version number and trigger instead)

### Log Levels

| Level | When | Example |
|-------|------|---------|
| DEBUG | Verbose development detail | `"Query returned 42 clones"` |
| INFO | Request lifecycle, business events | `"DNA analysis completed in 12.3s"` |
| WARNING | Degraded but functional | `"LLM rate limited, retrying in 2s"` |
| ERROR | Failure requiring attention | `"Database migration failed"` |

### Frontend Logging

```typescript
// CORRECT: console.error for unexpected errors only
console.error('Unexpected error in CloneCard:', error);

// WRONG: console.log in production code
console.log('clones:', clones);           // NEVER
console.log('rendering CloneCard');       // NEVER
```

**Rule:** No `console.log` in production code. Use `console.error` for unexpected errors caught by error boundaries. Use `console.warn` sparingly for deprecation notices.

---

## 9. AI-Specific Coding Rules

These rules exist because AI code generation tools tend toward specific anti-patterns. Every agent (human or AI) must follow them.

### No Dead Code

```python
# WRONG: commented-out code
# def old_analyze_method(self):
#     ...

# WRONG: unused import
from app.models.content import Content  # never referenced

# WRONG: TODO without task ID
# TODO: add caching here

# CORRECT: TODO with Beads task ID
# TODO(sona-abc): add response caching for clone list
```

### No Duplication

```python
# WRONG: copy-paste with minor variation
async def get_clone_by_id(session, clone_id):
    result = await session.execute(select(VoiceClone).where(VoiceClone.id == clone_id))
    return result.scalar_one_or_none()

async def get_sample_by_id(session, sample_id):
    result = await session.execute(select(WritingSample).where(WritingSample.id == sample_id))
    return result.scalar_one_or_none()

# CORRECT: extract when there's genuine shared logic, but don't over-abstract
# In this case, the two functions are different enough (different models, different
# error handling) that separate implementations are fine. Only extract if 3+ copies
# with identical structure exist.
```

### No Magic Values

```python
# WRONG: magic numbers
if len(samples) > 50000:
    raise ValueError("Too many words")

if score >= 80:
    badge = "green"

# CORRECT: named constants
MAX_SAMPLE_WORDS = 50_000
CONFIDENCE_THRESHOLD_READY = 80

if total_words > MAX_SAMPLE_WORDS:
    raise SampleTooLargeError(total_words, MAX_SAMPLE_WORDS)

if score >= CONFIDENCE_THRESHOLD_READY:
    badge = "green"
```

### Clarity Over Cleverness

```python
# WRONG: overly clever one-liner
scores = {k: sum(v)/len(v) if v else 0 for k, v in groupby(sorted(data, key=lambda x: x[0]), key=lambda x: x[0])}

# CORRECT: readable steps
scores: dict[str, float] = {}
for dimension, dimension_scores in grouped_scores.items():
    if dimension_scores:
        scores[dimension] = sum(dimension_scores) / len(dimension_scores)
    else:
        scores[dimension] = 0.0
```

### Minimal Imports

```typescript
// WRONG: import entire library
import * as _ from 'lodash';
const result = _.chunk(items, 10);

// CORRECT: import only what you need (or just write it)
function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
```

### No Premature Abstraction

Wait for 2+ concrete uses before extracting shared logic:

```typescript
// First use: just write it inline
function ClonesPage() {
  const { data, isLoading } = useClones();
  if (isLoading) return <div className="animate-pulse h-32 rounded-lg bg-muted" />;
  // ...
}

// Second use with same pattern: NOW extract
function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />;
}
```

### Single Purpose Functions

```python
# WRONG: function does two unrelated things
async def analyze_and_save_dna(clone_id: str, session: AsyncSession) -> VoiceDNA:
    samples = await get_samples(clone_id, session)
    dna = await llm_provider.analyze(samples)  # AI call
    clone = await get_clone(clone_id, session)  # DB read
    clone.current_dna = dna                     # DB write
    await session.commit()
    await send_notification(clone)              # Side effect
    return dna

# CORRECT: separate concerns
async def analyze_dna(samples: list[WritingSample]) -> VoiceDNAData:
    """Pure LLM analysis — no side effects."""
    return await llm_provider.analyze(samples)

async def save_dna_version(
    clone_id: str, dna_data: VoiceDNAData, trigger: str, session: AsyncSession,
) -> VoiceDNAVersion:
    """Persist a new DNA version."""
    version = VoiceDNAVersion(clone_id=clone_id, data=dna_data, trigger=trigger)
    session.add(version)
    await session.commit()
    return version
```

### No Scope Creep

Only implement what the current task requires:

```python
# Task: "Add endpoint to get clone by ID"

# WRONG: also adding caching, pagination, search, and soft-delete
@router.get("/clones/{clone_id}")
async def get_clone(clone_id: str, include_deleted: bool = False, ...) -> ...:
    ...  # with Redis caching, metrics, etc.

# CORRECT: exactly what was asked
@router.get("/clones/{clone_id}")
async def get_clone(
    clone_id: str,
    session: AsyncSession = Depends(get_session),
) -> CloneResponse:
    service = CloneService(session)
    clone = await service.get_by_id(clone_id)
    return CloneResponse.model_validate(clone)
```

---

## 10. Code Review Checklist

AI agents self-apply this checklist before marking any task complete:

### Backend

- [ ] `ruff check backend/` passes (no lint errors)
- [ ] `ruff format --check backend/` passes (formatting correct)
- [ ] `pyright` reports no errors
- [ ] `pytest` — all tests pass
- [ ] No hardcoded values that should be constants or configuration
- [ ] Error cases handled with domain exceptions, not just happy path
- [ ] No sensitive data in logs or error responses
- [ ] Names are descriptive and follow naming conventions (Section 2)
- [ ] No sync blocking calls in async functions
- [ ] Relationship loading strategies specified (no lazy loading in async)
- [ ] No unnecessary dependencies added

### Frontend

- [ ] `pnpm lint` passes (ESLint clean)
- [ ] `pnpm tsc --noEmit` passes (TypeScript clean)
- [ ] `pnpm test` — all tests pass
- [ ] No `any` types
- [ ] No `console.log` in production code
- [ ] Types derived from Zod schemas where applicable
- [ ] Server state managed by TanStack Query, not local state
- [ ] Error states handled (not just loading and success)
- [ ] No unnecessary dependencies added

### General

- [ ] Changes are minimal — only what the task requires
- [ ] No dead code, no commented-out code
- [ ] No TODOs without a Beads task ID
- [ ] No duplicated logic that should be extracted
- [ ] Commit message follows convention: `[BD-<short-id>] type(scope): description`

---

## 11. Tooling Quick Reference

### Config File Locations

| File | Purpose | Key Settings |
|------|---------|-------------|
| `backend/pyproject.toml` | Ruff + Pyright + pytest | `line-length = 100`, `target-version = "py312"`, `typeCheckingMode = "strict"`, `asyncio_mode = "auto"` |
| `frontend/eslint.config.mjs` | ESLint 9 flat config | typescript-eslint recommended, react-hooks, simple-import-sort, no-explicit-any |
| `frontend/.prettierrc` | Prettier formatting | `printWidth: 100`, `singleQuote: true`, `trailingComma: "es5"`, Tailwind plugin |
| `frontend/tsconfig.json` | TypeScript (app) | `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`, `@/*` path alias |
| `frontend/tsconfig.node.json` | TypeScript (build files) | Covers `vite.config.ts` |
| `.editorconfig` | Cross-editor basics | `indent_size = 2` (default), `indent_size = 4` (Python), `end_of_line = lf` |
| `frontend/.prettierignore` | Prettier exclusions | `dist/`, `node_modules/`, `pnpm-lock.yaml` |

### Common Commands

**Backend:**
```bash
# Lint check
ruff check backend/

# Lint fix (auto)
ruff check --fix backend/

# Format check
ruff format --check backend/

# Format fix
ruff format backend/

# Type check
pyright

# Run tests
pytest

# Run tests with coverage
pytest --cov=app --cov-report=term-missing
```

**Frontend:**
```bash
# Lint
pnpm lint

# Format check
pnpm prettier --check src/

# Format fix
pnpm prettier --write src/

# Type check
pnpm tsc --noEmit

# Run tests
pnpm test

# Run tests in watch mode
pnpm test --watch
```

### Line Length

Consistent across the entire project: **100 characters**.

- Backend: `line-length = 100` in `[tool.ruff]`
- Frontend: `"printWidth": 100` in `.prettierrc`
- Editor: handled by `.editorconfig` indirectly (editors can read ruff/prettier config for rulers)

### Import Sorting

Both stacks enforce import ordering automatically:

- **Python:** Ruff's `isort` integration (`"I"` rule) with `known-first-party = ["app"]`
- **TypeScript:** `eslint-plugin-simple-import-sort` in ESLint config

### Quote Style

- **Python:** Double quotes (Ruff `quote-style = "double"`)
- **TypeScript:** Single quotes (Prettier `singleQuote: true`)

### Indentation

- **Python:** 4 spaces (PEP 8 standard, enforced by `.editorconfig`)
- **TypeScript / JSON / YAML / HTML:** 2 spaces (enforced by `.editorconfig` and Prettier `tabWidth: 2`)
- **Makefile:** Tabs (enforced by `.editorconfig`)

### Path Aliases

Frontend uses `@/*` to reference `src/*`:

```typescript
// Instead of: import { Button } from '../../../components/ui/button';
import { Button } from '@/components/ui/button';
```

Configured in:
- `frontend/tsconfig.json` — `"paths": { "@/*": ["src/*"] }`
- `frontend/vite.config.ts` — `resolve.alias` (must be added during scaffolding)
