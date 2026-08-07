const TOOL_PATTERNS = [
  ["Remote MCP", /\bremote\s+mcp\b|\bmcp\b/i],
  ["SERP API", /\bserp\s+api\b|\bsearch_engine\b/i],
  ["Web Scraper API", /\bweb\s+scraper\s+api\b|\bscrape_as_markdown\b|\bscrape_batch\b/i],
  ["Web Unlocker", /\bweb\s+unlocker\b|\bunlocker\b/i],
  ["Scraping Browser", /\bscraping\s+browser\b|\bbrowser\s+automation\b/i],
  ["Datasets", /\bdatasets?\b|\bweb_data_/i],
  ["Proxy Networks", /\bproxy\s+networks?\b/i],
  ["CLI", /\bbright\s+data\s+cli\b|\bnpx\b/i]
];

const ACRONYMS = new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["mcp", "MCP"],
  ["ui", "UI"],
  ["ux", "UX"],
  ["github", "GitHub"],
  ["proofrank", "ProofRank"]
]);

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function labelFromSlug(value = "") {
  return cleanText(value)
    .replace(/\.git$/i, "")
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => ACRONYMS.get(word.toLowerCase()) || word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isHttpUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function decodePossibleGitHubReadme(value = "") {
  const text = String(value || "");
  try {
    const parsed = JSON.parse(text);
    if (parsed?.content && parsed?.encoding === "base64") {
      if (typeof Buffer !== "undefined") return Buffer.from(parsed.content, "base64").toString("utf8");
      if (typeof atob !== "undefined") return atob(parsed.content.replace(/\s+/g, ""));
    }
  } catch {
    return text;
  }
  return text;
}

async function defaultFetchText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`);
  return response.text();
}

function excerpt(value, fallback) {
  const text = cleanText(value).replace(/[<>]/g, "");
  if (!text) return fallback;
  return text.length > 220 ? `${text.slice(0, 217)}...` : text;
}

function extractBrightDataTools(text) {
  return TOOL_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}

function inferBrightRole(text, tools) {
  if (!tools.length) return "none";
  if (
    hasAny(text, [
      /\bagentic\b/i,
      /\baudit\b/i,
      /\bproof\s+receipt/i,
      /\bsource-backed\b/i,
      /\bprior[-\s]art\b/i,
      /\boriginality\b/i,
      /\btrace\b/i,
      /\breplay\b/i
    ])
  ) {
    return "agentic";
  }
  if (tools.length >= 2 && hasAny(text, [/\bworkflow\b/i, /\bcollect/i, /\bscrap/i, /\bsearch/i])) return "load-bearing";
  return "supporting";
}

function buildReplayTraces({ repoUrl, demoUrl, submissionUrl, title }, collectedAt) {
  const traces = [
    {
      mode: "ready-live",
      tool: "scrape_as_markdown",
      queryOrUrl: repoUrl,
      resultCount: 1,
      status: "server-side replay target",
      collectedAt
    },
    {
      mode: "ready-live",
      tool: "search_engine",
      queryOrUrl: `"${title}" "Bright Data" hackathon originality`,
      resultCount: 0,
      status: "prior-art query prepared",
      collectedAt
    }
  ];

  if (demoUrl) {
    traces.push({
      mode: "ready-live",
      tool: "scrape_as_markdown",
      queryOrUrl: demoUrl,
      resultCount: 1,
      status: "demo scrape target",
      collectedAt
    });
  }

  if (submissionUrl) {
    traces.push({
      mode: "ready-live",
      tool: "scrape_as_markdown",
      queryOrUrl: submissionUrl,
      resultCount: 1,
      status: "submission scrape target",
      collectedAt
    });
  }

  return traces;
}

export function parseGitHubRepoUrl(value = "") {
  if (!isHttpUrl(value)) throw new Error("A public GitHub repository URL is required.");

  const url = new URL(value);
  if (url.hostname.toLowerCase() !== "github.com") {
    throw new Error("A public GitHub repository URL is required.");
  }

  const [owner, repoPart] = url.pathname.split("/").filter(Boolean);
  const repo = repoPart?.replace(/\.git$/i, "");
  if (!owner || !repo) throw new Error("A public GitHub repository URL is required.");

  return {
    owner,
    repo,
    canonicalUrl: `https://github.com/${owner}/${repo}`,
    readmeApiUrl: `https://api.github.com/repos/${owner}/${repo}/readme`
  };
}

