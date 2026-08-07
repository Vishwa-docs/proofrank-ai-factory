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

const HACKATHON_WINDOW = {
  start: "2026-08-03T15:00:00.000Z",
  end: "2026-08-10T15:00:00.000Z"
};

const PACKAGE_PATHS = ["package.json", "pyproject.toml", "requirements.txt", "Cargo.toml", "go.mod"];

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

function parseJson(value, fallback) {
  try {
    return JSON.parse(String(value || ""));
  } catch {
    return fallback;
  }
}

function buildRawGitHubUrl(owner, repo, branch, path) {
  const safeBranch = encodeURIComponent(branch);
  const safePath = String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
  return `https://raw.githubusercontent.com/${owner}/${repo}/${safeBranch}/${safePath}`;
}

function buildCommitsApiUrl(owner, repo, window = HACKATHON_WINDOW) {
  const url = new URL(`https://api.github.com/repos/${owner}/${repo}/commits`);
  url.searchParams.set("since", window.start);
  url.searchParams.set("until", window.end);
  url.searchParams.set("per_page", "25");
  return url.toString();
}

function pathsFromTree(treeText) {
  const parsed = parseJson(treeText, {});
  return (parsed.tree || [])
    .filter((item) => item?.type === "blob" && item.path)
    .map((item) => item.path);
}

function findFirstPath(paths, candidates) {
  const byLower = new Map(paths.map((path) => [path.toLowerCase(), path]));
  for (const candidate of candidates) {
    if (byLower.has(candidate.toLowerCase())) return byLower.get(candidate.toLowerCase());
  }
  return "";
}

function findLicensePath(paths) {
  return paths.find((path) => /(^|\/)licen[sc]e(\..*)?$/i.test(path)) || "";
}

function riskyFilePath(path) {
  const base = path.toLowerCase().split("/").pop();
  return [".env", ".env.local", ".env.production", ".env.prod", "credentials.json", "service-account.json", "id_rsa"].includes(base) || base.endsWith(".pem");
}

function textHasSecretRisk(text) {
  return /(?:api[_-]?key|secret|token|password|private[_-]?key)\s*[:=]\s*["']?(?!your_|replace|example|sample|dummy|test|redacted)[a-z0-9_./+=-]{20,}/i.test(
    text
  );
}

function summarizePackageManifest(text) {
  const parsed = parseJson(text, null);
  if (!parsed) return excerpt(text, "Package manifest collected.");

  const scripts = Object.keys(parsed.scripts || {}).slice(0, 6);
  const dependencies = [...Object.keys(parsed.dependencies || {}), ...Object.keys(parsed.devDependencies || {})].slice(0, 8);
  return `Scripts: ${scripts.join(", ") || "none"}. Dependencies: ${dependencies.join(", ") || "none"}.`;
}

function commitsDuringWindow(commitsText, window = HACKATHON_WINDOW) {
  const commits = parseJson(commitsText, []);
  if (!Array.isArray(commits)) return [];
  const start = new Date(window.start).getTime();
  const end = new Date(window.end).getTime();

  return commits.filter((commit) => {
    const date = new Date(commit?.commit?.author?.date || commit?.commit?.committer?.date || commit?.created_at || "").getTime();
    return Number.isFinite(date) && date >= start && date <= end;
  });
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
      mode: "planned",
      provider: "bright-data",
      traceStatus: "planned",
      tool: "scrape_as_markdown",
      queryOrUrl: repoUrl,
      resultCount: 0,
      status: "server-side replay target",
      collectedAt,
      byteCount: 0,
      contentHash: "00000000"
    },
    {
      mode: "planned",
      provider: "bright-data",
      traceStatus: "planned",
      tool: "search_engine",
      queryOrUrl: `"${title}" "Bright Data" hackathon originality`,
      resultCount: 0,
      status: "prior-art query prepared",
      collectedAt,
      byteCount: 0,
      contentHash: "00000000"
    }
  ];

  if (demoUrl) {
    traces.push({
      mode: "planned",
      provider: "bright-data",
      traceStatus: "planned",
      tool: "scrape_as_markdown",
      queryOrUrl: demoUrl,
      resultCount: 0,
      status: "demo scrape target",
      collectedAt,
      byteCount: 0,
      contentHash: "00000000"
    });
  }

  if (submissionUrl) {
    traces.push({
      mode: "planned",
      provider: "bright-data",
      traceStatus: "planned",
      tool: "scrape_as_markdown",
      queryOrUrl: submissionUrl,
      resultCount: 0,
      status: "submission scrape target",
      collectedAt,
      byteCount: 0,
      contentHash: "00000000"
    });
  }

  return traces;
}

