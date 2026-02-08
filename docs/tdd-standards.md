# Sona — TDD Standards

Definitive testing reference for the Sona project. Every AI agent and human contributor follows these standards. All code ships with tests. No exceptions.

> **Companion docs:** [Coding Standards](coding-standards.md) for code patterns, [Tech Stack](tech-stack.md) for tool versions.

---

## Table of Contents

1. [Core Rules](#1-core-rules)
2. [Test-First Workflow](#2-test-first-workflow)
3. [Backend Testing (Python/FastAPI)](#3-backend-testing-pythonfastapi)
4. [Frontend Testing (React/TypeScript)](#4-frontend-testing-reacttypescript)
5. [Test Organization & Naming](#5-test-organization--naming)
6. [Fixtures & Test Data](#6-fixtures--test-data)
7. [Mocking Strategy](#7-mocking-strategy)
8. [AI Agent Testing Rules](#8-ai-agent-testing-rules)
9. [Coverage & Quality](#9-coverage--quality)
10. [Commands Quick Reference](#10-commands-quick-reference)

---

## 1. Core Rules

1. **Test-first, always.** Write a failing test before writing implementation code. No exceptions.
2. **Tests prove behavior.** Every test asserts observable behavior, not implementation details.
3. **Tests must be able to fail.** If a test can never fail, it's not testing anything. Delete it.
4. **Tests run fast.** Unit tests < 100ms. Integration tests < 2s. E2E tests < 30s per flow.
5. **Tests are independent.** No test depends on another test's side effects or execution order.
6. **Tests are deterministic.** Same inputs, same result. No flaky tests allowed.
7. **90% coverage floor.** Both backend and frontend enforce 90% line coverage in CI.
8. **Bug fix = failing test first.** Every bug fix starts with a test that reproduces the bug, then the fix.
9. **No testing framework behavior.** Don't test that FastAPI returns JSON or that React renders JSX. Test YOUR code.
10. **Readable tests are documentation.** A new developer should understand the feature by reading the tests.

---

## 2. Test-First Workflow

Every feature follows the Red-Green-Refactor cycle:

### The Cycle

```
1. RED    — Write a test that describes the desired behavior. Run it. Watch it FAIL.
2. GREEN  — Write the minimum code to make the test pass. Nothing more.
3. REFACTOR — Clean up the implementation while keeping all tests green.
4. COMMIT — Commit the test + implementation together.
```

### Example: Adding a `get_clone_by_id` service method

**Step 1 — RED: Write the failing test**

```python
# backend/tests/test_services/test_clone_service.py

async def test_get_clone_by_id_returns_clone(session, sample_clone):
    """Should return the clone when it exists."""
    service = CloneService(session)
    result = await service.get_by_id(sample_clone.id)
    assert result.id == sample_clone.id
    assert result.name == sample_clone.name


async def test_get_clone_by_id_raises_not_found(session):
    """Should raise CloneNotFoundError when clone does not exist."""
    service = CloneService(session)
    with pytest.raises(CloneNotFoundError):
        await service.get_by_id("nonexistent-id")
```

Run: `pytest backend/tests/test_services/test_clone_service.py` — both tests **FAIL** (method doesn't exist yet).

**Step 2 — GREEN: Write minimum implementation**

```python
# backend/app/services/clone_service.py

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

Run: `pytest backend/tests/test_services/test_clone_service.py` — both tests **PASS**.

**Step 3 — REFACTOR: Clean up if needed**

In this case, the code is already clean. Move on.

**Step 4 — COMMIT**

```bash
git add backend/app/services/clone_service.py backend/tests/test_services/test_clone_service.py
git commit -m "[BD-xxx] feat(clones): add get_by_id service method"
```

---

## 3. Backend Testing (Python/FastAPI)

### Test Infrastructure

All backend tests use **pytest** with **pytest-asyncio** in `auto` mode. Test configuration lives in `backend/pyproject.toml`:

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
filterwarnings = ["error"]

[tool.coverage.run]
source = ["app"]

[tool.coverage.report]
fail_under = 90
show_missing = true
exclude_lines = [
    "if TYPE_CHECKING:",
    "pragma: no cover",
]
```

### Core Fixtures (`backend/tests/conftest.py`)

Every test session gets an isolated in-memory database with transaction rollback:

```python
import pytest
from sqlalchemy import StaticPool
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from httpx import ASGITransport, AsyncClient

from app.database import Base, get_session
from app.main import app


@pytest.fixture
async def engine():
    """In-memory SQLite engine shared across a test session."""
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture
async def session(engine):
    """Async session with transaction rollback after each test."""
    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        async with session.begin():
            yield session
        # Transaction is rolled back automatically when the context exits
        # without commit — each test starts with a clean database.


@pytest.fixture
async def client(engine, session):
    """httpx AsyncClient wired to the FastAPI app with test DB."""

    async def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        yield client

    app.dependency_overrides.clear()
```

### Testing API Endpoints (Integration Tests)

API tests exercise the full stack: HTTP request → route handler → service → database → response.

```python
# backend/tests/test_api/test_clones.py

async def test_create_clone(client):
    """POST /api/clones should create a clone and return 201."""
    response = await client.post(
        "/api/clones",
        json={"name": "Test Clone", "description": "A test voice"},
    )
    assert response.status_code == 201

    data = response.json()
    assert data["name"] == "Test Clone"
    assert data["description"] == "A test voice"
    assert data["type"] == "original"
    assert "id" in data
    assert "created_at" in data


async def test_create_clone_missing_name(client):
    """POST /api/clones without name should return 422."""
    response = await client.post("/api/clones", json={"description": "no name"})
    assert response.status_code == 422


async def test_get_clone_not_found(client):
    """GET /api/clones/{id} with bad ID should return 404."""
    response = await client.get("/api/clones/nonexistent")
    assert response.status_code == 404
    assert response.json()["code"] == "CLONE_NOT_FOUND"


async def test_list_clones_empty(client):
    """GET /api/clones should return empty list when no clones exist."""
    response = await client.get("/api/clones")
    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_delete_clone(client):
    """DELETE /api/clones/{id} should return 204 and remove the clone."""
    # Create first
    create_resp = await client.post(
        "/api/clones", json={"name": "To Delete"}
    )
    clone_id = create_resp.json()["id"]

    # Delete
    delete_resp = await client.delete(f"/api/clones/{clone_id}")
    assert delete_resp.status_code == 204

    # Verify gone
    get_resp = await client.get(f"/api/clones/{clone_id}")
    assert get_resp.status_code == 404
```

### Testing Services (Unit Tests)

Service tests validate business logic with a real test database session. Mock only when testing interactions with external systems (LLM providers, HTTP clients).

```python
# backend/tests/test_services/test_clone_service.py

async def test_list_clones_excludes_hidden_demos(session, demo_clone, original_clone):
    """Listing clones with hide_demos=True should exclude demo clones."""
    demo_clone.is_hidden = True
    await session.flush()

    service = CloneService(session)
    clones, total = await service.list(hide_demos=True)

    assert total == 1
    assert clones[0].id == original_clone.id


async def test_calculate_confidence_score(session, sample_clone):
    """Confidence score should reflect sample count, word count, and variety."""
    service = CloneService(session)
    score = service.calculate_confidence(sample_clone)

    assert 0 <= score <= 100
    assert isinstance(score, int)
```

### Testing LLM Providers (Always Mocked)

LLM provider calls are **always** mocked in tests. Never make real API calls.

```python
# backend/tests/test_llm/test_openai_provider.py
from unittest.mock import AsyncMock, patch

async def test_analyze_voice_dna(sample_texts):
    """Should call OpenAI and return parsed DNA structure."""
    mock_response = AsyncMock()
    mock_response.choices = [
        AsyncMock(message=AsyncMock(content='{"vocabulary": {"complexity": "moderate"}}'))
    ]

    with patch("app.llm.openai.AsyncOpenAI") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value = mock_client

        provider = OpenAIProvider(api_key="test-key", model="gpt-4o")
        result = await provider.analyze_dna(sample_texts)

        assert "vocabulary" in result
        mock_client.chat.completions.create.assert_called_once()


async def test_analyze_dna_handles_api_error(sample_texts):
    """Should raise AnalysisFailedError when the API call fails."""
    with patch("app.llm.openai.AsyncOpenAI") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.chat.completions.create = AsyncMock(
            side_effect=Exception("API rate limit exceeded")
        )
        mock_client_cls.return_value = mock_client

        provider = OpenAIProvider(api_key="test-key", model="gpt-4o")
        with pytest.raises(AnalysisFailedError, match="rate limit"):
            await provider.analyze_dna(sample_texts)
```

### Testing Streaming / SSE Endpoints

Use `httpx` streaming to test SSE endpoints:

```python
# backend/tests/test_api/test_content_stream.py

async def test_generate_content_streams_sse(client, sample_clone, mock_llm_stream):
    """POST /api/content/generate/stream should return SSE events."""
    async with client.stream(
        "POST",
        "/api/content/generate/stream",
        json={
            "clone_id": sample_clone.id,
            "input_text": "Write about testing",
            "platform": "linkedin",
        },
    ) as response:
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream"

        events = []
        async for line in response.aiter_lines():
            if line.startswith("data: "):
                events.append(line[6:])

        assert len(events) > 0
        assert events[-1] == "[DONE]"
```

### Testing URL Scraping (with pytest-httpx)

Use `pytest-httpx` to mock outgoing HTTP requests:

```python
# backend/tests/test_services/test_scraping.py

async def test_scrape_url_extracts_text(httpx_mock):
    """Should extract article text from HTML page."""
    httpx_mock.add_response(
        url="https://example.com/article",
        html="<html><body><article><p>Hello world</p></article></body></html>",
    )

    service = ScrapingService()
    result = await service.scrape("https://example.com/article")

    assert "Hello world" in result.text
    assert result.word_count > 0


async def test_scrape_url_handles_failure(httpx_mock):
    """Should raise a clear error when the URL is unreachable."""
    httpx_mock.add_response(url="https://example.com/down", status_code=500)

    service = ScrapingService()
    with pytest.raises(ScrapingError, match="Could not extract text"):
        await service.scrape("https://example.com/down")
```

---

## 4. Frontend Testing (React/TypeScript)

### Test Infrastructure

Frontend tests use **Vitest** + **React Testing Library** + **MSW 2.x**. Tests are **co-located** with their source files.

Vitest configuration in `frontend/vite.config.ts`:

```typescript
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/**/*.d.ts'],
      thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
    },
  },
});
```

### Shared Test Utilities (`frontend/src/test/`)

#### Setup (`src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './handlers';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

#### Custom Render (`src/test/render.tsx`)

Wraps every component with `QueryClientProvider` and `MemoryRouter`:

```typescript
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], ...options }: CustomRenderOptions = {}
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}
```

**Key settings:**
- `retry: false` — Tests should fail immediately, not retry silently.
- `gcTime: Infinity` — Prevents garbage collection during assertions.

#### MSW Handlers (`src/test/handlers.ts`)

```typescript
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('/api/clones', () => {
    return HttpResponse.json({
      items: [],
      total: 0,
    });
  }),

  http.post('/api/clones', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        id: 'test-id',
        name: body.name,
        description: body.description ?? null,
        type: 'original',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),
];

export const server = setupServer(...handlers);
```

#### Test Data Factories (`src/test/factories.ts`)

```typescript
import type { Clone, Content } from '@/types/api';

let counter = 0;

export function buildClone(overrides: Partial<Clone> = {}): Clone {
  counter += 1;
  return {
    id: `clone-${counter}`,
    name: `Test Clone ${counter}`,
    description: null,
    type: 'original',
    confidence_score: 85,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function buildContent(overrides: Partial<Content> = {}): Content {
  counter += 1;
  return {
    id: `content-${counter}`,
    clone_id: 'clone-1',
    platform: 'linkedin',
    status: 'draft',
    content: 'Generated content text',
    original_content: 'Generated content text',
    input_text: 'Some input',
    word_count: 3,
    authenticity_score: 78,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
```

### Testing Components

Co-located test files sit next to the component:

```
src/components/
├── CloneCard.tsx
├── CloneCard.test.tsx      # <-- Tests live here
├── DnaRadar.tsx
└── DnaRadar.test.tsx
```

**Component test example:**

```typescript
// src/components/CloneCard.test.tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { buildClone } from '@/test/factories';
import { CloneCard } from './CloneCard';

describe('CloneCard', () => {
  it('should display clone name and confidence badge', () => {
    const clone = buildClone({ name: 'Marketing Voice', confidence_score: 92 });
    renderWithProviders(<CloneCard clone={clone} />);

    expect(screen.getByText('Marketing Voice')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('should show demo badge for demo clones', () => {
    const clone = buildClone({ type: 'demo' });
    renderWithProviders(<CloneCard clone={clone} />);

    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('should navigate to clone detail on click', async () => {
    const user = userEvent.setup();
    const clone = buildClone({ id: 'clone-abc' });
    renderWithProviders(<CloneCard clone={clone} />);

    await user.click(screen.getByRole('link'));

    // Router navigation is tested — the link href points to the detail page
    expect(screen.getByRole('link')).toHaveAttribute('href', '/clones/clone-abc');
  });
});
```

**Rules for component tests:**
- Always use `userEvent.setup()` — never `fireEvent`.
- Query by role, label, or text — never by test ID unless no accessible alternative exists.
- Assert what the user sees, not internal state.

### Testing Forms (React Hook Form + Zod)

```typescript
// src/components/CreateCloneForm.test.tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/render';
import { CreateCloneForm } from './CreateCloneForm';

describe('CreateCloneForm', () => {
  it('should show validation error when name is empty', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateCloneForm />);

    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('should submit valid form data', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateCloneForm />);

    await user.type(screen.getByLabelText(/name/i), 'My Voice');
    await user.type(screen.getByLabelText(/description/i), 'Test description');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
  });

  it('should enforce max length on name field', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CreateCloneForm />);

    const longName = 'a'.repeat(101);
    await user.type(screen.getByLabelText(/name/i), longName);
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/100/i)).toBeInTheDocument();
  });
});
```

### Testing TanStack Query Components

Components that use `useQuery` or `useMutation` need the custom render wrapper and MSW:

```typescript
// src/pages/clones/ClonesPage.test.tsx
import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/render';
import { server } from '@/test/handlers';
import { buildClone } from '@/test/factories';
import { ClonesPage } from './ClonesPage';

describe('ClonesPage', () => {
  it('should show loading state initially', () => {
    renderWithProviders(<ClonesPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should render clones after loading', async () => {
    const clones = [
      buildClone({ name: 'Clone A' }),
      buildClone({ name: 'Clone B' }),
    ];

    server.use(
      http.get('/api/clones', () => {
        return HttpResponse.json({ items: clones, total: 2 });
      })
    );

    renderWithProviders(<ClonesPage />);

    expect(await screen.findByText('Clone A')).toBeInTheDocument();
    expect(screen.getByText('Clone B')).toBeInTheDocument();
  });

  it('should show empty state when no clones exist', async () => {
    renderWithProviders(<ClonesPage />);
    expect(await screen.findByText(/create your first clone/i)).toBeInTheDocument();
  });

  it('should show error state on API failure', async () => {
    server.use(
      http.get('/api/clones', () => {
        return HttpResponse.json(
          { detail: 'Internal error', code: 'INTERNAL' },
          { status: 500 }
        );
      })
    );

    renderWithProviders(<ClonesPage />);
    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});
```

### Testing Zustand Stores

Reset store state between tests to prevent leakage:

```typescript
// src/stores/ui-store.test.ts
import { act } from '@testing-library/react';
import { useUiStore } from './ui-store';

describe('useUiStore', () => {
  beforeEach(() => {
    // Reset to initial state
    act(() => {
      useUiStore.setState({
        hideDemoClones: false,
        showInputPanel: false,
      });
    });
  });

  it('should toggle hideDemoClones', () => {
    act(() => {
      useUiStore.getState().toggleHideDemoClones();
    });

    expect(useUiStore.getState().hideDemoClones).toBe(true);

    act(() => {
      useUiStore.getState().toggleHideDemoClones();
    });

    expect(useUiStore.getState().hideDemoClones).toBe(false);
  });
});
```

### E2E Testing with Playwright

Playwright covers **critical user flows** that cross multiple pages. It does NOT duplicate unit/component test coverage.

#### Which Flows to Cover

| Flow | Why E2E |
|------|---------|
| Provider setup → first content generation | First-run experience is make-or-break |
| Create clone → add samples → analyze DNA | Core value proposition, multi-step |
| Generate content → review → save to library | Primary user action loop |
| Content library filtering and search | Complex interactions across components |

#### Playwright Configuration (`frontend/playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### Page Object Pattern

```typescript
// frontend/e2e/pages/clones-page.ts
import { type Page, type Locator } from '@playwright/test';

export class ClonesPage {
  readonly page: Page;
  readonly newCloneButton: Locator;
  readonly cloneCards: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newCloneButton = page.getByRole('button', { name: /new clone/i });
    this.cloneCards = page.getByTestId('clone-card');
    this.searchInput = page.getByPlaceholder(/search/i);
  }

  async goto() {
    await this.page.goto('/clones');
  }

  async createClone(name: string) {
    await this.newCloneButton.click();
    await this.page.getByLabel(/name/i).fill(name);
    await this.page.getByRole('button', { name: /create/i }).click();
  }
}
```

#### E2E Test Structure

```typescript
// frontend/e2e/clone-workflow.spec.ts
import { test, expect } from '@playwright/test';
import { ClonesPage } from './pages/clones-page';

test.describe('Clone workflow', () => {
  test('should create a clone and add a writing sample', async ({ page }) => {
    const clonesPage = new ClonesPage(page);
    await clonesPage.goto();

    // Create clone
    await clonesPage.createClone('E2E Test Clone');
    await expect(page.getByText('E2E Test Clone')).toBeVisible();

    // Add sample
    await page.getByRole('button', { name: /add sample/i }).click();
    await page.getByRole('textbox', { name: /paste/i }).fill(
      'This is a writing sample for E2E testing. It needs enough words to be meaningful.'
    );
    await page.getByRole('button', { name: /add$/i }).click();

    // Verify sample appears
    await expect(page.getByText(/writing sample/i)).toBeVisible();
  });
});
```

---

## 5. Test Organization & Naming

### File Structure

| Stack | Pattern | Location |
|-------|---------|----------|
| Backend unit/integration | `test_*.py` in `backend/tests/` | `tests/test_api/`, `tests/test_services/`, `tests/test_llm/` |
| Backend conftest | `conftest.py` | `tests/conftest.py` (root), or per-directory for scoped fixtures |
| Frontend unit/component | `*.test.tsx` / `*.test.ts` | **Co-located** next to the source file |
| Frontend shared utilities | `setup.ts`, `render.tsx`, etc. | `src/test/` |
| E2E tests | `*.spec.ts` | `frontend/e2e/` |
| E2E page objects | `*-page.ts` | `frontend/e2e/pages/` |

### Test Naming

**Backend (pytest):**

```python
# GOOD: descriptive function names that describe behavior
async def test_create_clone_returns_201_with_valid_data(client): ...
async def test_create_clone_returns_422_when_name_missing(client): ...
async def test_get_clone_returns_404_when_not_found(client): ...
async def test_calculate_confidence_with_no_samples_returns_zero(session): ...

# BAD: vague or implementation-focused names
async def test_clone(client): ...            # What about it?
async def test_post_endpoint(client): ...    # Which one? What does it test?
async def test_database_query(session): ...  # Testing the ORM, not behavior
```

**Frontend (Vitest):**

```typescript
// GOOD: describe block = unit under test, it = specific behavior
describe('CloneCard', () => {
  it('should display clone name and confidence badge', () => { ... });
  it('should show merged badge for merged clones', () => { ... });
  it('should navigate to detail page on click', () => { ... });
});

// BAD: testing implementation details
describe('CloneCard', () => {
  it('should render div with className clone-card', () => { ... });
  it('should call useState', () => { ... });
  it('should pass props correctly', () => { ... });
});
```

### Test Name Formula

```
should <expected behavior> when <condition>
```

Examples:
- `should return 404 when clone does not exist`
- `should show validation error when name is empty`
- `should disable generate button when no clone is selected`
- `should stream SSE events when generation succeeds`

---

## 6. Fixtures & Test Data

### Backend Fixtures (Python)

Use **factory fixtures** in `conftest.py` — simple functions that create test entities. No need for `factory_boy` at this project size.

```python
# backend/tests/conftest.py (additional fixtures)

@pytest.fixture
def make_clone(session):
    """Factory fixture for creating VoiceClone instances."""
    async def _make_clone(
        name: str = "Test Clone",
        clone_type: str = "original",
        is_demo: bool = False,
        **kwargs,
    ) -> VoiceClone:
        clone = VoiceClone(
            id=nanoid.generate(),
            name=name,
            type=clone_type,
            is_demo=is_demo,
            **kwargs,
        )
        session.add(clone)
        await session.flush()
        return clone
    return _make_clone


@pytest.fixture
async def sample_clone(make_clone):
    """A pre-made original clone for tests that just need one."""
    return await make_clone(name="Sample Clone")


@pytest.fixture
async def demo_clone(make_clone):
    """A pre-made demo clone."""
    return await make_clone(name="Demo Clone", clone_type="demo", is_demo=True)


@pytest.fixture
def make_sample(session):
    """Factory fixture for creating WritingSample instances."""
    async def _make_sample(
        clone_id: str,
        content: str = "This is a test writing sample with enough words.",
        content_type: str = "blog_post",
        **kwargs,
    ) -> WritingSample:
        sample = WritingSample(
            id=nanoid.generate(),
            clone_id=clone_id,
            content=content,
            content_type=content_type,
            word_count=len(content.split()),
            source_type="paste",
            **kwargs,
        )
        session.add(sample)
        await session.flush()
        return sample
    return _make_sample
```

**Factory fixture pattern:**
- `make_<entity>` — Returns a callable that creates an entity with defaults. Use when you need to customize.
- `sample_<entity>` — Pre-made instance using the factory. Use when you just need one and don't care about specific values.

### Frontend Factories (TypeScript)

Defined in `src/test/factories.ts` (see [Section 4](#4-frontend-testing-reacttypescript) for examples).

**Rules:**
- Factories return plain objects matching API response types.
- Every field has a sensible default.
- Use `overrides` parameter for test-specific values.
- Auto-increment IDs to avoid collisions.

---

## 7. Mocking Strategy

### Decision Tree

```
What are you testing?
│
├─ External HTTP API (LLM providers, URL scraping)
│  └─ ALWAYS MOCK
│     ├─ Backend: AsyncMock (unittest.mock) or pytest-httpx
│     └─ Frontend: MSW 2.x handlers
│
├─ Database
│  ├─ Integration test (API endpoint, service CRUD)
│  │  └─ REAL test DB (in-memory SQLite)
│  └─ Isolated unit test (complex logic only)
│     └─ MOCK the session (rare — prefer integration)
│
├─ File I/O
│  └─ MOCK in unit tests (tmp_path for integration tests)
│
├─ Time / datetime
│  └─ MOCK datetime.now() when testing time-dependent logic
│     └─ Use freezegun or unittest.mock.patch
│
├─ React internals (hooks, context, rendering)
│  └─ NEVER MOCK — use renderWithProviders
│
├─ Pydantic / Zod validation
│  └─ NEVER MOCK — test with real validators
│
├─ Business logic (services, utils)
│  └─ NEVER MOCK — test the real thing
│
└─ Third-party UI libraries (shadcn/ui, Radix)
   └─ NEVER MOCK — test through user interaction
```

### Mock Examples

**Backend — Mocking an LLM provider call:**

```python
from unittest.mock import AsyncMock, patch

async def test_content_generation_uses_voice_dna(session, sample_clone):
    """Generation should include the clone's DNA in the LLM prompt."""
    mock_provider = AsyncMock()
    mock_provider.generate_content = AsyncMock(return_value="Generated text")

    service = ContentService(session, llm_provider=mock_provider)
    result = await service.generate(
        clone_id=sample_clone.id,
        input_text="Write about testing",
        platform="linkedin",
    )

    assert result.content == "Generated text"
    # Verify the DNA was included in the prompt
    call_args = mock_provider.generate_content.call_args
    assert "vocabulary" in str(call_args)
```

**Frontend — Overriding MSW handler per test:**

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '@/test/handlers';

it('should show error when API returns 500', async () => {
  server.use(
    http.get('/api/clones', () => {
      return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
    })
  );

  renderWithProviders(<ClonesPage />);
  expect(await screen.findByText(/error/i)).toBeInTheDocument();
});
```

### What NEVER to Mock

| Thing | Why Not |
|-------|---------|
| Pydantic model validation | That's what you're testing — the schema is behavior |
| Zod schema validation | Same — the schema IS the feature |
| SQLAlchemy ORM queries (in integration tests) | Use real DB — ORM bugs are real bugs |
| React rendering | Testing Library handles this correctly |
| Route matching | Use MemoryRouter with real routes |
| Business logic in services | Test the real implementation |

---

## 8. AI Agent Testing Rules

Rules specifically for AI agents writing tests. These target the most common anti-patterns.

### Never Test Framework Behavior

```python
# WRONG: testing that FastAPI returns JSON
async def test_endpoint_returns_json(client):
    response = await client.get("/api/clones")
    assert response.headers["content-type"] == "application/json"
    # FastAPI ALWAYS returns JSON. This test can never fail meaningfully.

# RIGHT: test YOUR behavior
async def test_list_clones_returns_items_and_total(client):
    response = await client.get("/api/clones")
    data = response.json()
    assert "items" in data
    assert "total" in data
```

### Never Write Trivial Tests

```typescript
// WRONG: testing a constant
it('should have the correct label', () => {
  expect('Clone Name').toBe('Clone Name');
});

// WRONG: testing that React renders
it('should render without crashing', () => {
  renderWithProviders(<CloneCard clone={buildClone()} />);
  // No assertion on behavior — this just tests React works
});

// RIGHT: test meaningful behavior
it('should display the clone name passed via props', () => {
  renderWithProviders(<CloneCard clone={buildClone({ name: 'Actual Name' })} />);
  expect(screen.getByText('Actual Name')).toBeInTheDocument();
});
```

### Assert Behavior, Not Implementation

```python
# WRONG: testing internal method calls
async def test_service_calls_session_execute(session):
    service = CloneService(session)
    with patch.object(session, "execute") as mock_exec:
        await service.list()
        mock_exec.assert_called_once()  # Who cares HOW it queries?

# RIGHT: test the result
async def test_list_returns_all_clones(session, make_clone):
    await make_clone(name="A")
    await make_clone(name="B")
    service = CloneService(session)
    clones, total = await service.list()
    assert total == 2
    assert {c.name for c in clones} == {"A", "B"}
```

### Every Test Must Be Able to Fail

```typescript
// WRONG: test that can never fail
it('should exist', () => {
  expect(CloneCard).toBeDefined();  // Imports always resolve or throw
});

// WRONG: tautology
it('should return data', async () => {
  const data = await fetchClones();
  expect(data).toBeTruthy();  // Even an empty array is truthy
});

// RIGHT: test with a real failure case
it('should return 2 clones', async () => {
  const data = await fetchClones();
  expect(data.items).toHaveLength(2);
});
```

### Descriptive Test Names

```python
# WRONG:
async def test_clone(): ...
async def test_error(): ...
async def test_1(): ...

# RIGHT:
async def test_get_clone_returns_404_when_not_found(): ...
async def test_create_clone_rejects_duplicate_name(): ...
async def test_confidence_score_caps_at_100(): ...
```

### No Test Interdependencies

```python
# WRONG: test B depends on test A's side effects
class TestCloneWorkflow:
    clone_id = None

    async def test_a_create_clone(self, client):
        resp = await client.post("/api/clones", json={"name": "Test"})
        self.__class__.clone_id = resp.json()["id"]  # Shared state!

    async def test_b_get_clone(self, client):
        resp = await client.get(f"/api/clones/{self.clone_id}")  # Depends on test A
        assert resp.status_code == 200

# RIGHT: each test is self-contained
async def test_get_clone_after_create(client):
    create_resp = await client.post("/api/clones", json={"name": "Test"})
    clone_id = create_resp.json()["id"]

    get_resp = await client.get(f"/api/clones/{clone_id}")
    assert get_resp.status_code == 200
```

### Bug Fix = Failing Test FIRST

```python
# Step 1: Write a test that reproduces the bug
async def test_confidence_score_handles_zero_word_sample(session, make_clone, make_sample):
    """Regression test: confidence calculation crashed on zero-word samples."""
    clone = await make_clone()
    await make_sample(clone.id, content="", word_count=0)

    service = CloneService(session)
    # This should NOT raise — it was crashing with ZeroDivisionError
    score = service.calculate_confidence(clone)
    assert score >= 0

# Step 2: Run it — watch it FAIL (ZeroDivisionError)
# Step 3: Fix the bug in the service
# Step 4: Run it — watch it PASS
# Step 5: Commit test + fix together
```

---

## 9. Coverage & Quality

### Coverage Thresholds

Both stacks enforce **90% line coverage** in CI.

**Backend (`backend/pyproject.toml`):**

```toml
[tool.coverage.report]
fail_under = 90
show_missing = true
```

**Frontend (`frontend/vite.config.ts`):**

```typescript
coverage: {
  thresholds: { lines: 90, branches: 90, functions: 90, statements: 90 },
},
```

### What Counts Toward Coverage

| Counts | Doesn't Count |
|--------|---------------|
| Application code (`app/`, `src/`) | Test files themselves |
| Business logic in services | Type definitions (`*.d.ts`) |
| Route handlers | Test utilities (`src/test/`) |
| React components | Config files (`vite.config.ts`) |
| Custom hooks | Entry points (`main.tsx`) |
| Zustand stores | `if TYPE_CHECKING:` blocks |

### When to Use `# pragma: no cover`

Sparingly. Valid cases:
- Abstract method bodies that should never be called directly
- Platform-specific branches that can't be tested in CI
- `if __name__ == "__main__":` blocks

Invalid cases (do NOT exclude):
- Error handlers — test them
- Edge cases — test them
- "Hard to test" code — refactor it to be testable

---

## 10. Commands Quick Reference

### Backend

| Command | Purpose |
|---------|---------|
| `pytest` | Run all tests |
| `pytest backend/tests/test_api/` | Run API tests only |
| `pytest backend/tests/test_services/` | Run service tests only |
| `pytest backend/tests/test_llm/` | Run LLM tests only |
| `pytest -x` | Stop on first failure |
| `pytest -k "test_create_clone"` | Run tests matching pattern |
| `pytest --cov=app --cov-report=term-missing` | Run with coverage report |
| `pytest --cov=app --cov-report=html` | Generate HTML coverage report |
| `pytest -v` | Verbose output (show each test name) |

### Frontend

| Command | Purpose |
|---------|---------|
| `pnpm test` | Run all unit/component tests |
| `pnpm test -- --watch` | Run in watch mode |
| `pnpm test -- --coverage` | Run with coverage report |
| `pnpm test -- CloneCard` | Run tests matching filename |
| `pnpm test -- --reporter=verbose` | Verbose output |
| `pnpm exec playwright test` | Run E2E tests |
| `pnpm exec playwright test --ui` | Run E2E with interactive UI |
| `pnpm exec playwright test --debug` | Debug E2E tests step-by-step |
| `pnpm exec playwright show-report` | Open last E2E HTML report |

### CI Pipeline (Both Stacks)

```bash
# Backend
cd backend
pytest --cov=app --cov-report=term-missing --cov-fail-under=90

# Frontend — unit/component
cd frontend
pnpm test -- --coverage --reporter=verbose

# Frontend — E2E
cd frontend
pnpm exec playwright install --with-deps
pnpm exec playwright test
```
