import { createServer } from "node:http";
import { handleLiveReviewRequest } from "../app/src/liveReviewApi.js";
import { createLiveCollectorsFromEnv } from "../app/src/liveFetchers.js";
import { loadLocalEnv } from "./env-loader.mjs";

const DEFAULT_PORT = 8787;

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large."));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

export function createLiveReviewServer(options = {}) {
  const liveCollectors = createLiveCollectorsFromEnv(process.env);
  const collectorOptions = {
    fetchText: liveCollectors.fetchText,
    searchText: liveCollectors.searchText,
    collectionMode: liveCollectors.collectionMode,
    ...(options.collectorOptions || {})
  };

  return createServer(async (request, response) => {
    try {
      const body = await readBody(request);
      const result = await handleLiveReviewRequest(
        {
          method: request.method,
          url: request.url,
          body
        },
        {
          ...options,
          collectorOptions
        }
      );

      response.writeHead(result.status, result.headers);
      response.end(result.body);
    } catch (error) {
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: error.message }));
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  loadLocalEnv();
  const port = Number(process.env.PORT || DEFAULT_PORT);
  const host = process.env.HOST || "127.0.0.1";
  const server = createLiveReviewServer();

  server.listen(port, host, () => {
    console.log(`ProofRank live review API listening at http://${host}:${port}`);
  });
}
