import { loadLocalEnv } from "./env-loader.mjs";

loadLocalEnv();

const token = String(
  process.env.BRIGHTDATA_API_TOKEN || process.env.BRIGHT_DATA_API_TOKEN || process.env.BRIGHTDATA_TOKEN || ""
).trim();

if (!token) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        reason: "missing_token",
        nextAction: "Set BRIGHTDATA_API_TOKEN in .env.local with a Bright Data account API key."
      },
      null,
      2
    )
  );
  process.exit(1);
}

const tokenShape = {
  length: token.length,
  looksLikeUuid: /^[0-9a-f-]{36}$/i.test(token),
  looksLikeLongHex: /^[0-9a-f]{48,}$/i.test(token)
};

const response = await fetch("https://api.brightdata.com/status", {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

const rawText = await response.text();
let body = {};
try {
  body = JSON.parse(rawText);
} catch {
  body = {};
}

const result = {
  ok: response.ok,
  httpStatus: response.status,
  status: body.status || null,
  canMakeRequests: body.can_make_requests ?? null,
  authFailReason: body.auth_fail_reason || null,
  customer: body.customer ? "[redacted]" : null,
  tokenShape,
  nextAction: response.ok
    ? "Run npm run brightdata:mcp-smoke, then run the MCP live smoke with the real project."
    : "Replace BRIGHTDATA_API_TOKEN with a Bright Data API key from Account settings or the welcome email. Coupon codes, customer IDs, and UUID-looking values are not API keys."
};

console.log(JSON.stringify(result, null, 2));
process.exit(response.ok ? 0 : 1);
