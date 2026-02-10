# Git Workflow

This document defines the git workflow for Sona, designed for up to 10 parallel Claude Code agents working simultaneously via git worktrees.

## Overview

- **Single main branch** — all work merges into `main`
- **Short-lived feature branches** — one task = one branch = one PR
- **Squash merge only** — clean, linear history on `main`
- **Parallel agents** — each agent gets a dedicated git worktree

## Branching Strategy

### Branch Naming

```
bd-<task-id>/<short-description>
```

Examples:
```
bd-sona-abc/add-user-auth
bd-sona-xyz/fix-streak-calc
```

### Rules

- Branch from `origin/main` (always fetch first)
- One branch per Beads task — no multi-task branches
- Delete branches after merge (automated via GitHub settings)
- Never commit directly to `main`

### Creating a Branch

```bash
git fetch origin
git checkout -b bd-sona-xxx/short-desc origin/main
```

In a worktree, always branch from `origin/main`, never from a local `main`.

## Commit Standards

### Format

```
[BD-<short-id>] type(scope): description
```

Where `<short-id>` is the task ID without the project prefix (e.g., `sona-abc` becomes `abc`).

### Types

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Build, CI, tooling changes |

### Examples

```
[BD-abc] feat(auth): add JWT token validation
[BD-xyz] fix(streaks): handle timezone edge case in streak calculation
[BD-123] chore(ci): add Python linting to CI pipeline
```

### Rules

- Every commit requires a Beads task ID
- Keep the subject line under 72 characters
- Use imperative mood ("add", not "added" or "adds")

## Pull Request Process

### Creating a PR

```bash
git push -u origin HEAD
gh pr create \
  --title "[BD-<short-id>] type(scope): description" \
  --body "$(cat <<'EOF'
## Beads Task
`<task-id>`

## Summary
- What changed and why

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new behavior
EOF
)"
```

### Merging a PR

Always squash merge. Set the PR title to match commit convention so the squash commit message is correct:

```bash
gh pr merge --squash --auto --delete-branch
```

