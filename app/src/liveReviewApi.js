import { collectReviewerProject } from "./liveReviewer.js";
import { collectEventProjects } from "./liveEventReviewer.js";

const BASE_JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type, authorization, x-proofrank-token"
};

function json(status, payload, headers = jsonHeaders()) {
  return {
    status,
    headers,
    body: JSON.stringify(payload)
  };
}

function jsonHeaders(allowOrigin = "*") {
  return {
    ...BASE_JSON_HEADERS,
    "access-control-allow-origin": allowOrigin
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

function headerValue(headers = {}, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(name) || headers.get(name.toLowerCase()) || "";
  const target = name.toLowerCase();
  const key = Object.keys(headers).find((header) => header.toLowerCase() === target);
  return key ? String(headers[key] || "") : "";
}

function listFrom(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function corsForRequest(request, options = {}) {
  const allowedOrigins = listFrom(options.allowedOrigins);
  const origin = headerValue(request.headers, "origin");
  if (!allowedOrigins.length || allowedOrigins.includes("*")) {
    return {
      originAllowed: true,
      headers: jsonHeaders("*")
    };
  }

  const originAllowed = !origin || allowedOrigins.includes(origin);
  return {
    originAllowed,
    headers: jsonHeaders(originAllowed && origin ? origin : allowedOrigins[0])
  };
}

function tokenIsAuthorized(request, authToken = "") {
  const expected = String(authToken || "").trim();
  if (!expected) return true;
  const authorization = headerValue(request.headers, "authorization");
  const bearer = authorization.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  const explicit = headerValue(request.headers, "x-proofrank-token").trim();
  return bearer === expected || explicit === expected;
}

function isHttpUrl(value = "") {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function hostAllowed(host = "", allowedHosts = []) {
  if (!allowedHosts.length || allowedHosts.includes("*")) return true;
  const normalized = String(host || "").toLowerCase();

  return allowedHosts.some((allowed) => {
    const pattern = String(allowed || "").toLowerCase();
    if (!pattern) return false;
    if (pattern === normalized) return true;
    if (pattern.startsWith("*.")) return normalized.endsWith(pattern.slice(1));
    if (pattern.startsWith(".")) return normalized.endsWith(pattern);
    return normalized.endsWith(`.${pattern}`);
  });
}

function assertAllowedPayloadHosts(payload = {}, fields = [], allowedHosts = []) {
  if (!allowedHosts.length) return;

  for (const field of fields) {
    const value = payload[field];
    if (!value || !isHttpUrl(value)) continue;
    const host = new URL(value).hostname.toLowerCase();
    if (!hostAllowed(host, allowedHosts)) {
      throw new Error(`${field} host is not allowed: ${host}`);
    }
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
  const cors = corsForRequest(request, options);
  const responseHeaders = cors.headers;
  const allowedHosts = listFrom(options.allowedHosts);

  if (!cors.originAllowed) return json(403, { error: "Origin is not allowed." }, responseHeaders);
  if (method === "OPTIONS") return { status: 204, headers: responseHeaders, body: "" };
  if (method !== "GET" && !tokenIsAuthorized(request, options.authToken)) {
    return json(401, { error: "A valid ProofRank review token is required." }, responseHeaders);
  }
  if (method === "GET" && pathname === "/health") return json(200, { ok: true, service: "proofrank-live-review" }, responseHeaders);

  if (method === "POST" && pathname === "/api/review-event") {
    let payload;
    try {
      payload = parseBody(request.body);
    } catch (error) {
      return json(400, { error: error.message });
    }

    if (!payload.eventUrl) {
      return json(422, { error: "eventUrl is required." }, responseHeaders);
    }

    try {
      assertAllowedPayloadHosts(payload, ["eventUrl"], allowedHosts);
      const result = await eventCollector(payload, options.collectorOptions || {});
      const reviewPayload = payload.reviewFirstProject ? projectReviewPayload(result.projects?.[0]) : null;
      if (reviewPayload) {
        try {
          assertAllowedPayloadHosts(reviewPayload, ["repoUrl", "demoUrl", "eventUrl", "submissionUrl", "presentationUrl"], allowedHosts);
          const reviewedProject = await collector(reviewPayload, options.collectorOptions || {});
          result.projects = [reviewedProject, ...result.projects.slice(1)];
          result.reviewedProject = reviewedProject;
        } catch (error) {
          result.reviewError = error.message;
        }
      }
      return json(200, { mode: "live-event", ...result }, responseHeaders);
    } catch (error) {
      return json(422, { error: error.message }, responseHeaders);
    }
  }

  if (method !== "POST" || pathname !== "/api/review-project") {
    return json(404, { error: "Route not found." }, responseHeaders);
  }

  let payload;
  try {
    payload = parseBody(request.body);
  } catch (error) {
    return json(400, { error: error.message });
  }

  if (!payload.repoUrl) {
    return json(422, { error: "repoUrl is required." }, responseHeaders);
  }

  try {
    assertAllowedPayloadHosts(payload, ["repoUrl", "demoUrl", "eventUrl", "submissionUrl", "presentationUrl"], allowedHosts);
    const project = await collector(payload, options.collectorOptions || {});
    return json(200, { mode: "live", project }, responseHeaders);
  } catch (error) {
    return json(422, { error: error.message }, responseHeaders);
  }
}
