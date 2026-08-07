import { loadLocalEnv } from "./env-loader.mjs";

const MCP_PROTOCOL_VERSION = "2025-06-18";

loadLocalEnv();

const token = process.env.BRIGHTDATA_API_TOKEN || process.env.BRIGHT_DATA_API_TOKEN || process.env.BRIGHTDATA_TOKEN;
if (!token) {
  throw new Error("BRIGHTDATA_API_TOKEN is required for the MCP smoke check.");
}

const endpoint = new URL("https://mcp.brightdata.com/mcp");
endpoint.searchParams.set("token", token);

function parseSseOrJson(text, contentType = "") {
  if (contentType.includes("application/json")) return JSON.parse(text);

  const jsonLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);

  if (!jsonLines.length) return {};
  return JSON.parse(jsonLines.at(-1));
}

async function postMcp(payload, label) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json, text/event-stream",
      "Content-Type": "application/json",
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) {
    const preview = text.replace(token, "[redacted]").replace(/\s+/g, " ").slice(0, 300);
    throw new Error(`${label} failed with HTTP ${response.status}: ${preview}`);
  }

  return parseSseOrJson(text, response.headers.get("content-type") || "");
}

const initialized = await postMcp(
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: MCP_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: "proofrank-smoke",
        version: "0.1.0"
      }
    }
  },
  "initialize"
);

await postMcp(
  {
    jsonrpc: "2.0",
    method: "notifications/initialized"
  },
  "initialized notification"
).catch(() => ({}));

const listed = await postMcp(
  {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {}
  },
  "tools/list"
);

const tools = listed?.result?.tools || [];
console.log(
  JSON.stringify(
    {
      ok: true,
      server: initialized?.result?.serverInfo?.name || "brightdata-mcp",
      protocolVersion: initialized?.result?.protocolVersion || MCP_PROTOCOL_VERSION,
      toolCount: tools.length,
      baseToolsPresent: ["search_engine", "scrape_as_markdown", "discover"].every((name) => tools.some((tool) => tool.name === name)),
      sampleTools: tools.slice(0, 8).map((tool) => tool.name)
    },
    null,
    2
  )
);