The PR title becomes the squash commit message automatically (configured via GitHub's "Pull request title and description" default). `--auto` merges once CI passes. `--delete-branch` removes the remote branch after merge.

### PR Rules

- PR title must match `[BD-xxx]` format (enforced by CI)
- One PR per Beads task
- Keep PRs focused — small diffs merge faster and conflict less

## Merge Strategy

### Squash Merge Only

All PRs merge via squash. This gives `main` a clean, linear history where each commit corresponds to exactly one Beads task.

### Staying Current

When your branch falls behind `main`:

```bash
git fetch origin
git rebase origin/main
```

**Never** merge main into your feature branch (`git merge main`). This creates noise in the PR diff and complicates the squash.

### Handling Rebase Conflicts

```bash
git fetch origin
git rebase origin/main
# Resolve conflicts in each file
git add <resolved-files>
git rebase --continue
git push --force-with-lease   # Safe force push — only your branch
```

`--force-with-lease` is safe for feature branches (only you are working on them). **Never** force push to `main`.

## Main Branch Protection

Configure these settings in the GitHub repository UI.

### Settings > General > Pull Requests

- [x] Allow squash merging
- [ ] Allow merge commits (disabled)
- [ ] Allow rebase merging (disabled)
- Default squash message: **Pull request title and description**
- [x] Automatically delete head branches
- [x] Allow auto-merge

### Settings > Branches > Add Rule for `main`

- [x] Require a pull request before merging
  - Required approvals: **0** (agents self-merge)
- [x] Require status checks to pass before merging
  - Required checks: `validate-pr`, `placeholder`
- [x] Require branches to be up to date before merging
- [ ] Require signed commits (not needed)
- [ ] Require linear history (squash merge already ensures this)
- [ ] Include administrators (leave unchecked so owner can emergency push)

## Conflict Prevention

With multiple agents working in parallel, conflict prevention is critical.

### File Ownership Zones

Agents should claim tasks that touch distinct areas of the codebase. Beads dependencies (`bd dep add`) enforce this at the task level — if two tasks touch the same files, make one depend on the other.

### High-Conflict Files

Some files are touched by many tasks:

| File | Protocol |
|------|----------|
| `CLAUDE.md` | Serialize changes — only one task modifies it at a time |
| `pyproject.toml` | Use `bd dep add` to serialize dependency additions |
| Database migrations | Always serialize — never run parallel migrations |
| Shared config files | Serialize via task dependencies |

### When Conflicts Happen

1. `git fetch origin && git rebase origin/main`
2. Resolve conflicts carefully — understand both sides
3. Run tests after resolution
4. If the conflict is complex, coordinate via a new Beads task

### Using Beads for Coordination

```bash
# Task B touches the same file as Task A — make B wait
bd dep add <task-B-id> <task-A-id>
```

This is the primary mechanism for preventing conflicts. When planning work, identify shared files and serialize access.

## Git Worktrees for Parallel Agents

### Why Worktrees?

Git doesn't allow two worktrees to check out the same branch. If 10 agents share one working directory, they'll corrupt each other's state. Each agent gets a dedicated worktree.

### Setup

```bash
# From the main repo
scripts/setup-agent-worktree.sh <N>   # N = 1-10
```

This creates `../sona-agent-N/` with:
- A permanent `agent-N-home` branch (parking branch between tasks)
- Beads redirect so all worktrees share the same task database
- Access to the same `.claude/` configuration

### Agent Workflow

```bash
# 1. Start — fetch latest and find work
git fetch origin
bd ready

# 2. Branch — always from origin/main
bd update <id> --status in_progress --claim
git checkout -b bd-sona-xxx/feature origin/main

# 3. Work — commit, test, push
# ... implement with TDD ...
git push -u origin HEAD

# 4. PR — create, auto-merge, and watch CI
gh pr create --title "[BD-xxx] type(scope): desc" --body "..."
gh pr merge --squash --auto --delete-branch
gh pr checks --watch --fail-fast       # Wait for CI to pass
gh pr view --json state -q .state      # Confirm: must show "MERGED"

# 5. Close task — only after PR merges
bd close <id>
bd sync

# 6. Return home — park on home branch
git checkout agent-N-home

# 7. Clean up — delete local feature branch and fetch latest
git branch -d bd-sona-xxx/feature
git fetch origin --prune                # Get latest main, remove stale remote refs
```

### Home Branch Pattern

Each worktree has a permanent "home" branch (`agent-N-home`). This exists because:
- Git requires each worktree to be on a different branch
- Agents can't all checkout `main`
- The home branch is never pushed or merged — it's just parking

### Shared Beads Database

Beads worktree support (`bd worktree create`) sets up a `.beads/redirect` file so all worktrees read/write to the same task database in the main repo. This means:
- `bd ready` shows the same tasks in all worktrees
- `bd update` and `bd close` work from any worktree
- No task duplication or sync issues

## Agent-Specific Git Rules

### Before Starting Work

```bash
git fetch origin                    # Always fetch first
bd ready                            # Check for available tasks
```

### Push Discipline

- Push after every meaningful commit (don't accumulate local-only work)
- Use `git push -u origin HEAD` for new branches
- If push is rejected (branch behind), rebase and retry:
  ```bash
  git fetch origin
  git rebase origin/main
  git push --force-with-lease
  ```

### Never Do These

- **Never force push to `main`**
- **Never push `agent-N-home` branches** — they're local parking only
- **Never checkout `main` in a worktree** — use `origin/main` for branching
- **Never work on someone else's feature branch** — one agent per branch
- **Never skip CI** (`--no-verify`) — fix the issue instead

### Session Completion

Every agent session must end with work pushed:

```bash
bd close <id>              # or keep in_progress if not done
bd sync
git push                   # All work must be remote
```

## Repository Hygiene

### .gitignore

The `.gitignore` is organized by category:
- **OS**: `.DS_Store`, `Thumbs.db`
- **Python**: `__pycache__/`, `.venv/`, eggs
- **Node**: `node_modules/`
- **SQLite**: `*.db` at root level (`.beads/` manages its own)
- **IDE**: `.vscode/`, `.idea/`
- **Environment**: `.env` files (never commit secrets)
- **Worktrees**: `sona-agent-*/` safety net

### What We Track (intentionally)

- `uv.lock` — reproducible Python builds
- `.python-version` — consistent Python version
- `pnpm-lock.yaml` — reproducible Node builds

### What We Never Commit

- Secrets (`.env`, API keys, credentials)
- Binary files (images, compiled artifacts)
- Generated files (coverage reports, build output)
- Large files (use external storage instead)

### Branch Cleanup

GitHub auto-deletes branches after squash merge. Locally, clean up periodically:

```bash
git fetch --prune                    # Remove stale remote-tracking branches
git branch --merged | grep -v main | xargs git branch -d   # Remove merged local branches
```
