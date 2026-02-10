# CLAUDE.md

Sona is an AI-powered language learning app. Architecture: React/TypeScript frontend (Vite) + Python backend (FastAPI) + PostgreSQL. Monorepo managed with pnpm and Make.

## Critical Rules

1. **Never push to main** — all changes go through PRs with squash merge. Main is protected.
2. **Every commit needs a Beads task ID** — format: `[BD-<short-id>] type(scope): description`
3. **TDD always** — write a failing test first, then make it pass, then refactor. No exceptions.
4. **Keep working** — after finishing a task, run `bd ready` and pick the next one. Stop only when no tasks remain.
5. **Verify before done** — `make lint && make test` must pass before closing any task.
6. **Never push home branches** — worktree home branches are local parking only.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code, minimal impact. Don't over-engineer.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.

## Workflow

### 1. Session Start
```bash
bd ready                    # See unblocked tasks
# Pick lowest-ID available task
bd update <id> --status in_progress --claim
git fetch origin
git checkout -b bd-<task-id>/<short-desc> origin/main
```
Review `tasks/lessons.md` for relevant patterns before starting.

### 2. Plan Before Building
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, **STOP and re-plan** — don't push through
- Write specs upfront to reduce ambiguity

### 3. Implementation Loop
1. **Red**: Write a failing test that defines the expected behavior
2. **Green**: Write the minimum code to make it pass
3. **Refactor**: Clean up while tests stay green
4. **Verify**: `make lint && make test` — all green before committing
5. **Commit**: `git commit -m "[BD-<short-id>] type(scope): description"`
   - `<short-id>` = task ID without project prefix (e.g., `sona-ggg` → `ggg`)
   - Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
6. **Push + PR**:
   ```bash
   git push -u origin HEAD
   gh pr create --title "[BD-<short-id>] type(scope): description" --body "..."
   gh pr merge --squash --auto --subject "[BD-<short-id>] type(scope): description"
   gh pr checks --watch --fail-fast   # Block until CI passes (or fails)
   gh pr view --json state -q .state  # Confirm: must show "MERGED"
   ```
   If checks fail: fix locally, commit, push, and re-run `gh pr checks --watch --fail-fast`.

For non-trivial changes, pause and ask: *"Is there a more elegant way?"*

### 4. Ad-Hoc Fixes
When given a bug report or ad-hoc request: create a Beads task first (`bd create "Fix: <desc>" -p 1 && bd update <id> --claim`), then follow the Implementation Loop above. When pointing at logs, errors, or failing tests: just fix them — zero hand-holding required.

### 5. Subagent Strategy
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution — keeps main context clean
- For complex problems, throw more compute at it via subagents

### 6. Continue to Next Task
After PR merge is confirmed (`gh pr view --json state -q .state` → `MERGED`):
```bash
bd close <id>                               # Close task ONLY after PR merges
git checkout agent-N-home                   # Worktree: return to home branch
git branch -d bd-<task-id>/<short-desc>     # Clean up local feature branch
git fetch origin                            # Get latest main for next branch
bd ready                                    # Check for more unblocked tasks
```
- **Never `bd close` before the PR merges** — if CI fails, the task stays in progress
- If tasks are available: pick the lowest-ID, create a feature branch, and implement it
- If no tasks available: you're done — all work is complete
- **Keep working until `bd ready` returns no available tasks**

### 7. Session End (MANDATORY)
```bash
bd close <id>               # or bd update <id> --status in_progress if not done
bd sync
# Clean up — these steps are MANDATORY, not optional
git checkout agent-N-home                   # Worktree: park on home branch (Main repo: git checkout main && git pull --rebase origin main)
git branch -d bd-<task-id>/<short-desc>     # Delete local feature branch
git fetch origin                            # Get latest main
```
Confirm: no uncommitted changes, no unpushed feature branches, no stale local branches.

## Git Rules

