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

### 2. Plan Before Building
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, **STOP and re-plan** — don't push through
- Write specs upfront to reduce ambiguity

### 3. Execute with TDD
1. **Red**: Write a failing test that defines the expected behavior
2. **Green**: Write the minimum code to make it pass
3. **Refactor**: Clean up while tests stay green
4. Commit with task ID: `[BD-<short-id>] feat(scope): description` (where `<short-id>` is the task ID without the project prefix, e.g., `sona-ggg` becomes `ggg`)

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

## Self-Improvement

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules that prevent the same mistake recurring
- Review lessons at session start
