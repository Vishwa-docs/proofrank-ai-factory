export function buildMcpQueries(eventUrl, project) {
  const title = project?.title || "event submissions";
  const team = project?.team || "unknown team";

  return [
    {
      tool: "search_engine",
      purpose: "Discover public mentions and possible duplicates",
      query: `"${title}" "${team}" hackathon project`
    },
    {
      tool: "scrape_as_markdown",
      purpose: "Fetch submission page as judge-readable evidence",
      url: project?.submissionUrl || eventUrl
    },
    {
      tool: "scrape_as_markdown",
      purpose: "Inspect public demo surface",
      url: project?.demoUrl || "PROJECT_DEMO_URL"
    },
    {
      tool: "search_engine",
      purpose: "Check sponsor usage claims against public artifacts",
      query: `"${title}" "Bright Data" OR "SERP API" OR "Web Scraper API" OR "Remote MCP"`
    }
  ];
}

export function buildCliCommands(eventUrl, project) {
  const safeEventUrl = eventUrl || "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits";
  const title = project?.title || "ProofRank";
  const submissionUrl = project?.submissionUrl || safeEventUrl;
  const demoUrl = project?.demoUrl && project.demoUrl.startsWith("http") ? project.demoUrl : "PROJECT_DEMO_URL";

  return [
    `npx --yes --package @brightdata/cli brightdata scrape ${submissionUrl} -f markdown --json`,
    `npx --yes --package @brightdata/cli brightdata search "${title} Bright Data hackathon" --json --pretty`,
    `npx --yes --package @brightdata/cli brightdata scrape ${demoUrl} -f markdown --json`,
    `npx --yes --package @brightdata/cli brightdata discover "${title}" --intent "Find public evidence of originality, demo availability, and Bright Data usage" --num-results 5 --include-content --json`
  ];
}

export function normalizeBrightDataTrace({ mode = "live", tool, queryOrUrl, resultCount = 0, status = "ok" }) {
  return {
    mode,
    tool,
    queryOrUrl,
    resultCount,
    status,
    collectedAt: new Date().toISOString()
  };
}

export function setupChecklist() {
  return [
    "Create or open a Bright Data account.",
    "Apply hackathon promo code aiaccess50 if prompted.",
    "Copy the Bright Data API token.",
    "Use Remote MCP endpoint https://mcp.brightdata.com/mcp?token=YOUR_API_TOKEN.",
    "Scope tools to search_engine,scrape_as_markdown,scrape_batch,discover for the first demo.",
    "In native.builder, store the token server-side and never expose it to the browser."
  ];
}