| Rule | Details |
|------|---------|
| **Branch naming** | `bd-<task-id>/<short-desc>` (e.g., `bd-sona-abc/add-login`) |
| **Commit format** | `[BD-<short-id>] type(scope): description` |
| **PR flow** | `git push -u origin HEAD` → `gh pr create` → `gh pr merge --squash --auto` → `gh pr checks --watch --fail-fast` → confirm `MERGED` |
| **Stay current** | `git fetch origin && git rebase origin/main` before pushing |
| **Force push** | Only `--force-with-lease` on feature branches. **Never** force push to main. |

### High-Conflict Files

These files are frequently touched — serialize access via Beads dependencies (`bd dep add`):

| File | Protocol |
|------|----------|
| `CLAUDE.md` | Only one task modifies at a time |
| `pyproject.toml` | Serialize dependency additions |
| Database migrations | Never run parallel migrations |
| Shared config files | Serialize via task dependencies |

Full reference: `docs/git-workflow.md`

## Task Management (Beads)

All task tracking lives in Beads — no separate todo files.

| Command | Purpose |
|---|---|
| `bd ready` | Unblocked tasks ready for work |
| `bd create "Title" -p N` | Create task (0=blocker, 1=must-have, 2=should-have, 3=nice-to-have) |
| `bd update <id> --status S` | Update status |
| `bd update <id> --claim` | Claim task (uses BD_ACTOR for attribution) |
| `bd dep add <child> <parent>` | Add dependency |
| `bd dep tree <id>` | View dependency graph |
| `bd show <id>` | Full task details |
| `bd sync` | Force sync to git |
| `bd dep cycles` | Debug stuck tasks |
| `bd close <id>` | Mark task complete |

**NEVER** use `bd edit` — it opens an interactive editor and breaks AI agents.

## Parallel Sessions & Worktrees

When multiple agents work simultaneously, each runs in a dedicated git worktree.

### Setup
```bash
# From the main repo root
scripts/setup-agent-worktree.sh <N>    # Creates ../sona-agent-N/
cd ../sona-agent-N/
BD_ACTOR=agent-N claude                # Launch agent with identity
```

### Detect Worktree
```bash
git rev-parse --git-dir    # Contains /worktrees/ if in a worktree
```

### Rules
- **Branch from `origin/main`**: `git fetch origin && git checkout -b bd-<task-id>/<short-desc> origin/main`
- **Never `git checkout main`** — it's checked out by the main repo
- **Return to home branch** between tasks: `git checkout agent-N-home`
- **Never push home branches** — local parking only
- **Feature branches are ephemeral** — delete after merge
- **All worktrees share Beads** — `bd ready` shows the same tasks everywhere

## Quick Reference

### Dev Commands

| Command | Purpose |
|---------|---------|
| `make install` | Install all backend + frontend dependencies |
| `make dev-backend` | Start FastAPI on http://localhost:8000 |
| `make dev-frontend` | Start Vite on http://localhost:5173 |
| `make test` | Run all backend + frontend tests |
| `make test-backend` | Run backend tests only |
| `make test-frontend` | Run frontend tests only |
| `make test-e2e` | Run Playwright E2E tests |
| `make test-e2e-ui` | Run E2E tests with Playwright UI |
| `make lint` | Run all linters and type checkers |
| `make format` | Auto-fix formatting (ruff + prettier) |

- Backend health check: `GET http://localhost:8000/api/health`
- Frontend proxies `/api` to backend — use http://localhost:5173/api/health to test proxy
- See `docs/dev-setup.md` for full setup guide and troubleshooting

### Project Structure

- Backend route handlers: `backend/app/api/{domain}.py`
- Backend services: `backend/app/services/{domain}_service.py`
- Backend models: `backend/app/models/{domain}.py`
- Backend schemas: `backend/app/schemas/{domain}.py`
- LLM providers: `backend/app/llm/{provider}.py`
- Frontend feature components: `frontend/src/components/{feature}/`
- Frontend pages: `frontend/src/pages/{feature}/`
- Frontend hooks: `frontend/src/hooks/use-{domain}.ts`
- Shared components: `frontend/src/components/shared/` (only after 2+ features use it)
- Frontend tests: co-located as `{ComponentName}.test.tsx`
- Backend tests: `backend/tests/test_{layer}/test_{domain}.py`
- E2E tests: `frontend/e2e/{flow-name}.spec.ts`
- Migrations: `backend/alembic/versions/` (serialize via Beads deps)