export async function collectReviewerProject(input, options = {}) {
  const { owner, repo, canonicalUrl, readmeApiUrl } = parseGitHubRepoUrl(input.repoUrl);
  const fetchText = options.fetchText || defaultFetchText;
  const now = options.now || (() => new Date());
  const collectedAt = now().toISOString();
  const demoUrl = isHttpUrl(input.demoUrl) ? input.demoUrl : "";
  const submissionUrl = isHttpUrl(input.submissionUrl) ? input.submissionUrl : "";
  const title = cleanText(input.title) || labelFromSlug(repo);
  const team = cleanText(input.team) || labelFromSlug(owner);

  let readmeText = "";
  let demoText = "";

  try {
    readmeText = decodePossibleGitHubReadme(
      await fetchText(readmeApiUrl, {
        headers: {
          Accept: "application/vnd.github.raw"
        }
      })
    );
  } catch (error) {
    readmeText = `README unavailable: ${error.message}`;
  }

  if (demoUrl) {
    try {
      demoText = await fetchText(demoUrl);
    } catch (error) {
      demoText = `Demo unavailable: ${error.message}`;
    }
  }

  const haystack = `${title} ${team} ${readmeText} ${demoText}`.toLowerCase();
  const brightDataTools = [...new Set(extractBrightDataTools(haystack))];
  const brightDataRole = inferBrightRole(haystack, brightDataTools);
  const hasDemo = Boolean(demoUrl);
  const demoReachable = hasDemo && !demoText.startsWith("Demo unavailable:");
  const readmeReachable = !readmeText.startsWith("README unavailable:");
  const workflowText = `${readmeText} ${demoText}`;
  const id = `review-${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id,
    title,
    team,
    summary: excerpt(
      readmeText,
      "Reviewer-supplied repository accepted. Live collection should fetch README, demo, submission, and prior-art evidence."
    ),
    eventUrl: input.eventUrl || "",
    submissionUrl,
    demoUrl,
    githubUrl: canonicalUrl,
    presentationUrl: isHttpUrl(input.presentationUrl) ? input.presentationUrl : "",
    createdAt: collectedAt.slice(0, 10),
    domain: hasAny(haystack, [/\bcompliance\b/i, /\brisk\b/i, /\baudit\b/i, /\bjudge\b/i]) ? "Governance" : "Reviewer input",
    technologies: brightDataTools.length ? ["GitHub", ...brightDataTools] : ["GitHub", "Bright Data collection pending"],
    trackTags: ["Reviewer supplied", "Live evidence"],
    evidence: {
      hasDemo,
      hasPublicDemo: demoReachable,
      hasGithub: true,
      hasPresentation: Boolean(input.presentationUrl),
      nativeBuilderExplained: hasAny(haystack, [/\bnative\.builder\b/i, /\bnatively\b/i]),
      builtDuringEvent: false,
      isFunctional: demoReachable || hasAny(workflowText, [/\bworkflow\b/i, /\bdashboard\b/i, /\breview\b/i, /\bexport\b/i]),
      notLandingPage: hasAny(workflowText, [/\bworkflow\b/i, /\branked queue\b/i, /\bproof receipt\b/i, /\bexport\b/i]),
      demoWorkflow: demoReachable && hasAny(demoText, [/\brun\b/i, /\breview\b/i, /\bqueue\b/i, /\bworkflow\b/i, /\bexport\b/i]),
      conciseSummary: readmeReachable && cleanText(readmeText).length > 80,
      targetUser: hasAny(workflowText, [/\bjudge\b/i, /\bsponsor\b/i, /\bfounder\b/i, /\bteam\b/i, /\buser\b/i]),
      clearPain: hasAny(workflowText, [/\bpain\b/i, /\bmanual\b/i, /\bunder time pressure\b/i, /\bneed\b/i, /\brisk\b/i]),
      repeatableWorkflow: hasAny(workflowText, [/\bworkflow\b/i, /\breplay\b/i, /\brepeat\b/i, /\bqueue\b/i]),
      buyerExists: hasAny(workflowText, [/\bjudge\b/i, /\bsponsor\b/i, /\baccelerator\b/i, /\bgrant\b/i, /\bbusiness\b/i]),
      urgency: hasAny(workflowText, [/\bdeadline\b/i, /\brisk\b/i, /\bbefore\b/i, /\btime pressure\b/i]),
      differentiation: hasAny(workflowText, [/\boriginality\b/i, /\bprior[-\s]art\b/i, /\bdifferentiat/i, /\bevidence\b/i]),
      lowCrowdOverlap: hasAny(workflowText, [/\boriginality\b/i, /\bprior[-\s]art\b/i, /\bsponsor-side\b/i]),
      proofReceipt: hasAny(workflowText, [/\bproof receipt\b/i, /\bsource-backed\b/i, /\bcitation\b/i, /\btrace\b/i]),
      specificWedge: hasAny(workflowText, [/\bhackathon judge\b/i, /\bsponsor\b/i, /\bsubmission\b/i, /\brepository\b/i]),
      nonGenericAgent: hasAny(workflowText, [/\bagentic\b/i, /\bagent\b/i, /\bcollector\b/i, /\bauditor\b/i]),
      brightDataRole,
      brightDataTools,
      agenticLoop: hasAny(workflowText, [/\bagentic\b/i, /\bagent\b/i, /\bloop\b/i, /\breplay\b/i, /\bcollector\b/i]),
      brightDataTrace: brightDataTools.length > 0
    },
    evidenceItems: [
      {
        id: `${id}-readme`,
        sourceType: "github-readme",
        sourceUrl: canonicalUrl,
        title: readmeReachable ? "GitHub README collected" : "GitHub README unavailable",
        excerpt: excerpt(readmeText, "README could not be collected."),
        collectedAt,
        collector: "ProofRank live reviewer",
        confidence: readmeReachable ? 0.82 : 0.28,
        supports: ["Source availability", "Technology evidence"],
        limitations: readmeReachable ? "README claims still need public-web corroboration." : "Repository may be private, missing README, or rate-limited."
      },
      ...(hasDemo
        ? [
            {
              id: `${id}-demo`,
              sourceType: "public-demo",
              sourceUrl: demoUrl,
              title: demoReachable ? "Public demo collected" : "Public demo unavailable",
              excerpt: excerpt(demoText, "Demo could not be collected."),
              collectedAt,
              collector: "ProofRank live reviewer",
              confidence: demoReachable ? 0.78 : 0.24,
              supports: ["Demo availability", "Workflow proof"],
              limitations: demoReachable ? "Fetch confirms public content, not complete interactive success." : "Judges may not be able to access the demo."
            }
          ]
        : [])
    ],
    brightDataTraces: buildReplayTraces(
      {
        repoUrl: canonicalUrl,
        demoUrl,
        submissionUrl,
        title
      },
      collectedAt
    )
  };
}
