import { collectReviewerProject } from "./liveReviewer.js";
import { collectEventProjects } from "./liveEventReviewer.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type"
};

function json(status, payload) {
  return {
    status,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  };
}

function parsePathname(request) {
  if (request.pathname) return request.pathname;
  return new URL(request.url || "/", "http://127.0.0.1").pathname;
}

function parseBody(body) {
  if (body && typeof body === "object") return body;
  try {
    return body ? JSON.parse(String(body)) : {};
  } catch {
    throw new Error("Invalid JSON request body.");
  }
}

function isHttpUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function projectReviewPayload(project = {}) {
  if (!isHttpUrl(project.githubUrl || "")) return null;
  return {
    repoUrl: project.githubUrl,
    demoUrl: isHttpUrl(project.demoUrl || "") ? project.demoUrl : "",
    title: project.title,
    team: project.team,
    eventUrl: project.eventUrl
  };
}

export async function handleLiveReviewRequest(request, options = {}) {
  const method = (request.method || "GET").toUpperCase();
  const pathname = parsePathname(request);
  const collector = options.collector || collectReviewerProject;
  const eventCollector = options.eventCollector || collectEventProjects;

  if (method === "OPTIONS") return { status: 204, headers: JSON_HEADERS, body: "" };
  if (method === "GET" && pathname === "/health") return json(200, { ok: true, service: "proofrank-live-review" });

  if (method === "POST" && pathname === "/api/review-event") {
    let payload;
    try {
      payload = parseBody(request.body);
    } catch (error) {
      return json(400, { error: error.message });
    }

    if (!payload.eventUrl) {
      return json(422, { error: "eventUrl is required." });
    }

    try {
      const result = await eventCollector(payload, options.collectorOptions || {});
      const reviewPayload = payload.reviewFirstProject ? projectReviewPayload(result.projects?.[0]) : null;
      if (reviewPayload) {
        try {
          const reviewedProject = await collector(reviewPayload, options.collectorOptions || {});
          result.projects = [reviewedProject, ...result.projects.slice(1)];
          result.reviewedProject = reviewedProject;
        } catch (error) {
          result.reviewError = error.message;
        }
      }
      return json(200, { mode: "live-event", ...result });
    } catch (error) {
      return json(422, { error: error.message });
    }
  }

  if (method !== "POST" || pathname !== "/api/review-project") {
    return json(404, { error: "Route not found." });
  }

  let payload;
  try {
    payload = parseBody(request.body);
  } catch (error) {
    return json(400, { error: error.message });
  }

  if (!payload.repoUrl) {
    return json(422, { error: "repoUrl is required." });
  }

  try {
    const project = await collector(payload, options.collectorOptions || {});
    return json(200, { mode: "live", project });
  } catch (error) {
    return json(422, { error: error.message });
  }
}
