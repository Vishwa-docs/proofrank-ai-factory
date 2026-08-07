import { extractProjectsFromHtml } from "./parser.js";
import { buildCollectionTrace } from "./liveReviewer.js";

function isHttpUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

async function defaultFetchText(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`Fetch failed ${response.status} for ${url}`);
  return response.text();
}

export async function collectEventProjects(input = {}, options = {}) {
  const eventUrl = String(input.eventUrl || "").trim();
  if (!isHttpUrl(eventUrl)) throw new Error("An HTTP event URL is required.");

  const fetchText = options.fetchText || defaultFetchText;
  const now = options.now || (() => new Date());
  const collectedAt = now().toISOString();
  const collectionMode = options.collectionMode || "direct-fetch";

  let html = "";
  let eventTrace;

  try {
    html = await fetchText(eventUrl);
    eventTrace = buildCollectionTrace({
      collectionMode,
      tool: "scrape_as_markdown",
      queryOrUrl: eventUrl,
      collectedAt,
      text: html,
      countsForSponsorFit: false
    });
  } catch (error) {
    eventTrace = buildCollectionTrace({
      collectionMode,
      tool: "scrape_as_markdown",
      queryOrUrl: eventUrl,
      collectedAt,
      error,
      countsForSponsorFit: false
    });
    throw error;
  }

  const projects = extractProjectsFromHtml(html).map((project) => ({
    ...project,
    eventUrl,
    evidenceItems: [
      {
        id: `${project.id}-event-live`,
        sourceType: "event-page-live",
        sourceUrl: eventUrl,
        title: "Event page collected",
        excerpt: `${project.title} was parsed from the live event page.`,
        collectedAt,
        collector: eventTrace.provider === "bright-data" ? "ProofRank Bright Data event reviewer" : "ProofRank direct event reviewer",
        confidence: eventTrace.traceStatus === "executed" ? 0.72 : 0.22,
        supports: ["Event intake", "Submission discovery"],
        limitations: "Event-card evidence does not prove demo reachability, source depth, or true sponsor usage."
      },
      ...(project.evidenceItems || [])
    ],
    brightDataTraces: [eventTrace, ...(project.brightDataTraces || [])]
  }));

  return {
    eventUrl,
    collectedAt,
    eventTrace,
    projectCount: projects.length,
    projects
  };
}
