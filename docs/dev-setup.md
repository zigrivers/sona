# Development Setup

## Prerequisites

Install these tools first:

| Tool | Install | Verify |
|------|---------|--------|
| Python 3.12+ | `brew install python@3.12` | `python3 --version` |
| Node.js 22+ | `brew install node` | `node --version` |
| uv | `brew install uv` | `uv --version` |
| pnpm | `brew install pnpm` | `pnpm --version` |

## First-Time Setup

```bash
# 1. Clone the repo
git clone <repo-url> && cd sona

# 2. Copy environment file
cp .env.example .env

# 3. Install all dependencies
make install

# 4. Start the backend (terminal 1)
make dev-backend
# → FastAPI running at http://localhost:8000

# 5. Start the frontend (terminal 2)
make dev-frontend
# → Vite running at http://localhost:5173
```

Open http://localhost:5173 — you should see the Sona heading.

## Daily Development

**Terminal 1 — Backend:**
```bash
make dev-backend
```

**Terminal 2 — Frontend:**
```bash
make dev-frontend
```

**Run tests:**
```bash
make test              # Both backend + frontend
make test-backend      # Backend only
make test-frontend     # Frontend only
```

**Lint & format:**
```bash
make lint              # Check everything
make format            # Auto-fix formatting
```

## Common Tasks

### Add a Python dependency
```bash
cd backend
uv add <package>           # Runtime dependency
uv add --dev <package>     # Dev dependency
```

### Add a Node dependency
```bash
cd frontend
pnpm add <package>           # Runtime dependency
pnpm add -D <package>        # Dev dependency
```

### Create a database migration
```bash
cd backend
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
```

### Reset the database
```bash
rm data/sona.db
make dev-backend      # Auto-recreates on startup
```

## Troubleshooting

### Port already in use
```bash
# Find and kill the process using the port
lsof -ti:8000 | xargs kill -9   # Backend
lsof -ti:5173 | xargs kill -9   # Frontend
```

### Missing API keys
The app starts without API keys — they're only needed when you use LLM features. Add them to `.env`:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=AI...
```

### Dependencies out of sync
```bash
make install    # Re-syncs everything
```

### Prerequisite not found
```bash
# Check what's missing
which python3 uv node pnpm
# Install missing tools via Homebrew
brew install <tool>
```

## For AI Agents

```bash
# Start the backend server
cd backend && uv run uvicorn app.main:app --reload --port 8000

# Verify it's running
curl http://localhost:8000/api/health
# → {"status":"ok"}

# Run all checks
make lint && make test
```
