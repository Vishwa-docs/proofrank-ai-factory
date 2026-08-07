import assert from "node:assert/strict";
import {
  buildBrightDataRequest,
  createBrightDataFetchText,
  createDirectFetchText,
  createLiveFetchTextFromEnv
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

await assert.rejects(
  () => createBrightDataFetchText({ apiToken: "" })("https://example.com"),
  /Bright Data API token/
);

assert.throws(() => buildBrightDataRequest("file:///tmp/nope", { apiToken: "test-token" }), /HTTP URL/);

console.log("live fetcher tests passed");
