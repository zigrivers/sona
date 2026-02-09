.PHONY: install dev-backend dev-frontend test test-backend test-frontend test-e2e test-e2e-ui lint format clean

install:
	@command -v uv >/dev/null 2>&1 || { echo "Error: uv not found. Install with: brew install uv"; exit 1; }
	@command -v pnpm >/dev/null 2>&1 || { echo "Error: pnpm not found. Install with: brew install pnpm"; exit 1; }
	cd backend && uv sync --all-extras
	cd frontend && pnpm install
	cd frontend && pnpm exec playwright install chromium

dev-backend:
	cd backend && uv run uvicorn app.main:app --reload --port 8000

dev-frontend:
	cd frontend && pnpm dev

test: test-backend test-frontend

test-backend:
	cd backend && uv run pytest

test-frontend:
	cd frontend && pnpm test

test-e2e:
	cd frontend && pnpm test:e2e

test-e2e-ui:
	cd frontend && pnpm exec playwright test --ui

lint:
	cd backend && uv run ruff check .
	cd backend && uv run ruff format --check .
	cd backend && uv run pyright
	cd frontend && pnpm lint
	cd frontend && pnpm format:check
	cd frontend && pnpm typecheck

format:
	cd backend && uv run ruff check --fix .
	cd backend && uv run ruff format .
	cd frontend && pnpm format

clean:
	rm -rf backend/.venv
	rm -rf frontend/node_modules
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
