import { loadLocalEnv } from "./env-loader.mjs";
import { BRIGHTDATA_MCP_PROTOCOL_VERSION, createBrightDataMcpClient } from "../app/src/brightDataMcpClient.js";

loadLocalEnv();

const token = process.env.BRIGHTDATA_API_TOKEN || process.env.BRIGHT_DATA_API_TOKEN || process.env.BRIGHTDATA_TOKEN;
if (!token) {
  throw new Error("BRIGHTDATA_API_TOKEN is required for the MCP smoke check.");
}

const client = createBrightDataMcpClient({
  env: process.env,
  clientName: "proofrank-smoke"
});
const initialized = await client.initialize();
const tools = await client.listTools();
console.log(
  JSON.stringify(
    {
      ok: true,
      server: initialized?.serverInfo?.name || "brightdata-mcp",
      protocolVersion: initialized?.protocolVersion || BRIGHTDATA_MCP_PROTOCOL_VERSION,
      toolCount: tools.length,
      baseToolsPresent: ["search_engine", "scrape_as_markdown", "discover"].every((name) => tools.some((tool) => tool.name === name)),
      sampleTools: tools.slice(0, 8).map((tool) => tool.name)
    },
    null,
    2
  )
);
