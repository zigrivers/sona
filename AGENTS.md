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

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

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

