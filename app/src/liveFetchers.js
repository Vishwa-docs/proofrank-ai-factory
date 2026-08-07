const BRIGHTDATA_REQUEST_URL = "https://api.brightdata.com/request";
const DEFAULT_UNLOCKER_ZONE = "mcp_unlocker";

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

export function createLiveFetchTextFromEnv(env = runtimeEnv(), options = {}) {
  const apiToken = env.BRIGHTDATA_API_TOKEN || env.BRIGHT_DATA_API_TOKEN || env.BRIGHTDATA_TOKEN;
  const zone = env.BRIGHTDATA_UNLOCKER_ZONE || env.BRIGHTDATA_ZONE || DEFAULT_UNLOCKER_ZONE;

  if (apiToken) {
    return createBrightDataFetchText({
      apiToken,
      zone,
      fetchImpl: options.fetchImpl
    });
  }

  return createDirectFetchText({ fetchImpl: options.fetchImpl });
}
