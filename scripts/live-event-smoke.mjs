import { EVENT_URL } from "../app/src/fixtures.js";
import { collectEventProjects } from "../app/src/liveEventReviewer.js";
import { createLiveFetchTextFromEnv, describeLiveFetchMode } from "../app/src/liveFetchers.js";
import { loadLocalEnv } from "./env-loader.mjs";

loadLocalEnv();

const eventUrl = process.argv[2] || EVENT_URL;
const collectionMode = describeLiveFetchMode(process.env);

const result = await collectEventProjects(
  {
    eventUrl
  },
  {
    fetchText: createLiveFetchTextFromEnv(process.env),
    collectionMode,
    now: () => new Date()
  }
);

console.log(
  JSON.stringify(
    {
      ok: true,
      collectionMode,
      eventUrl: result.eventUrl,
      projectCount: result.projectCount,
      eventTrace: {
        provider: result.eventTrace.provider,
        traceStatus: result.eventTrace.traceStatus,
        resultCount: result.eventTrace.resultCount,
        byteCount: result.eventTrace.byteCount,
        contentHash: result.eventTrace.contentHash,
        countsForSponsorFit: result.eventTrace.countsForSponsorFit,
        status: result.eventTrace.status
      },
      sampleProjects: result.projects.slice(0, 8).map((project) => ({
        id: project.id,
        title: project.title,
        team: project.team,
        brightDataRole: project.evidence?.brightDataRole,
        brightDataTools: project.evidence?.brightDataTools || [],
        traceStatus: project.brightDataTraces?.[0]?.traceStatus || "missing"
      }))
    },
    null,
    2
  )
);
