const DEFAULT_MCP_ENDPOINT = "https://mcp.brightdata.com/mcp";
export const BRIGHTDATA_MCP_PROTOCOL_VERSION = "2025-06-18";

function runtimeEnv() {
  return typeof process !== "undefined" && process?.env ? process.env : {};
}

function requireFetch(fetchImpl) {
  if (fetchImpl) return fetchImpl;
  if (typeof fetch !== "undefined") return fetch;
  throw new Error("A fetch implementation is required.");
}

function requireHttpUrl(value = "", errorMessage = "An HTTP URL is required.") {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    // handled by shared error below
  }
  throw new Error(errorMessage);
}

function brightDataToken(env = runtimeEnv(), options = {}) {
  return String(options.apiToken || env.BRIGHTDATA_API_TOKEN || env.BRIGHT_DATA_API_TOKEN || env.BRIGHTDATA_TOKEN || "").trim();
}

export function buildBrightDataMcpEndpoint(env = runtimeEnv(), options = {}) {
  const configuredEndpoint = String(options.endpoint || env.BRIGHTDATA_MCP_URL || "").trim();
  if (configuredEndpoint) return requireHttpUrl(configuredEndpoint, "A valid Bright Data MCP endpoint URL is required.");

  const token = brightDataToken(env, options);
  if (!token) throw new Error("Bright Data API token is required for MCP live collection.");

  const endpoint = new URL(DEFAULT_MCP_ENDPOINT);
  endpoint.searchParams.set("token", token);
  return endpoint.toString();
}

function redact(value = "", secrets = []) {
  let text = String(value || "");
  for (const secret of secrets.filter(Boolean)) {
    text = text.split(secret).join("[redacted]");
  }
  return text
    .replace(/([?&]token=)[^&\s"']+/gi, "$1[redacted]")
    .replace(/\bBearer\s+[a-z0-9._+=/-]+/gi, "Bearer [redacted]")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseMcpResponse(text = "", contentType = "") {
  const trimmed = String(text || "").trim();
  if (!trimmed) return {};
  if (contentType.includes("application/json") || trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);

  const jsonLines = trimmed
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean)
    .filter((line) => line !== "[DONE]");

  if (!jsonLines.length) return {};
  return JSON.parse(jsonLines.at(-1));
}

function contentTypeFrom(headers) {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get("content-type") || "";
  return headers["content-type"] || headers["Content-Type"] || "";
}

export function extractMcpText(result = {}) {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";

  const content = result.content || result.structuredContent?.content;
  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.type === "text" && typeof item.text === "string") return item.text;
        if (typeof item?.text === "string") return item.text;
        if (typeof item?.markdown === "string") return item.markdown;
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
    if (text) return text;
  }

  for (const key of ["text", "markdown", "html", "data"]) {
    if (typeof result[key] === "string") return result[key];
  }

  return JSON.stringify(result);
}

export function createBrightDataMcpClient(options = {}) {
  const env = options.env || runtimeEnv();
  const endpoint = buildBrightDataMcpEndpoint(env, options);
  const fetchImpl = requireFetch(options.fetchImpl);
  const protocolVersion = options.protocolVersion || BRIGHTDATA_MCP_PROTOCOL_VERSION;
  const secrets = [brightDataToken(env, options), endpoint.includes("token=") ? new URL(endpoint).searchParams.get("token") : ""];
  let nextId = 1;
  let initializePromise;

  async function post(payload, label) {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": protocolVersion
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    if (!response.ok) {
      const preview = redact(text, secrets).slice(0, 300);
      throw new Error(`${label} failed with HTTP ${response.status}: ${preview}`);
    }

    const parsed = parseMcpResponse(text, contentTypeFrom(response.headers));
    if (parsed?.error) {
      const message = redact(parsed.error.message || JSON.stringify(parsed.error), secrets);
      throw new Error(`${label} failed: ${message}`);
    }
    return parsed;
  }

  async function initialize() {
    if (!initializePromise) {
      initializePromise = (async () => {
        const initialized = await post(
          {
            jsonrpc: "2.0",
            id: nextId++,
            method: "initialize",
            params: {
              protocolVersion,
              capabilities: {},
              clientInfo: {
                name: options.clientName || "proofrank",
                version: options.clientVersion || "0.1.0"
              }
            }
          },
          "initialize"
        );

        await post(
          {
            jsonrpc: "2.0",
            method: "notifications/initialized"
          },
          "initialized notification"
        ).catch(() => ({}));

        return initialized?.result || {};
      })();
    }
    return initializePromise;
  }

  return {
    endpoint,
    initialize,
    async listTools() {
      await initialize();
      const listed = await post(
        {
          jsonrpc: "2.0",
          id: nextId++,
          method: "tools/list",
          params: {}
        },
        "tools/list"
      );
      return listed?.result?.tools || [];
    },
    async callTool(name, args = {}) {
      await initialize();
      const called = await post(
        {
          jsonrpc: "2.0",
          id: nextId++,
          method: "tools/call",
          params: {
            name,
            arguments: args
          }
        },
        `tools/call:${name}`
      );
      return called?.result || {};
    }
  };
}

export function createBrightDataMcpFetchText(options = {}) {
  const client = options.client || createBrightDataMcpClient(options);
  const toolName = options.toolName || "scrape_as_markdown";

  return async function brightDataMcpFetchText(url) {
    const result = await client.callTool(toolName, {
      url: requireHttpUrl(url, "An HTTP URL is required for MCP live collection.")
    });
    return extractMcpText(result);
  };
}

export function createBrightDataMcpSearch(options = {}) {
  const client = options.client || createBrightDataMcpClient(options);
  const toolName = options.toolName || "search_engine";

  return async function brightDataMcpSearch(query) {
    const result = await client.callTool(toolName, { query: String(query || "").trim() });
    return extractMcpText(result);
  };
}
