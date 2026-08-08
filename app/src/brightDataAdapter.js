export function buildMcpQueries(eventUrl, project) {
  const title = project?.title || "event submissions";
  const team = project?.team || "unknown team";
  const sourceUrl = project?.githubUrl || project?.submissionUrl || project?.demoUrl || eventUrl;
  const demoPhrase = project?.demoUrl ? `demo ${project.demoUrl}` : "the public demo when supplied";
  const repoPhrase = project?.githubUrl ? `repo ${project.githubUrl}` : "the public repository when supplied";

  return [
    {
      tool: "scrape_as_markdown",
      purpose: "Fetch repo or submission source as judge-readable evidence",
      url: sourceUrl
    },
    {
      tool: "search_engine",
      purpose: "Check sponsor usage claims against public artifacts",
      query: `"${title}" "Bright Data" OR "SERP API" OR "Web Scraper API" OR "Remote MCP"`
    },
    {
      tool: "discover",
      purpose: "Discover adjacent public evidence and originality signals",
      query: `"${title}" "${team}" Bright Data hackathon`,
      intent: `Find source-backed evidence for ${repoPhrase} and ${demoPhrase}, including originality, public usage, and Bright Data dependency.`,
      numResults: 5,
      includeContent: true
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
