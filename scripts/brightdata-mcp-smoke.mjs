import { loadLocalEnv } from "./env-loader.mjs";
import { BRIGHTDATA_MCP_PROTOCOL_VERSION, createBrightDataMcpClient } from "../app/src/brightDataMcpClient.js";
import { buildMcpSmokeFailureReport, buildMcpSmokeSuccessReport } from "../app/src/brightDataSmokeReport.js";

loadLocalEnv();

const token = process.env.BRIGHTDATA_API_TOKEN || process.env.BRIGHT_DATA_API_TOKEN || process.env.BRIGHTDATA_TOKEN;
if (!token) {
  console.log(JSON.stringify(buildMcpSmokeFailureReport(new Error("BRIGHTDATA_API_TOKEN is required for the MCP smoke check."), process.env), null, 2));
  process.exit(1);
}

try {
  const client = createBrightDataMcpClient({
    env: process.env,
    clientName: "proofrank-smoke"
  });
  const initialized = await client.initialize();
  const tools = await client.listTools();
  console.log(JSON.stringify(buildMcpSmokeSuccessReport(initialized, tools, BRIGHTDATA_MCP_PROTOCOL_VERSION), null, 2));
} catch (error) {
  console.log(JSON.stringify(buildMcpSmokeFailureReport(error, process.env), null, 2));
  process.exit(1);
}