function providerForCollectionMode(collectionMode) {
  return collectionMode === "bright-data-request-api" ? "bright-data" : "direct";
}

function byteCount(value = "") {
  const text = String(value || "");
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text).length;
  return text.length;
}

function contentHash(value = "") {
  const text = String(value || "");
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function buildCollectionTrace({ collectionMode, tool, queryOrUrl, collectedAt, text = "", error = null, countsForSponsorFit = true }) {
  const ok = !error;
  return {
    mode: collectionMode,
    provider: providerForCollectionMode(collectionMode),
    traceStatus: ok ? "executed" : "failed",
    tool,
    queryOrUrl,
    resultCount: ok && cleanText(text) ? 1 : 0,
    status: ok ? "ok" : `failed: ${error.message}`,
    collectedAt,
    byteCount: ok ? byteCount(text) : 0,
    contentHash: ok ? contentHash(text) : "00000000",
    countsForSponsorFit
  };
}

export function summarizeTraceStatus(traces) {
  if (traces.some((trace) => trace.provider === "bright-data" && trace.traceStatus === "executed")) return "executed";
  if (traces.some((trace) => trace.provider === "bright-data" && trace.traceStatus === "failed")) return "failed";
  if (traces.some((trace) => trace.provider === "direct" && trace.traceStatus === "executed")) return "direct";
  if (traces.some((trace) => trace.traceStatus === "planned")) return "planned";
  return "missing";
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
  const collectionMode = options.collectionMode || "direct-fetch";
  const collectionTraces = [];
  const repoApiUrl = `https://api.github.com/repos/${owner}/${repo}`;
  const demoUrl = isHttpUrl(input.demoUrl) ? input.demoUrl : "";
  const submissionUrl = isHttpUrl(input.submissionUrl) ? input.submissionUrl : "";
  const title = cleanText(input.title) || labelFromSlug(repo);
  const team = cleanText(input.team) || labelFromSlug(owner);

  let repoMetadata = {};
  let readmeText = "";
  let demoText = "";
  let treeText = "";
  let packageText = "";
  let licenseText = "";
  let commitsText = "";

  async function fetchEvidence(url, requestOptions = {}, meta = {}) {
    try {
      const text = await fetchText(url, requestOptions);
      collectionTraces.push(
        buildCollectionTrace({
          collectionMode,
          tool: meta.tool || "scrape_as_markdown",
          queryOrUrl: url,
          collectedAt,
          text
        })
      );
      return text;
    } catch (error) {
      collectionTraces.push(
        buildCollectionTrace({
          collectionMode,
          tool: meta.tool || "scrape_as_markdown",
          queryOrUrl: url,
          collectedAt,
          error
        })
      );
      throw error;
    }
  }

  try {
    repoMetadata = parseJson(
      await fetchEvidence(
        repoApiUrl,
        {
          headers: {
            Accept: "application/vnd.github+json"
          }
        },
        { tool: "github_api" }
      ),
      {}
    );
  } catch (error) {
    repoMetadata = {
      error: error.message
    };
  }

  const defaultBranch = cleanText(repoMetadata.default_branch) || "main";
  const treeApiUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`;
  const commitsApiUrl = buildCommitsApiUrl(owner, repo, options.hackathonWindow || HACKATHON_WINDOW);

  try {
    readmeText = decodePossibleGitHubReadme(
      await fetchEvidence(
        readmeApiUrl,
        {
          headers: {
            Accept: "application/vnd.github.raw"
          }
        },
        { tool: "scrape_as_markdown" }
      )
    );
  } catch (error) {
    readmeText = `README unavailable: ${error.message}`;
  }

  try {
    treeText = await fetchEvidence(
      treeApiUrl,
      {
        headers: {
          Accept: "application/vnd.github+json"
        }
      },
      { tool: "github_api" }
    );
  } catch (error) {
    treeText = JSON.stringify({
      error: error.message,
      tree: []
    });
  }

  const treePaths = pathsFromTree(treeText);
  const packagePath = findFirstPath(treePaths, PACKAGE_PATHS);
  const licensePath = findLicensePath(treePaths);

  if (packagePath) {
    try {
      packageText = await fetchEvidence(buildRawGitHubUrl(owner, repo, defaultBranch, packagePath), {}, { tool: "scrape_as_markdown" });
    } catch (error) {
      packageText = `Package manifest unavailable: ${error.message}`;
    }
  }

  if (licensePath) {
    try {
      licenseText = await fetchEvidence(buildRawGitHubUrl(owner, repo, defaultBranch, licensePath), {}, { tool: "scrape_as_markdown" });
    } catch (error) {
      licenseText = `License unavailable: ${error.message}`;
    }
  }

  try {
    commitsText = await fetchEvidence(
      commitsApiUrl,
      {
        headers: {
          Accept: "application/vnd.github+json"
        }
      },
      { tool: "github_api" }
    );
  } catch (error) {
    commitsText = JSON.stringify({
      error: error.message
    });
  }

  if (demoUrl) {
    try {
      demoText = await fetchEvidence(demoUrl, {}, { tool: "scrape_as_markdown" });
    } catch (error) {
      demoText = `Demo unavailable: ${error.message}`;
    }
  }

  const repoMetadataReachable = !repoMetadata.error;
  const treeReachable = treePaths.length > 0;
  const packageReachable = Boolean(packagePath && !packageText.startsWith("Package manifest unavailable:"));
  const metadataLicense = repoMetadata.license?.spdx_id && repoMetadata.license.spdx_id !== "NOASSERTION" ? repoMetadata.license.spdx_id : "";
  const licensePresent = Boolean(metadataLicense || (licensePath && !licenseText.startsWith("License unavailable:")));
  const hackathonCommits = commitsDuringWindow(commitsText, options.hackathonWindow || HACKATHON_WINDOW);
  const riskyPaths = treePaths.filter(riskyFilePath);
  const secretRiskVisible = riskyPaths.length > 0 || textHasSecretRisk(`${readmeText}\n${packageText}`);
  const workflowText = `${readmeText} ${demoText} ${packageText} ${licenseText} ${treePaths.join(" ")}`;
  const haystack = `${title} ${team} ${workflowText}`.toLowerCase();
  const brightDataTools = [...new Set(extractBrightDataTools(haystack))];
  const brightDataRole = inferBrightRole(haystack, brightDataTools);
  const brightDataTraceStatus = summarizeTraceStatus(collectionTraces);
  const executedBrightDataTrace = brightDataTraceStatus === "executed";
  const hasDemo = Boolean(demoUrl);
  const demoReachable = hasDemo && !demoText.startsWith("Demo unavailable:");
  const readmeReachable = !readmeText.startsWith("README unavailable:");
  const id = `review-${owner}-${repo}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const plannedTraces =
    collectionMode === "bright-data-request-api"
      ? []
      : buildReplayTraces(
          {
            repoUrl: canonicalUrl,
            demoUrl,
            submissionUrl,
            title
          },
          collectedAt
        );

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
      repoMetadataCollected: repoMetadataReachable,
      repoTreeCollected: treeReachable,
      packageManifestPresent: packageReachable,
      licensePresent,
      builtDuringEvent: hackathonCommits.length > 0,
      secretRiskVisible,
      nativeBuilderExplained: hasAny(haystack, [/\bnative\.builder\b/i, /\bnatively\b/i, /\bnative-builder-prompt\b/i]),
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
      brightDataTrace: executedBrightDataTrace,
      brightDataTraceStatus,
      brightDataTraceVisible: collectionTraces.length > 0 || plannedTraces.length > 0
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
        : []),
      {
        id: `${id}-metadata`,
        sourceType: "github-metadata",
        sourceUrl: canonicalUrl,
        title: repoMetadataReachable ? "Repository metadata collected" : "Repository metadata unavailable",
        excerpt: repoMetadataReachable
          ? `Default branch ${defaultBranch}. License ${metadataLicense || "unknown"}. Last push ${repoMetadata.pushed_at || "unknown"}.`
          : `Repository metadata unavailable: ${repoMetadata.error}`,
        collectedAt,
        collector: "ProofRank GitHub reviewer",
        confidence: repoMetadataReachable ? 0.86 : 0.24,
        supports: ["Repository availability", "License metadata"],
        limitations: repoMetadataReachable ? "Metadata does not prove the app was built primarily in native.builder." : "GitHub API metadata could not be collected."
      },
      {
        id: `${id}-tree`,
        sourceType: "github-tree",
        sourceUrl: `${canonicalUrl}/tree/${defaultBranch}`,
        title: treeReachable ? "Repository tree collected" : "Repository tree unavailable",
        excerpt: treeReachable
          ? `${treePaths.length} files found. Key files: ${treePaths.slice(0, 8).join(", ")}.`
          : `Repository tree unavailable: ${parseJson(treeText, {}).error || "no files found"}`,
        collectedAt,
        collector: "ProofRank GitHub reviewer",
        confidence: treeReachable ? 0.84 : 0.22,
        supports: ["Source depth", "Implementation surface"],
        limitations: treeReachable ? "Tree inspection shows file presence, not full code quality." : "Repository may be private, missing, or inaccessible."
      },
      ...(packagePath
        ? [
            {
              id: `${id}-package`,
              sourceType: "package-manifest",
              sourceUrl: buildRawGitHubUrl(owner, repo, defaultBranch, packagePath),
              title: packageReachable ? "Package manifest collected" : "Package manifest unavailable",
              excerpt: summarizePackageManifest(packageText),
              collectedAt,
              collector: "ProofRank GitHub reviewer",
              confidence: packageReachable ? 0.78 : 0.25,
              supports: ["Build reproducibility", "Dependency evidence"],
              limitations: packageReachable ? "Manifest presence does not prove all scripts run successfully." : "Manifest path was found but content could not be fetched."
            }
          ]
        : []),
      {
        id: `${id}-commits`,
        sourceType: "github-commits",
        sourceUrl: `${canonicalUrl}/commits/${defaultBranch}`,
        title: hackathonCommits.length ? "Hackathon-window commits collected" : "No hackathon-window commits found",
        excerpt: hackathonCommits.length
          ? `${hackathonCommits.length} commit${hackathonCommits.length === 1 ? "" : "s"} found during the event window. Latest: ${cleanText(
              hackathonCommits[0]?.commit?.message || hackathonCommits[0]?.sha || "commit"
            )}.`
          : "No commits were visible through the public GitHub API inside the configured August 3-10, 2026 event window.",
        collectedAt,
        collector: "ProofRank GitHub reviewer",
        confidence: hackathonCommits.length ? 0.82 : 0.42,
        supports: ["Built during event", "Repository activity"],
        limitations: "Commit history can be squashed, rebased, private, or imported from another workspace."
      },
      ...(licensePresent
        ? [
            {
              id: `${id}-license`,
              sourceType: "license",
              sourceUrl: licensePath ? buildRawGitHubUrl(owner, repo, defaultBranch, licensePath) : canonicalUrl,
              title: "License evidence collected",
              excerpt: metadataLicense ? `GitHub reports ${metadataLicense}.` : excerpt(licenseText, "License file collected."),
              collectedAt,
              collector: "ProofRank GitHub reviewer",
              confidence: 0.76,
              supports: ["Submission ownership", "Reuse permission"],
              limitations: "License metadata does not verify rights to third-party assets, datasets, or generated media."
            }
          ]
        : []),
      {
        id: `${id}-secret-scan`,
        sourceType: "secret-risk-scan",
        sourceUrl: canonicalUrl,
        title: secretRiskVisible ? "Possible secret risk visible" : "Secret-risk scan passed",
        excerpt: secretRiskVisible
          ? `Potentially sensitive files or values detected: ${riskyPaths.slice(0, 5).join(", ") || "high-entropy assignment text"}.`
          : "No obvious secret-bearing filenames or high-entropy credential assignments were visible in fetched public evidence.",
        collectedAt,
        collector: "ProofRank GitHub reviewer",
        confidence: treeReachable || readmeReachable ? 0.64 : 0.26,
        supports: ["Public-source hygiene"],
        limitations: "This is a lightweight public-evidence scan, not a full secret scanner."
      }
    ],
    brightDataTraces: [...collectionTraces, ...plannedTraces]
  };
}
