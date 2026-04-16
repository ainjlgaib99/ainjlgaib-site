#!/usr/bin/env bash
# PostToolUse hook: runs npm test after any Edit/Write to a file inside src/
# Non-blocking — always exits 0. Emits a systemMessage on test failure.

set -euo pipefail

PROJECT_DIR="/home/user/ainjlgaib-site"

input=$(cat)
file_path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')

# Only act when the edited file lives inside src/
[[ -z "$file_path" || "$file_path" != */src/* ]] && exit 0

test_exit=0
test_output=$(cd "$PROJECT_DIR" && npm test 2>&1) || test_exit=$?

if [[ $test_exit -ne 0 ]]; then
  summary=$(printf '%s' "$test_output" | tail -30)
  jq -n --arg msg "Tests FAILED after editing ${file_path}. Fix before continuing.\n\n${summary}" \
    '{"systemMessage": $msg}'
fi

exit 0
