#!/usr/bin/env bash
set -euo pipefail

# Setup a git worktree for a parallel Claude Code agent.
# Usage: scripts/setup-agent-worktree.sh <agent-number>
# Creates ../sona-agent-N/ with a permanent home branch and Beads redirect.

AGENT_NUM="${1:-}"

# --- Validation ---

if [[ -z "$AGENT_NUM" ]]; then
  echo "Usage: scripts/setup-agent-worktree.sh <agent-number>"
  echo "  agent-number: 1-10"
  exit 1
fi

if ! [[ "$AGENT_NUM" =~ ^[0-9]+$ ]] || (( AGENT_NUM < 1 || AGENT_NUM > 10 )); then
  echo "Error: agent number must be 1-10"
  exit 1
fi

# Must run from the main repo root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "Error: not inside a git repository"
  exit 1
}

# Must not already be a worktree
GIT_DIR="$(git rev-parse --git-dir)"
if [[ "$GIT_DIR" == *"/worktrees/"* ]]; then
  echo "Error: run this from the main repo, not from a worktree"
  exit 1
fi

# Check required tools
command -v bd >/dev/null 2>&1 || { echo "Error: bd (beads) not found"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Error: git not found"; exit 1; }

# Check remote exists
git remote get-url origin >/dev/null 2>&1 || {
  echo "Error: no 'origin' remote configured"
  exit 1
}

# --- Setup ---

WORKTREE_PATH="$(dirname "$REPO_ROOT")/sona-agent-${AGENT_NUM}"
BRANCH_NAME="agent-${AGENT_NUM}-home"

# Idempotent: skip if worktree already exists
if [[ -d "$WORKTREE_PATH" ]]; then
  echo "Worktree already exists at $WORKTREE_PATH — skipping."
  echo ""
  echo "To launch an agent in this worktree:"
  echo "  cd $WORKTREE_PATH"
  echo "  BD_ACTOR=agent-${AGENT_NUM} claude"
  exit 0
fi

echo "Creating worktree for agent ${AGENT_NUM}..."

# Fetch latest to ensure we have origin/main
git fetch origin

# Create worktree using Beads (sets up .beads/redirect automatically)
bd worktree create "$WORKTREE_PATH" --branch "$BRANCH_NAME"

echo ""
echo "Worktree created at: $WORKTREE_PATH"
echo "Home branch: $BRANCH_NAME"
echo ""
echo "To launch an agent in this worktree:"
echo "  cd $WORKTREE_PATH"
echo "  BD_ACTOR=agent-${AGENT_NUM} claude"
echo ""
echo "Agent workflow inside the worktree:"
echo "  git fetch origin"
echo "  git checkout -b bd-sona-xxx/feature origin/main   # Branch from latest main"
echo "  # ... work, commit, push, PR ..."
echo "  git checkout $BRANCH_NAME                          # Return home after merge"
