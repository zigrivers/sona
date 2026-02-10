# Lessons Learned

Patterns and anti-patterns discovered during development.

## Beads CLI

- **Close tasks with `bd close <id>`**, not `bd update <id> --status completed`. The `completed` status value is invalid — `bd close` is the correct command.

## PR Workflow

- **Always watch CI after setting auto-merge**: `gh pr checks --watch --fail-fast` blocks until CI resolves. Without this, you won't know if the PR failed.
- **Never `bd close` before the PR merges**: verify with `gh pr view --json state -q .state` → `MERGED`. If you close the task before merge and CI fails, the task is orphaned.
