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
  "app/src/originality.js"
  "app/src/readiness.js"
  "app/src/brightDataAdapter.js"
  "app/src/liveFetchers.js"
  "app/src/liveReviewer.js"
  "app/src/liveEventReviewer.js"
  "app/src/liveReviewApi.js"
  "scripts/env-loader.mjs"
  "scripts/brightdata-mcp-smoke.mjs"
  "scripts/live-review-server.mjs"
  "scripts/live-review-smoke.mjs"
  "scripts/live-event-smoke.mjs"
  "scripts/capture-demo-assets.mjs"
  "app/tests/readiness.test.js"
  "submission/native-builder-prompt.md"
  "submission/bright-data-setup.md"
  "submission/project-description.md"
  "submission/demo-script.md"
  "submission/pitch-deck.md"
  "submission/checklist.md"
  "submission/operator-handoff.md"
)

for file in "${required_files[@]}"; do
  test -f "$file"
done

npm run test

LOG_FILE="/tmp/proofrank-http.log"
PORT_FILE="$(mktemp /tmp/proofrank-port.XXXXXX)"
python3 - "$PORT_FILE" > "$LOG_FILE" 2>&1 <<'PY' &
import functools
import http.server
import socketserver
import sys

handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory="app")
with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
    with open(sys.argv[1], "w", encoding="utf-8") as file:
        file.write(str(httpd.server_address[1]))
    httpd.serve_forever()
PY
server_pid=$!

cleanup() {
  kill "$server_pid" >/dev/null 2>&1 || true
  wait "$server_pid" >/dev/null 2>&1 || true
  rm -f "$PORT_FILE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

for _ in {1..50}; do
  if [[ -s "$PORT_FILE" ]]; then
    PORT="$(cat "$PORT_FILE")"
    break
  fi
  sleep 0.1
done

test -n "${PORT:-}"
curl -s "http://127.0.0.1:${PORT}/" | grep -q "ProofRank"

echo "verification passed"
