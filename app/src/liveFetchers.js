import {
  createBrightDataMcpClient,
  createBrightDataMcpDiscover,
  createBrightDataMcpFetchText,
  createBrightDataMcpSearch
} from "./brightDataMcpClient.js";

const BRIGHTDATA_REQUEST_URL = "https://api.brightdata.com/request";
const DEFAULT_UNLOCKER_ZONE = "mcp_unlocker";
const DEFAULT_MAX_BRIGHTDATA_CALLS = 12;

function runtimeEnv() {
  return typeof process !== "undefined" && process?.env ? process.env : {};
}

function requireHttpUrl(value = "") {
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    // handled by shared error below
  }
  throw new Error("An HTTP URL is required for live collection.");
}

function requireFetch(fetchImpl) {
  if (fetchImpl) return fetchImpl;
  if (typeof fetch !== "undefined") return fetch;
  throw new Error("A fetch implementation is required.");
}

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function numericValue(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function createLiveBudget(env, options = {}) {
  return {
    usedCalls: 0,
    maxCalls: positiveInteger(options.maxBrightDataCalls ?? env.PROOFRANK_MAX_BRIGHTDATA_CALLS, DEFAULT_MAX_BRIGHTDATA_CALLS),
    capUsd: numericValue(options.brightDataCapUsd ?? env.PROOFRANK_BRIGHTDATA_CAP_USD, 0)
  };
}

function withLiveBudget(collector, budget, label) {
  return async function budgetedCollector(...args) {
    if (budget.usedCalls >= budget.maxCalls) {
      const cap = budget.capUsd ? ` under $${budget.capUsd} configured cap` : "";
      throw new Error(`${label} blocked: Bright Data live call budget exceeded (${budget.maxCalls} calls${cap}).`);
    }
    budget.usedCalls += 1;
    return collector(...args);
  };
}

export function buildBrightDataRequest(targetUrl, options = {}) {
  const apiToken = String(options.apiToken || "").trim();
  if (!apiToken) throw new Error("Bright Data API token is required for live collection.");

  return {
    url: BRIGHTDATA_REQUEST_URL,
    options: {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        zone: options.zone || DEFAULT_UNLOCKER_ZONE,
        url: requireHttpUrl(targetUrl),
        format: "raw"
      })
    }
  };
}

export function createDirectFetchText(options = {}) {
  const fetchImpl = requireFetch(options.fetchImpl);

  return async function directFetchText(url, requestOptions = {}) {
    const response = await fetchImpl(requireHttpUrl(url), requestOptions);
    if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`);
    return response.text();
  };
}

export function createBrightDataFetchText(options = {}) {
  const fetchImpl = requireFetch(options.fetchImpl);

  return async function brightDataFetchText(url) {
    const request = buildBrightDataRequest(url, options);
    const response = await fetchImpl(request.url, request.options);
    if (!response.ok) throw new Error(`Bright Data fetch failed ${response.status} for ${url}`);
    return response.text();
  };
}

export function describeLiveFetchMode(env = runtimeEnv()) {
  const apiToken = env.BRIGHTDATA_API_TOKEN || env.BRIGHT_DATA_API_TOKEN || env.BRIGHTDATA_TOKEN;
  const fetchMode = String(env.PROOFRANK_FETCH_MODE || "").toLowerCase();
  if (fetchMode === "mcp" || fetchMode === "bright-data-mcp" || env.BRIGHTDATA_MCP_URL) return "bright-data-mcp";
  return fetchMode !== "direct" && apiToken ? "bright-data-request-api" : "direct-fetch";
}

export function createLiveFetchTextFromEnv(env = runtimeEnv(), options = {}) {
  return createLiveCollectorsFromEnv(env, options).fetchText;
}

export function createLiveCollectorsFromEnv(env = runtimeEnv(), options = {}) {
  const apiToken = env.BRIGHTDATA_API_TOKEN || env.BRIGHT_DATA_API_TOKEN || env.BRIGHTDATA_TOKEN;
  const zone = env.BRIGHTDATA_UNLOCKER_ZONE || env.BRIGHTDATA_ZONE || DEFAULT_UNLOCKER_ZONE;
  const collectionMode = describeLiveFetchMode(env);

  if (collectionMode === "bright-data-mcp") {
    const budget = createLiveBudget(env, options);
    const client = createBrightDataMcpClient({
      apiToken,
      endpoint: env.BRIGHTDATA_MCP_URL,
      env,
      fetchImpl: options.fetchImpl
    });
    return {
      collectionMode,
      budget,
      fetchText: withLiveBudget(createBrightDataMcpFetchText({ client }), budget, "Bright Data MCP fetch"),
      searchText: withLiveBudget(createBrightDataMcpSearch({ client }), budget, "Bright Data MCP search"),
      discoverText: withLiveBudget(createBrightDataMcpDiscover({ client }), budget, "Bright Data MCP discover")
    };
  }

  if (collectionMode === "bright-data-request-api") {
    const budget = createLiveBudget(env, options);
    return {
      collectionMode,
      budget,
      fetchText: withLiveBudget(
        createBrightDataFetchText({
          apiToken,
          zone,
          fetchImpl: options.fetchImpl
        }),
        budget,
        "Bright Data request fetch"
      )
    };
  }

  return {
    collectionMode,
    fetchText: createDirectFetchText({ fetchImpl: options.fetchImpl })
  };
}
