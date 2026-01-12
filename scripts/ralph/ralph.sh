#!/bin/bash
# Ralph runner script
# Usage: ./scripts/ralph/ralph.sh [max_iterations]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

MAX_ITERATIONS="${1:-10}"

echo "🤖 Starting Ralph..."
echo "   Working directory: $REPO_ROOT"
echo "   Max iterations: $MAX_ITERATIONS"

npx tsx "$SCRIPT_DIR/ralph.ts" "$MAX_ITERATIONS"
