# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until your PR is merged.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Push and create PR**:
   ```bash
   git push -u origin HEAD               # Push your feature branch (never push to main)
   gh pr create --title "[BD-xxx] type(scope): desc" --body "..."
   gh pr merge --squash --auto --subject "[BD-xxx] type(scope): desc"
   ```
4. **Watch CI until it passes**:
   ```bash
   gh pr checks --watch --fail-fast       # Block until CI passes or fails
   ```
   If checks fail: fix locally, commit, push, re-run `gh pr checks --watch --fail-fast`.
5. **Verify PR merged**:
   ```bash
   gh pr view --json state -q .state      # Must show "MERGED"
   ```
6. **Close task and sync**: `bd close <id>` then `bd sync` — only AFTER merge is confirmed
7. **Clean up** — these steps are MANDATORY:
   ```bash
   git checkout agent-N-home                # Worktree: park on home branch
   git branch -d bd-<task-id>/<short-desc>  # Delete local feature branch
   git fetch origin                         # Get latest main for next task
   ```
8. **Verify** - No uncommitted changes, no unpushed feature branches
9. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until the PR is **merged** — not just created
- NEVER `bd close` a task until `gh pr view --json state -q .state` shows `MERGED`
- NEVER push directly to main — all changes go through PRs with squash merge
- NEVER stop before pushing — that leaves work stranded locally
- NEVER say "ready to push when you are" — YOU must push
- If push fails, resolve and retry until it succeeds
- If CI fails on the PR, fix and push — do NOT abandon the PR

## Worktree Agents

When running in a git worktree (parallel agent mode):

### Identity
- **Verify `BD_ACTOR` is set** — this identifies your work in Beads
- Launch with: `BD_ACTOR=agent-N claude`

### Branching
- **Always branch from `origin/main`**: `git checkout -b bd-sona-xxx/feature origin/main`
- **Never checkout `main`** — it's checked out by the main repo
- **Return to home branch** after each task: `git checkout agent-N-home`

### Shared Beads
- All worktrees share the same Beads database via `.beads/redirect`
- `bd ready`, `bd update`, `bd close` work identically in all worktrees
- Claim tasks with `bd update <id> --claim` to prevent other agents taking them

### Conflict Avoidance
- Pick tasks that touch different files from other active agents
- Use `bd dep add <child> <parent>` to serialize tasks that share files
- If you hit a merge conflict, rebase: `git fetch origin && git rebase origin/main`
- **Never force push to `main`** — only `--force-with-lease` on your feature branch

