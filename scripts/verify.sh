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
  "app/src/finalReceipt.js"
  "app/src/claims.js"
  "app/src/tribunal.js"
  "app/src/originality.js"
  "app/src/readiness.js"
  "app/src/finalReadinessAudit.js"
  "app/src/brightDataAdapter.js"
  "app/src/brightDataMcpClient.js"
  "app/src/brightDataSmokeReport.js"
  "app/src/liveFetchers.js"
  "app/src/liveReviewer.js"
  "app/src/liveEventReviewer.js"
  "app/src/liveReviewApi.js"
  "scripts/env-loader.mjs"
  "scripts/brightdata-auth-check.mjs"
  "scripts/brightdata-mcp-smoke.mjs"
  "scripts/live-review-server.mjs"
  "scripts/live-review-smoke.mjs"
  "scripts/live-event-smoke.mjs"
  "scripts/capture-demo-assets.mjs"
  "scripts/workflow-proof.mjs"
  "scripts/final-readiness-audit.mjs"
  "scripts/final-brightdata-receipt.mjs"
  "railway.json"
  "app/tests/brightDataMcpClient.test.js"
  "app/tests/brightDataSmokeReport.test.js"
  "app/tests/readiness.test.js"
  "app/tests/finalReadinessAudit.test.js"
  "app/tests/finalReceipt.test.js"
  "submission/native-builder-prompt.md"
  "submission/bright-data-setup.md"
  "submission/project-description.md"
  "submission/deploy-live-api.md"
  "submission/demo-script.md"
  "submission/pitch-deck.md"
  "submission/submission-copy.md"
  "submission/checklist.md"
  "submission/operator-handoff.md"
  "submission/final-readiness-audit.json"
  "submission/final-brightdata-receipt.json"
  "submission/native-builder-render-check.json"
  "submission/workflow-proof.json"
  "submission/proofrank-demo.mp4"
  "submission/proofrank-pitch-deck.pptx"
  "submission/demo-assets/native-builder-desktop.png"
  "submission/demo-assets/native-builder-mobile-320.png"
)

for file in "${required_files[@]}"; do
  test -f "$file"
done

npm run test

node --input-type=module - <<'JS'
import { readFileSync } from "node:fs";

function parseJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const readiness = parseJson("submission/final-readiness-audit.json");
if (!Array.isArray(readiness.gates) || !readiness.gates.some((gate) => gate.id === "lablab-submission")) {
  throw new Error("final-readiness-audit.json must include the lablab-submission gate");
}

const receipt = parseJson("submission/final-brightdata-receipt.json");
if (receipt.readiness?.proofPackageReady !== true) {
  throw new Error("final-brightdata-receipt.json must mark proofPackageReady true");
}
if (receipt.readiness?.canSubmit === true && receipt.readiness?.lablabSubmissionComplete !== true) {
  throw new Error("final-brightdata-receipt.json must not mark canSubmit true before lablab submission");
}
if (receipt.finalBrightDataGate?.ok !== true) {
  throw new Error("final-brightdata-receipt.json must include a passing finalBrightDataGate");
}

const workflow = parseJson("submission/workflow-proof.json");
if (workflow.ok !== true || !Array.isArray(workflow.exportedFiles) || workflow.exportedFiles.length < 2) {
  throw new Error("workflow-proof.json must show a successful exported workflow");
}

const nativeRender = parseJson("submission/native-builder-render-check.json");
if (nativeRender.ok !== true || !Array.isArray(nativeRender.viewports) || nativeRender.viewports.length < 2) {
  throw new Error("native-builder-render-check.json must show desktop and mobile public render checks");
}
for (const viewport of nativeRender.viewports) {
  if (viewport.horizontalOverflow || viewport.forbiddenInViewport?.length) {
    throw new Error(`native.builder render check failed for ${viewport.name}`);
  }
}
JS

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
