const REQUIRED_MCP_TOOLS = ["search_engine", "scrape_as_markdown", "discover"];

function tokenFromEnv(env = {}) {
  return String(env.BRIGHTDATA_API_TOKEN || env.BRIGHT_DATA_API_TOKEN || env.BRIGHTDATA_TOKEN || "").trim();
}

function tokenShape(token = "") {
  if (!token) return { missing: true };
  return {
    length: token.length,
    looksLikeUuid: /^[0-9a-f-]{36}$/i.test(token),
    looksLikeLongHex: /^[0-9a-f]{48,}$/i.test(token)
  };
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

function httpStatusFromMessage(message = "") {
  const match = String(message || "").match(/\bHTTP\s+(\d{3})\b/i);
  return match ? Number(match[1]) : 0;
}

function nextActionForFailure(token = "", httpStatus = 0) {
  if (!token) return "Set BRIGHTDATA_API_TOKEN in .env.local with a Bright Data account API key.";
  if (httpStatus === 401 || /^[0-9a-f-]{36}$/i.test(token)) {
    return "Replace BRIGHTDATA_API_TOKEN with a Bright Data API key from Account settings or the welcome email. Coupon codes, customer IDs, and UUID-looking values are not API keys.";
  }
  return "Check the Bright Data account, MCP endpoint, and enabled tools, then rerun npm run brightdata:mcp-smoke.";
}

export function buildMcpSmokeSuccessReport(initialized = {}, tools = [], protocolVersion = "2025-06-18") {
  const sampleTools = tools.slice(0, 8).map((tool) => tool.name);
  return {
    ok: true,
    server: initialized?.serverInfo?.name || "brightdata-mcp",
    protocolVersion: initialized?.protocolVersion || protocolVersion,
    toolCount: tools.length,
    baseToolsPresent: REQUIRED_MCP_TOOLS.every((name) => tools.some((tool) => tool.name === name)),
    sampleTools
  };
}

export function buildMcpSmokeFailureReport(error, env = {}) {
  const token = tokenFromEnv(env);
  const message = error?.message || String(error || "");
  const httpStatus = httpStatusFromMessage(message);

  return {
    ok: false,
    reason: token ? "mcp_check_failed" : "missing_token",
    httpStatus,
    baseToolsPresent: false,
    sampleTools: [],
    tokenShape: tokenShape(token),
    error: redact(message, [token]),
    nextAction: nextActionForFailure(token, httpStatus)
  };
}
