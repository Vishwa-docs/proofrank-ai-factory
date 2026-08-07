import assert from "node:assert/strict";
import {
  buildBrightDataMcpEndpoint,
  createBrightDataMcpClient,
  createBrightDataMcpDiscover,
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
  buildBrightDataMcpEndpoint({
    BRIGHTDATA_API_TOKEN: "test-token",
    BRIGHTDATA_MCP_TOOLS: "search_engine,scrape_as_markdown,discover"
  }),
  "https://mcp.brightdata.com/mcp?token=test-token&tools=search_engine,scrape_as_markdown,discover"
);
assert.equal(
  buildBrightDataMcpEndpoint({
    BRIGHTDATA_API_TOKEN: "test-token",
    BRIGHTDATA_MCP_GROUPS: "research",
    BRIGHTDATA_MCP_PRO: "1"
  }),
  "https://mcp.brightdata.com/mcp?token=test-token&groups=research&pro=1"
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
function responseHeaders(values = {}) {
  const normalized = new Map(Object.entries(values).map(([key, value]) => [key.toLowerCase(), value]));
  return {
    get: (key) => normalized.get(String(key).toLowerCase()) || ""
  };
}

const fakeFetch = async (_endpoint, options) => {
  const payload = JSON.parse(options.body);
  calls.push({
    payload,
    headers: options.headers
  });

  if (payload.method === "initialize") {
    return {
      ok: true,
      status: 200,
      headers: responseHeaders({
        "content-type": "application/json",
        "mcp-session-id": "session-test-123"
      }),
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
      headers: responseHeaders({ "content-type": "application/json" }),
      text: async () => "{}"
    };
  }

  if (payload.method === "tools/list") {
    return {
      ok: true,
      status: 200,
      headers: responseHeaders({ "content-type": "application/json" }),
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
      headers: responseHeaders({ "content-type": "text/event-stream" }),
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
      headers: responseHeaders({ "content-type": "application/json" }),
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

  if (payload.method === "tools/call" && payload.params.name === "discover") {
    return {
      ok: true,
      status: 200,
      headers: responseHeaders({ "content-type": "application/json" }),
      text: async () =>
        JSON.stringify({
          jsonrpc: "2.0",
          id: payload.id,
          result: {
            content: [
              {
                type: "text",
                text: `Discover ${payload.params.arguments.query} / ${payload.params.arguments.intent} / ${payload.params.arguments.num_results}`
              }
            ]
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

const discoverText = createBrightDataMcpDiscover({ client });
assert.equal(
  await discoverText("proofrank bright data", {
    intent: "Find public prior art",
    numResults: 3,
    includeContent: true
  }),
  "Discover proofrank bright data / Find public prior art / 3"
);

assert.equal(calls.filter((call) => call.payload.method === "initialize").length, 1);
assert.equal(calls.find((call) => call.payload.method === "initialize").headers["Mcp-Session-Id"], undefined);
assert.equal(calls.filter((call) => call.payload.method === "notifications/initialized").length, 1);
assert.equal(calls.find((call) => call.payload.method === "notifications/initialized").headers["Mcp-Session-Id"], "session-test-123");
assert.ok(calls.some((call) => call.payload.method === "tools/list"));
assert.equal(calls.find((call) => call.payload.method === "tools/list").headers["Mcp-Session-Id"], "session-test-123");
assert.ok(calls.some((call) => call.payload.method === "tools/call" && call.payload.params.name === "scrape_as_markdown"));
assert.ok(calls.some((call) => call.payload.method === "tools/call" && call.payload.params.name === "search_engine"));
assert.ok(
  calls.some(
    (call) =>
      call.payload.method === "tools/call" &&
      call.payload.params.name === "discover" &&
      call.payload.params.arguments.intent === "Find public prior art" &&
      call.payload.params.arguments.num_results === 3 &&
      call.payload.params.arguments.include_content === true
  )
);

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
