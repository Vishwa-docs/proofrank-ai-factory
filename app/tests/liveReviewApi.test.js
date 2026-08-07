import assert from "node:assert/strict";
import { handleLiveReviewRequest } from "../src/liveReviewApi.js";

const collector = async (input) => ({
  id: "review-demo",
  title: input.title || "Collected Project",
  githubUrl: input.repoUrl,
  evidence: {
    hasGithub: true
  }
});

const eventCollector = async (input) => ({
  eventUrl: input.eventUrl,
  projectCount: 1,
  eventTrace: {
    provider: "bright-data",
    traceStatus: "executed"
  },
  projects: [
    {
      id: "project-y",
      title: "Project Y",
      team: "Team Y",
      githubUrl: "https://github.com/example/project-y",
      demoUrl: "https://project-y.example"
    }
  ]
});

const options = { collector, eventCollector };

const health = await handleLiveReviewRequest({ method: "GET", pathname: "/health" }, options);
assert.equal(health.status, 200);
assert.deepEqual(JSON.parse(health.body), { ok: true, service: "proofrank-live-review" });

const review = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-project",
    body: JSON.stringify({
      repoUrl: "https://github.com/Vishwa-docs/proofrank-ai-factory",
      title: "ProofRank"
    })
  },
  options
);

assert.equal(review.status, 200);
const reviewJson = JSON.parse(review.body);
assert.equal(reviewJson.mode, "live");
assert.equal(reviewJson.project.title, "ProofRank");
assert.equal(reviewJson.project.githubUrl, "https://github.com/Vishwa-docs/proofrank-ai-factory");

const malformed = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-project",
    body: "{nope"
  },
  options
);
assert.equal(malformed.status, 400);
assert.match(JSON.parse(malformed.body).error, /Invalid JSON/);

const missingRepo = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-project",
    body: JSON.stringify({ demoUrl: "https://example.com" })
  },
  options
);
assert.equal(missingRepo.status, 422);
assert.match(JSON.parse(missingRepo.body).error, /repoUrl/);

const eventReview = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-event",
    body: JSON.stringify({
      eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits"
    })
  },
  options
);

assert.equal(eventReview.status, 200);
const eventJson = JSON.parse(eventReview.body);
assert.equal(eventJson.mode, "live-event");
assert.equal(eventJson.projectCount, 1);
assert.equal(eventJson.projects[0].title, "Project Y");
assert.equal(eventJson.reviewedProject, undefined);

const chainedEventReview = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-event",
    body: JSON.stringify({
      eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits",
      reviewFirstProject: true
    })
  },
  options
);

assert.equal(chainedEventReview.status, 200);
const chainedJson = JSON.parse(chainedEventReview.body);
assert.equal(chainedJson.reviewedProject.title, "Project Y");
assert.equal(chainedJson.reviewedProject.githubUrl, "https://github.com/example/project-y");
assert.equal(chainedJson.projects[0].id, "review-demo");
assert.equal(chainedJson.projects[0].githubUrl, "https://github.com/example/project-y");

const eventWithoutGithub = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-event",
    body: JSON.stringify({
      eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits",
      reviewFirstProject: true
    })
  },
  {
    ...options,
    eventCollector: async (input) => ({
      ...(await eventCollector(input)),
      projects: [{ id: "no-repo", title: "No Repo", githubUrl: "public-github-linked" }]
    })
  }
);

assert.equal(eventWithoutGithub.status, 200);
assert.equal(JSON.parse(eventWithoutGithub.body).reviewedProject, undefined);

const eventWithReviewFailure = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-event",
    body: JSON.stringify({
      eventUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits",
      reviewFirstProject: true
    })
  },
  {
    ...options,
    collector: async () => {
      throw new Error("project review failed");
    }
  }
);

assert.equal(eventWithReviewFailure.status, 200);
const failedChainJson = JSON.parse(eventWithReviewFailure.body);
assert.equal(failedChainJson.reviewedProject, undefined);
assert.match(failedChainJson.reviewError, /project review failed/);
assert.equal(failedChainJson.projects[0].title, "Project Y");

const missingEventUrl = await handleLiveReviewRequest(
  {
    method: "POST",
    pathname: "/api/review-event",
    body: JSON.stringify({})
  },
  options
);
assert.equal(missingEventUrl.status, 422);
assert.match(JSON.parse(missingEventUrl.body).error, /eventUrl/);

const notFound = await handleLiveReviewRequest({ method: "GET", pathname: "/api/unknown" }, options);
assert.equal(notFound.status, 404);

console.log("live review API tests passed");
