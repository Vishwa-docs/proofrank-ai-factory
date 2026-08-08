import { hasBrightDataSponsorProofBundle, brightDataTraceState } from "./scoring.js";
import { buildWinnerBenchmark } from "./winnerBenchmark.js";

function isReviewDraft(project = {}) {
  const evidence = project.evidence || {};
  const traceState = brightDataTraceState(project);
  const publicEvidenceFetched = evidence.hasGithub === true || evidence.hasPublicDemo === true || traceState === "direct";
  return (
    String(project.id || "").startsWith("review-") &&
    !hasBrightDataSponsorProofBundle(project) &&
    !["executed"].includes(traceState) &&
    !publicEvidenceFetched
  );
}

function usefulBuyerArtifact(project = {}) {
  const evidence = project.evidence || {};
  return Boolean(evidence.targetUser && evidence.clearPain && evidence.repeatableWorkflow);
}

function hasDistinctAngle(project = {}) {
  const evidence = project.evidence || {};
  return Boolean(evidence.lowCrowdOverlap || evidence.differentiation || (evidence.specificWedge && evidence.nonGenericAgent));
}

function primaryActionFor({ draft, sponsorBundle, benchmark }) {
  if (draft) return { action: "public", label: "Run public review" };
  if (!sponsorBundle) return { action: "live", label: "Add Bright Data evidence" };
  if (benchmark.gaps.length) return { action: "evidence", label: "Close open gaps" };
  return { action: "export", label: "Export memo" };
}

function competitionLabel(project = {}) {
  if (hasDistinctAngle(project)) return "Distinct";
  if ((project.scores?.originality || 0) >= 70) return "Defensible";
  return "Crowded";
}

export function buildPrizeBrief(project = {}, context = {}) {
  const benchmark = buildWinnerBenchmark(project);
  const sponsorBundle = hasBrightDataSponsorProofBundle(project);
  const traceState = brightDataTraceState(project);
  const draft = isReviewDraft(project);
  const action = primaryActionFor({ draft, sponsorBundle, benchmark });
  const totalProjects = Number(context.totalProjects || 0);
  const fieldSize = totalProjects > 1 ? `${totalProjects} projects in this room` : "This review room";

  if (draft) {
    return {
      badge: "Link-only draft",
      title: "Collect evidence before judging",
      summary:
        "This is not a ranking score yet. Public review must fetch repo and demo signals before the project can be compared or exported for sponsor review.",
      actions: [
        action,
        { action: "copy", label: "Copy replay link" },
        { action: "live", label: "Bright Data evidence run" }
      ],
      lanes: [
        {
          label: "Public evidence",
          status: "Pending",
          detail: "Repo and demo links are accepted, but content has not been fetched."
        },
        {
          label: "Bright Data lane",
          status: "Planned",
          detail: "Source fetch, web search, and discovery should run after the public check."
        },
        {
          label: "Judge artifact",
          status: "Not ready",
          detail: "Create the public review before exporting a reviewer memo."
        }
      ],
      fieldPressure: [
        {
          label: "Room state",
          detail: `${fieldSize}; drafts stay separate from evidence-backed entries.`
        },
        {
          label: "Sponsor read",
          detail: "Bright Data must be visibly load-bearing, not just listed as a technology."
        }
      ]
    };
  }

  const distinctStatus = competitionLabel(project);
  const buyerStatus = usefulBuyerArtifact(project) ? "Useful" : "Thin";
  const brightStatus = sponsorBundle ? "Ready" : traceState === "direct" ? "Direct only" : "Gated";
  const badge = sponsorBundle && benchmark.score >= 90 ? "Bright Data prize case" : "Prize case gated";
  const title =
    sponsorBundle && benchmark.score >= 90
      ? "Shortlist for sponsor review"
      : sponsorBundle
        ? "Tighten the prize case"
        : "Upgrade the evidence story";
  const summary = sponsorBundle
    ? "Bright Data source, search, and discovery evidence is visible and tied to a trace-backed sponsor memo. The next job is to defend the sponsor story against similar live-web projects."
    : "Public evidence is useful, but the Bright Data prize case needs server-side source, search, and discovery evidence before it can stand out.";

  return {
    badge,
    title,
    summary,
    actions: [
      action,
      { action: "evidence", label: "Open Bright Data receipt" },
      { action: "copy", label: "Copy replay link" }
    ],
    lanes: [
      {
        label: "Bright Data lane",
        status: brightStatus,
        detail: sponsorBundle
          ? "Source fetch, search, and discovery are attached to the selected review."
          : "Run the Bright Data evidence run so live-web evidence becomes the main story."
      },
      {
        label: "Competition lane",
        status: distinctStatus,
        detail:
          distinctStatus === "Crowded"
            ? "The project needs sharper prior-art separation before a sponsor can defend it."
            : "The project has a specific wedge, not just another generic assistant."
      },
      {
        label: "Buyer lane",
        status: buyerStatus,
        detail: usefulBuyerArtifact(project)
          ? "The output maps to a repeatable reviewer workflow and memo."
          : "Name the target reviewer, pain, and repeatable workflow more plainly."
      }
    ],
    fieldPressure: [
      {
        label: "Room pressure",
        detail: `${fieldSize}; competing live-web products are using monitoring, diligence, and source-backed briefs.`
      },
      {
        label: "Benchmark",
        detail: `${benchmark.tier} at ${benchmark.score}; ${
          benchmark.gaps[0]?.action || "keep the Bright Data evidence visible and exportable"
        }.`
      },
      {
        label: "Sponsor read",
        detail: sponsorBundle
          ? "The sponsor can inspect how Bright Data changed the review, not just see a logo."
          : "The sponsor still needs to see Bright Data source, search, and discovery in the product path."
      }
    ]
  };
}
