import { handleLiveReviewRequest } from "../app/src/liveReviewApi.js";
import { createDirectFetchText, createLiveCollectorsFromEnv } from "../app/src/liveFetchers.js";

const BODY_LIMIT_BYTES = 1_000_000;

function runtimeEnv() {
  return typeof process !== "undefined" && process?.env ? process.env : {};
}

function readStreamBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding?.("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > BODY_LIMIT_BYTES) {
        reject(new Error("Request body too large."));
        request.destroy?.();
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function requestBody(request) {
  if (request.body !== undefined) return request.body;
  if (typeof request.on === "function") return readStreamBody(request);
  return "";
}

function createOptionsFromEnv(env = runtimeEnv(), options = {}) {
  const liveCollectors = options.liveCollectors || createLiveCollectorsFromEnv(env, options);
  const collectorOptions = {
    fetchText: liveCollectors.fetchText,
    metadataFetchText: createDirectFetchText(),
    searchText: liveCollectors.searchText,
    discoverText: liveCollectors.discoverText,
    collectionMode: liveCollectors.collectionMode,
    signingSecret: options.signingSecret ?? env.PROOFRANK_RECEIPT_SIGNING_SECRET,
    ...(options.collectorOptions || {})
  };

  return {
    ...options,
    allowedOrigins: options.allowedOrigins ?? env.PROOFRANK_ALLOWED_ORIGINS,
    allowedHosts: options.allowedHosts ?? env.PROOFRANK_ALLOWED_HOSTS,
    authToken: options.authToken ?? env.PROOFRANK_REVIEW_TOKEN ?? env.PROOFRANK_API_TOKEN,
    collectorOptions
  };
}

function writeResult(response, result) {
  if (typeof response.status === "function") response.status(result.status);
  else response.statusCode = result.status;

  for (const [name, value] of Object.entries(result.headers || {})) {
    response.setHeader?.(name, value);
  }

  if (typeof response.end === "function") response.end(result.body || "");
  else if (typeof response.send === "function") response.send(result.body || "");
}

function writeError(response, error) {
  const body = JSON.stringify({ error: error.message });
  const headers = { "content-type": "application/json; charset=utf-8" };
  writeResult(response, { status: 500, headers, body });
}

export async function handleVercelLiveReview(request, response, pathname, options = {}) {
  try {
    const body = await requestBody(request);
    const result = await handleLiveReviewRequest(
      {
        method: request.method,
        url: request.url,
        pathname,
        headers: request.headers || {},
        body
      },
      createOptionsFromEnv(runtimeEnv(), options)
    );
    writeResult(response, result);
  } catch (error) {
    writeError(response, error);
  }
}
