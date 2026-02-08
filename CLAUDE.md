# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sona - new project, not yet scaffolded. Update this file as the codebase develops.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Minimal code, minimal impact. Don't over-engineer.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **TDD Always**: Write failing tests first, then make them pass, then refactor. No exceptions.
- **Prove It Works**: Never mark a task complete without demonstrating correctness — tests pass, logs clean, behavior verified.

## Workflow

### 1. Session Start
```bash
bd ready                    # See unblocked tasks
# Pick lowest-ID available task
bd update <id> --status in_progress --claim
```
Review `tasks/lessons.md` for relevant patterns before starting.

**Parallel agents**: If running in a worktree (see [Parallel Sessions & Worktrees](#parallel-sessions--worktrees)), branch from `origin/main` and return to your home branch between tasks.

### 2. Plan Before Building
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, **STOP and re-plan** — don't push through
- Write specs upfront to reduce ambiguity

### 3. Execute with TDD
1. **Red**: Write a failing test that defines the expected behavior
2. **Green**: Write the minimum code to make it pass
3. **Refactor**: Clean up while tests stay green
4. Commit with task ID: `[BD-<short-id>] feat(scope): description` (where `<short-id>` is the task ID without the project prefix, e.g., `sona-ggg` becomes `ggg`)
5. Push and create PR:
   ```bash
   git push -u origin HEAD
   gh pr create --title "[BD-<short-id>] type(scope): description" --body "..."
   gh pr merge --squash --auto --subject "[BD-<short-id>] type(scope): description"
   ```

For non-trivial changes, pause and ask: *"Is there a more elegant way?"*
Skip this for simple, obvious fixes.

### 4. Subagent Strategy
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution — keeps main context clean
- For complex problems, throw more compute at it via subagents

### 5. Verification Before Done
- Run all tests. Check logs. Diff behavior against main when relevant.
- Ask: *"Would a staff engineer approve this?"*
- Only then: `bd close <id>`

### 6. Continue to Next Task
After completing a task:
```bash
bd ready                    # Check for more unblocked tasks
```
- If tasks are available: pick the lowest-ID, create a feature branch, and implement it
- If no tasks available: you're done — all work is complete
- **Keep working until `bd ready` returns no available tasks**

### 7. Session End (MANDATORY)
```bash
bd close <id>   # or in_progress if not done
bd sync
git pull --rebase && git push
git status                          # Must say "up to date"
```

## Task Management (Beads)

All task tracking lives in Beads — no separate todo files.

### Creating Tasks
```bash
bd create "Imperative, specific title" -p <0-3>
# 0=blocking release  1=must-have v1  2=should-have  3=nice-to-have
bd dep add <child> <parent>         # Child blocked by parent
```

Good: `"Fix streak calculation for timezone edge case"`
Bad: `"Backend stuff"`

### Key Commands
| Command | Purpose |
|---|---|
| `bd ready` | Unblocked tasks ready for work |
| `bd create "Title" -p N` | Create task with priority |
| `bd update <id> --status S` | Update status |
| `bd update <id> --claim` | Claim task (uses BD_ACTOR for attribution) |
| `bd dep add <child> <parent>` | Add dependency |
| `bd dep tree <id>` | View dependency graph |
| `bd show <id>` | Full task details |
| `bd sync` | Force sync to git |
| `bd dep cycles` | Debug stuck tasks |

**NEVER** use `bd edit` — it opens an interactive editor and breaks AI agents.

## Autonomous Bug Fixing

When given a bug report or enhancement request:

1. Create a Beads task: `bd create "Fix: <description>" -p 1`
2. Claim it: `bd update <id> --claim`
3. Create feature branch: `git checkout -b bd-<id>/<short-desc>`
4. Implement with TDD (failing test first)
5. Commit with task ID: `git commit -m "[BD-<short-id>] fix: description"` (strip project prefix from ID, e.g., `sona-ggg` → `ggg`)
6. PR with squash merge — set the PR title to match commit convention so the squash commit message is correct: `[BD-<short-id>] type(scope): description`. Use `gh pr merge --squash --subject "[BD-<short-id>] type(scope): description"` to enforce this.
7. Close task: `bd close <id>`

**Every commit requires a Beads task ID.** This keeps Beads as the single source of truth for all changes.

When pointing at logs, errors, or failing tests: just fix them. Zero hand-holding required from the user.

## Parallel Sessions & Worktrees

When multiple agents work simultaneously, each runs in a dedicated git worktree to avoid git state corruption.

### Setup

```bash
# From the main repo root
scripts/setup-agent-worktree.sh <N>    # Creates ../sona-agent-N/
cd ../sona-agent-N/
BD_ACTOR=agent-N claude                # Launch agent with identity
```

### Worktree Rules

- **Branch from `origin/main`**, never local `main`:
  ```bash
  git fetch origin
  git checkout -b bd-sona-xxx/feature origin/main
  ```
- **Return to home branch** between tasks: `git checkout agent-N-home`
- **Never push home branches** — they're local parking only
- **All worktrees share Beads** — `bd ready` shows the same tasks everywhere

### PR Workflow in Worktrees

```bash
git push -u origin HEAD
gh pr create --title "[BD-xxx] type(scope): desc" --body "..."
gh pr merge --squash --auto --subject "[BD-xxx] type(scope): desc"
git checkout agent-N-home              # Park after merge
git branch -d bd-sona-xxx/feature      # Clean up local branch
```

See `docs/git-workflow.md` for the full workflow reference.

## Worktree Awareness

Detect if you're in a worktree:
```bash
git rev-parse --git-dir    # Contains /worktrees/ if in a worktree
```

Key rules when in a worktree:
- **Never `git checkout main`** — use `origin/main` for branching instead
- **Home branch is parking only** — never commit to it, never push it
- **Use `git fetch origin`** to get the latest `main` — don't `git pull`
- **Feature branches are ephemeral** — delete after merge

## When to Consult Other Docs

| Document | When |
|----------|------|
| `docs/git-workflow.md` | Branching, commits, PRs, conflict prevention, worktrees |
| `docs/plan.md` | Architecture and product decisions |
| `docs/tech-stack.md` | Technology choices and rationale |
| `tasks/lessons.md` | Patterns learned from past mistakes |

## Project Structure Quick Reference

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

## Dev Environment

| Command | Purpose |
|---------|---------|
| `make install` | Install all backend + frontend dependencies |
| `make dev-backend` | Start FastAPI on http://localhost:8000 |
| `make dev-frontend` | Start Vite on http://localhost:5173 |
| `make test` | Run all backend + frontend tests |
| `make lint` | Run all linters and type checkers |
| `make format` | Auto-fix formatting (ruff + prettier) |

- Backend health check: `GET http://localhost:8000/api/health`
- Frontend proxies `/api` to backend — use http://localhost:5173/api/health to test proxy
- See `docs/dev-setup.md` for full setup guide and troubleshooting

## Self-Improvement

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules that prevent the same mistake recurring
- Review lessons at session start
