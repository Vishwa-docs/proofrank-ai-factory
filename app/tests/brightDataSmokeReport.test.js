import assert from "node:assert/strict";
import { buildMcpSmokeFailureReport, buildMcpSmokeSuccessReport } from "../src/brightDataSmokeReport.js";

const tools = [
  { name: "search_engine" },
  { name: "scrape_as_markdown" },
  { name: "discover" },
  { name: "extra_tool" }
];

const success = buildMcpSmokeSuccessReport(
  {
    serverInfo: {
      name: "brightdata-mcp"
    },
    protocolVersion: "2025-06-18"
  },
  tools
);

assert.equal(success.ok, true);
assert.equal(success.server, "brightdata-mcp");
assert.equal(success.baseToolsPresent, true);
assert.deepEqual(success.sampleTools, ["search_engine", "scrape_as_markdown", "discover", "extra_tool"]);

const uuidToken = "a003bd38-893d-4fbe-823e-b5ded86ee98a";
const failure = buildMcpSmokeFailureReport(new Error(`initialize failed with HTTP 401: token=${uuidToken}`), {
  BRIGHTDATA_API_TOKEN: uuidToken
});

assert.equal(failure.ok, false);
assert.equal(failure.reason, "mcp_check_failed");
assert.equal(failure.httpStatus, 401);
assert.equal(failure.baseToolsPresent, false);
assert.equal(failure.tokenShape.looksLikeUuid, true);
assert.equal(failure.error.includes(uuidToken), false);
assert.match(failure.error, /\[redacted\]/);
assert.match(failure.nextAction, /Replace BRIGHTDATA_API_TOKEN/);

const missingToken = buildMcpSmokeFailureReport(new Error("BRIGHTDATA_API_TOKEN is required"), {});
assert.equal(missingToken.reason, "missing_token");
assert.equal(missingToken.tokenShape.missing, true);
assert.match(missingToken.nextAction, /Set BRIGHTDATA_API_TOKEN/);

console.log("Bright Data smoke report tests passed");
