#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_files=(
  "app/index.html"
  "LICENSE"
  "app/styles.css"
  "app/src/main.js"
  "app/src/fixtures.js"
  "app/src/scoring.js"
  "app/src/parser.js"
  "app/src/exporters.js"
  "app/src/claims.js"
  "app/src/tribunal.js"
  "app/src/brightDataAdapter.js"
  "app/src/liveFetchers.js"
  "app/src/liveReviewer.js"
  "app/src/liveReviewApi.js"
  "scripts/env-loader.mjs"
  "scripts/brightdata-mcp-smoke.mjs"
  "scripts/live-review-server.mjs"
  "scripts/live-review-smoke.mjs"
  "submission/native-builder-prompt.md"
  "submission/bright-data-setup.md"
  "submission/project-description.md"
  "submission/demo-script.md"
  "submission/pitch-deck.md"
  "submission/checklist.md"
)

for file in "${required_files[@]}"; do
  test -f "$file"
done

npm run test

if [[ -z "${PORT:-}" ]]; then
  for candidate in 4173 4283 4383 4483 4583 4683 4783 4883 4983 5083 5183; do
    if python3 - "$candidate" <<'PY'
import socket
import sys

sock = socket.socket()
try:
    sock.bind(("127.0.0.1", int(sys.argv[1])))
except OSError:
    sys.exit(1)
finally:
    sock.close()
PY
    then
      PORT="$candidate"
      break
    fi
  done
fi

test -n "${PORT:-}"
LOG_FILE="/tmp/proofrank-http.log"
python3 -m http.server "$PORT" --directory app > "$LOG_FILE" 2>&1 &
server_pid=$!

cleanup() {
  kill "$server_pid" >/dev/null 2>&1 || true
}
trap cleanup EXIT

sleep 1
curl -s "http://127.0.0.1:${PORT}/" | grep -q "ProofRank"

echo "verification passed"