Before creating a new file, check `docs/project-structure.md` for the correct location.

### Design System

- **Only use palette colors** — `bg-primary`, `text-muted-foreground`, never raw values like `bg-indigo-600`
- **Only use scale spacing** — `gap-2`, `p-4`, `space-y-6`, never arbitrary values
- **Follow component patterns** — use shadcn/ui primitives from `@/components/ui/`
- **Use `cn()`** from `@/lib/utils` for class name merging
- **Test dark mode** for every new UI component

| Property | Value |
|----------|-------|
| Primary | Indigo (OKLCH 0.465 0.195 275) |
| Font | Inter Variable |
| Radius | 0.5rem |
| Dark mode | `.dark` class on `<html>`, managed by `@/stores/ui-store` |
| Showcase | `/design-system` route (dev only) |

Reference: `docs/design-system.md` and `frontend/src/styles/globals.css`

### When to Consult Other Docs

| Document | When |
|----------|------|
| `docs/git-workflow.md` | Branching, commits, PRs, conflict prevention, worktrees |
| `docs/plan.md` | Architecture and product decisions |
| `docs/tech-stack.md` | Technology choices and rationale |
| `docs/design-system.md` | Colors, typography, components, dark mode |
| `docs/coding-standards.md` | Code patterns, naming, error handling, API design |
| `docs/tdd-standards.md` | Testing patterns, fixtures, mocking strategy, E2E |
| `docs/project-structure.md` | File placement rules, conflict mitigation |
| `docs/user-stories.md` | Feature acceptance criteria and scope |
| `docs/dev-setup.md` | Environment setup and troubleshooting |
| `tasks/lessons.md` | Patterns learned from past mistakes |

## Error Recovery

| Scenario | Action |
|----------|--------|
| **Tests fail after changes** | Fix them and re-run. Never skip or mark task complete with failures. |
| **Merge conflicts on rebase** | Resolve conflicts, `git rebase --continue`, push with `--force-with-lease`. |
| **Push rejected** | `git fetch origin && git rebase origin/main`, then retry push. |
| **Pre-commit hook fails** | Fix the issue, re-stage, create a **new** commit. Never use `--no-verify`. |
| **`bd ready` returns nothing** | Session complete — inform the user all available work is done. |
| **PR merge conflicts** | Rebase feature branch on `origin/main`, force-push with `--force-with-lease`, let auto-merge retry. |
| **PR checks fail** | Fix locally, commit, push. Run `gh pr checks --watch --fail-fast` to re-monitor. Do NOT `bd close` until PR merges. |
| **Auto-merge stuck** | `gh pr view --json state,mergeStateStatus` to diagnose. If blocked, check `gh pr checks`. If unmergeable, rebase on `origin/main` and `--force-with-lease`. |

## Browser Testing

| Approach | Tool | When |
|----------|------|------|
| **Automated E2E** | `make test-e2e` | Repeatable tests for critical flows, CI |
| **MCP visual verification** | `browser_snapshot` / `browser_take_screenshot` | Dev-time visual checks after implementing UI |

- E2E config: `frontend/playwright.config.ts` | Specs: `frontend/e2e/*.spec.ts` | Page objects: `frontend/e2e/pages/*.ts`
- Follow Page Object Pattern (see `docs/tdd-standards.md`)
- Prefer `browser_snapshot` (accessibility tree, fast) over screenshots. Use screenshots only when visual appearance matters.
- Always `browser_wait_for` before snapshots/screenshots. Always `browser_close` when done.
- Save screenshots to `frontend/e2e/screenshots/` (gitignored): `{page}_{viewport}_{state}.png`

## Self-Improvement

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules that prevent the same mistake recurring
- Review lessons at session start
