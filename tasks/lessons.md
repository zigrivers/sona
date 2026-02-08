# Lessons Learned

Patterns and anti-patterns discovered during development.

## Beads CLI

- **Close tasks with `bd close <id>`**, not `bd update <id> --status completed`. The `completed` status value is invalid — `bd close` is the correct command.
