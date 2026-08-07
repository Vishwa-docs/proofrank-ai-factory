import assert from "node:assert/strict";
import {
  buildBrightDataMcpEndpoint,
  createBrightDataMcpClient,
  createBrightDataMcpFetchText,
  createBrightDataMcpSearch,
  extractMcpText,
  parseMcpResponse
} from "../src/brightDataMcpClient.js";

assert.equal(
  buildBrightDataMcpEndpoint({ BRIGHTDATA_API_TOKEN: "test-token" }),
  "https://mcp.brightdata.com/mcp?token=test-token"
);
assert.equal(
  buildBrightDataMcpEndpoint({ BRIGHTDATA_MCP_URL: "https://mcp.example/mcp?token=already-set" }),
  "https://mcp.example/mcp?token=already-set"
);
assert.throws(() => buildBrightDataMcpEndpoint({}), /API token/);
assert.throws(() => buildBrightDataMcpEndpoint({ BRIGHTDATA_MCP_URL: "file:///tmp/nope" }), /endpoint URL/);

assert.deepEqual(parseMcpResponse('{"result":{"ok":true}}', "application/json"), { result: { ok: true } });
assert.deepEqual(parseMcpResponse('event: message\ndata: {"result":{"ok":true}}\n\n', "text/event-stream"), { result: { ok: true } });
assert.equal(
  extractMcpText({
    content: [
      { type: "text", text: "# One" },
      { type: "text", text: "Two" }
    ]
  }),
  "# One\n\nTwo"
);
assert.equal(extractMcpText({ markdown: "# Markdown" }), "# Markdown");

const calls = [];
const fakeFetch = async (_endpoint, options) => {
  const payload = JSON.parse(options.body);
  calls.push(payload);

  if (payload.method === "initialize") {
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () =>
        JSON.stringify({
          jsonrpc: "2.0",
          id: payload.id,
          result: {
            protocolVersion: "2025-06-18",
            serverInfo: { name: "brightdata-test" }
          }
        })
    };
  }

  if (payload.method === "notifications/initialized") {
    return {
      ok: true,
      status: 202,
      headers: { get: () => "application/json" },
      text: async () => "{}"
    };
  }

  if (payload.method === "tools/list") {
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () =>
        JSON.stringify({
          jsonrpc: "2.0",
          id: payload.id,
          result: {
            tools: [{ name: "search_engine" }, { name: "scrape_as_markdown" }, { name: "discover" }]
          }
        })
    };
  }

  if (payload.method === "tools/call" && payload.params.name === "scrape_as_markdown") {
    return {
      ok: true,
      status: 200,
      headers: { get: () => "text/event-stream" },
      text: async () =>
        `event: message\ndata: ${JSON.stringify({
          jsonrpc: "2.0",
          id: payload.id,
          result: {
            content: [{ type: "text", text: `Collected ${payload.params.arguments.url}` }]
          }
        })}\n\n`
    };
  }

  if (payload.method === "tools/call" && payload.params.name === "search_engine") {
    return {
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      text: async () =>
        JSON.stringify({
          jsonrpc: "2.0",
          id: payload.id,
          result: {
            content: [{ type: "text", text: `Search ${payload.params.arguments.query}` }]
          }
        })
    };
  }

  throw new Error(`Unexpected MCP payload ${JSON.stringify(payload)}`);
};

const client = createBrightDataMcpClient({
  env: { BRIGHTDATA_API_TOKEN: "test-token" },
  fetchImpl: fakeFetch,
  clientName: "proofrank-test"
});

const tools = await client.listTools();
assert.deepEqual(
  tools.map((tool) => tool.name),
  ["search_engine", "scrape_as_markdown", "discover"]
);

const fetchText = createBrightDataMcpFetchText({ client });
assert.equal(await fetchText("https://example.com/demo"), "Collected https://example.com/demo");

const searchText = createBrightDataMcpSearch({ client });
assert.equal(await searchText("proofrank bright data"), "Search proofrank bright data");

assert.equal(calls.filter((call) => call.method === "initialize").length, 1);
assert.equal(calls.filter((call) => call.method === "notifications/initialized").length, 1);
assert.ok(calls.some((call) => call.method === "tools/list"));
assert.ok(calls.some((call) => call.method === "tools/call" && call.params.name === "scrape_as_markdown"));
assert.ok(calls.some((call) => call.method === "tools/call" && call.params.name === "search_engine"));

const failingClient = createBrightDataMcpClient({
  env: { BRIGHTDATA_API_TOKEN: "super-secret-token" },
  fetchImpl: async () => ({
    ok: false,
    status: 401,
    headers: { get: () => "text/plain" },
    text: async () => "token=super-secret-token Bearer super-secret-token rejected"
  })
});

await assert.rejects(() => failingClient.listTools(), (error) => {
  assert.match(error.message, /HTTP 401/);
  assert.doesNotMatch(error.message, /super-secret-token/);
  assert.match(error.message, /\[redacted\]/);
  return true;
});

console.log("Bright Data MCP client tests passed");
