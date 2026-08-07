import assert from "node:assert/strict";
import {
  buildBrightDataRequest,
  createBrightDataFetchText,
  createDirectFetchText,
  createLiveCollectorsFromEnv,
  createLiveFetchTextFromEnv,
  describeLiveFetchMode
} from "../src/liveFetchers.js";

const request = buildBrightDataRequest("https://example.com/project", {
  apiToken: "test-token",
  zone: "custom-zone"
});

assert.equal(request.url, "https://api.brightdata.com/request");
assert.equal(request.options.method, "POST");
assert.equal(request.options.headers.Authorization, "Bearer test-token");
assert.equal(request.options.headers["Content-Type"], "application/json");
assert.deepEqual(JSON.parse(request.options.body), {
  zone: "custom-zone",
  url: "https://example.com/project",
  format: "raw"
});

let brightDataCall;
const brightText = createBrightDataFetchText({
  apiToken: "test-token",
  zone: "unblocker",
  fetchImpl: async (url, options) => {
    brightDataCall = { url, options };
    return {
      ok: true,
      status: 200,
      text: async () => "# collected markdown"
    };
  }
});

assert.equal(await brightText("https://example.com/demo"), "# collected markdown");
assert.equal(brightDataCall.url, "https://api.brightdata.com/request");
assert.deepEqual(JSON.parse(brightDataCall.options.body), {
  zone: "unblocker",
  url: "https://example.com/demo",
  format: "raw"
});

const directText = createDirectFetchText({
  fetchImpl: async (url, options) => ({
    ok: true,
    status: 200,
    text: async () => `${url} ${options.headers.Accept}`
  })
});

assert.equal(await directText("https://example.com/readme", { headers: { Accept: "text/plain" } }), "https://example.com/readme text/plain");

const envText = createLiveFetchTextFromEnv(
  {
    BRIGHTDATA_API_TOKEN: "test-token",
    BRIGHTDATA_UNLOCKER_ZONE: "env-zone"
  },
  {
    fetchImpl: async (_url, options) => ({
      ok: true,
      status: 200,
      text: async () => JSON.parse(options.body).zone
    })
  }
);

assert.equal(await envText("https://example.com"), "env-zone");

const mcpCalls = [];
const mcpEnvText = createLiveFetchTextFromEnv(
  {
    BRIGHTDATA_API_TOKEN: "mcp-token",
    PROOFRANK_FETCH_MODE: "mcp"
  },
  {
    fetchImpl: async (url, options) => {
      const payload = JSON.parse(options.body);
      mcpCalls.push({ url, payload });
      if (payload.method === "initialize") {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          text: async () => JSON.stringify({ jsonrpc: "2.0", id: payload.id, result: { protocolVersion: "2025-06-18" } })
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
      if (payload.method === "tools/call") {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          text: async () =>
            JSON.stringify({
              jsonrpc: "2.0",
              id: payload.id,
              result: { content: [{ type: "text", text: `mcp ${payload.params.arguments.url}` }] }
            })
        };
      }
      throw new Error(`Unexpected MCP payload ${JSON.stringify(payload)}`);
    }
  }
);

assert.equal(await mcpEnvText("https://example.com/mcp"), "mcp https://example.com/mcp");
assert.ok(mcpCalls.every((call) => call.url === "https://mcp.brightdata.com/mcp?token=mcp-token"));
assert.ok(mcpCalls.some((call) => call.payload.method === "tools/call" && call.payload.params.name === "scrape_as_markdown"));

const mcpCollectorCalls = [];
const mcpCollectors = createLiveCollectorsFromEnv(
  {
    BRIGHTDATA_API_TOKEN: "mcp-token",
    PROOFRANK_FETCH_MODE: "mcp"
  },
  {
    fetchImpl: async (_url, options) => {
      const payload = JSON.parse(options.body);
      mcpCollectorCalls.push(payload);
      if (payload.method === "initialize") {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          text: async () => JSON.stringify({ jsonrpc: "2.0", id: payload.id, result: { protocolVersion: "2025-06-18" } })
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
      if (payload.method === "tools/call") {
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          text: async () =>
            JSON.stringify({
              jsonrpc: "2.0",
              id: payload.id,
              result: { content: [{ type: "text", text: `${payload.params.name}:${payload.params.arguments.url || payload.params.arguments.query}` }] }
            })
        };
      }
      throw new Error(`Unexpected MCP collector payload ${JSON.stringify(payload)}`);
    }
  }
);

assert.equal(mcpCollectors.collectionMode, "bright-data-mcp");
assert.equal(await mcpCollectors.fetchText("https://example.com/a"), "scrape_as_markdown:https://example.com/a");
assert.equal(await mcpCollectors.searchText("proofrank"), "search_engine:proofrank");
assert.equal(mcpCollectorCalls.filter((call) => call.method === "initialize").length, 1);

const directEnvText = createLiveFetchTextFromEnv(
  {
    BRIGHTDATA_API_TOKEN: "test-token",
    PROOFRANK_FETCH_MODE: "direct"
  },
  {
    fetchImpl: async (url) => ({
      ok: true,
      status: 200,
      text: async () => `direct ${url}`
    })
  }
);

assert.equal(await directEnvText("https://example.com/direct"), "direct https://example.com/direct");
assert.equal(describeLiveFetchMode({ BRIGHTDATA_API_TOKEN: "test-token" }), "bright-data-request-api");
assert.equal(describeLiveFetchMode({ BRIGHTDATA_API_TOKEN: "test-token", PROOFRANK_FETCH_MODE: "mcp" }), "bright-data-mcp");
assert.equal(describeLiveFetchMode({ BRIGHTDATA_MCP_URL: "https://mcp.example/mcp?token=token" }), "bright-data-mcp");
assert.equal(describeLiveFetchMode({ BRIGHTDATA_API_TOKEN: "test-token", PROOFRANK_FETCH_MODE: "direct" }), "direct-fetch");
assert.equal(describeLiveFetchMode({}), "direct-fetch");

await assert.rejects(
  () => createBrightDataFetchText({ apiToken: "" })("https://example.com"),
  /Bright Data API token/
);

assert.throws(() => buildBrightDataRequest("file:///tmp/nope", { apiToken: "test-token" }), /HTTP URL/);

console.log("live fetcher tests passed");
