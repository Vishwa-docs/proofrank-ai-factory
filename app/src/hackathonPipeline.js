import { EVENT_URL } from "./fixtures.js";

export const DEFAULT_HACKATHON_PROFILE = {
  id: "ai-factory-nativebuilder-2026",
  name: "AI Factory",
  platform: "lablab.ai",
  eventUrl: EVENT_URL,
  audience: "AI-native app builders, judges, and sponsor teams",
  submissionWindow: "August 3-10, 2026",
  primarySponsorLane: "Best Agentic Use of Bright Data",
  sponsorPrize: "$500 cash plus $500 Bright Data credits",
  requiredArtifacts: [
    "functional public app",
    "native.builder project or app URL",
    "under-three-minute demo video",
    "project description",
    "external APIs and datasets list"
  ],
  judgingCriteria: [
    { label: "Application of Technology", weight: 25 },
    { label: "Presentation", weight: 25 },
    { label: "Business Value", weight: 25 },
    { label: "Originality", weight: 25 }
  ],
  sponsorEvidenceStandard:
    "Bright Data should collect source, search, and discovery evidence that materially changes the reviewer memo."
};

export const GENERIC_HACKATHON_PROFILE = {
  id: "custom-hackathon",
  name: "Custom hackathon",
  platform: "event page",
  eventUrl: "",
  audience: "builders, judges, sponsors, and program operators",
  submissionWindow: "event-defined",
  primarySponsorLane: "Sponsor technology fit",
  sponsorPrize: "event-defined",
  requiredArtifacts: [
    "public app or prototype",
    "source repository",
    "demo or walkthrough",
    "problem and target-user summary",
    "technology and dataset list"
  ],
  judgingCriteria: [
    { label: "Eligibility", weight: 20 },
    { label: "Technology Fit", weight: 25 },
    { label: "Business Value", weight: 20 },
    { label: "Originality", weight: 20 },
    { label: "Presentation", weight: 15 }
  ],
  sponsorEvidenceStandard:
    "Collect public source, demo, prior-art, and sponsor-tool evidence before ranking or awarding."
};

export const HACKATHON_PIPELINE_STAGES = [
  {
    id: "brief",
    actor: "Organizer",
    stage: "Brief and rules",
    builderPain: "Rules, prize tracks, deadlines, and required artifacts are scattered across long event pages.",
    judgePain: "Rubrics are hard to translate into consistent evidence checks.",
    proofrankFeature: "Event profile extractor with rubric, dates, artifacts, sponsor lanes, and eligibility gates.",
    brightDataUse: "scrape_as_markdown for event rules and sponsor pages."
  },
  {
    id: "build",
    actor: "Builder",
    stage: "Build and iterate",
    builderPain: "Teams do not know if their project is prize-shaped until the deadline is close.",
    judgePain: "Submissions often overclaim technology usage or omit proof of the real workflow.",
    proofrankFeature: "Builder preflight: repo/demo checks, missing-artifact list, pitch claim ledger, and next-best fixes.",
    brightDataUse: "scrape_as_markdown for repo/demo pages; discover for similar products and prior art."
  },
  {
    id: "submit",
    actor: "Builder",
    stage: "Submit",
    builderPain: "Submission forms ask for URLs, descriptions, categories, technologies, and demo videos under time pressure.",
    judgePain: "Incomplete or inaccessible entries waste judging time.",
    proofrankFeature: "Submission pack generator with form-ready copy, evidence receipt, and accessibility warnings.",
    brightDataUse: "search_engine and scrape checks for public reachability and duplicate project/title risk."
  },
  {
    id: "triage",
    actor: "Judge",
    stage: "Triage",
    builderPain: "Good projects can be missed if judges only see a short card or broken demo link.",
    judgePain: "Large fields require fast prioritization without becoming arbitrary.",
    proofrankFeature: "Evidence-backed queue: shortlist, needs-evidence, recuse/conflict, and sponsor-lane filters.",
    brightDataUse: "Batch source/search/discovery traces with cost and freshness budgets."
  },
  {
    id: "deep-review",
    actor: "Sponsor",
    stage: "Sponsor review",
    builderPain: "Sponsor prizes need proof that the sponsor tool is actually load-bearing.",
    judgePain: "Sponsor teams need a defensible reason to choose one integration over another.",
    proofrankFeature: "Sponsor dependency score with trace-visible proof, gap disputes, and judge readout export.",
    brightDataUse: "Remote MCP, Scraper Studio, Web Unlocker, and CLI replay commands."
  },
  {
    id: "postmortem",
    actor: "Organizer",
    stage: "Winner audit and postmortem",
    builderPain: "Teams need useful feedback after results, not just silence.",
    judgePain: "Organizers need a transparent record if decisions are questioned.",
    proofrankFeature: "Prize audit trail, builder feedback cards, and event-quality analytics for the next hackathon.",
    brightDataUse: "Scheduled freshness checks for live demos, repos, claims, and public winner pages."
  }
];

function isAiFactoryUrl(value = "") {
  return /lablab\.ai\/ai-hackathons\/nativebuilder-build-without-limits/i.test(value);
}

export function buildHackathonProfile(eventUrl = EVENT_URL, overrides = {}) {
  const cleanUrl = String(eventUrl || "").trim();
  const base = isAiFactoryUrl(cleanUrl || EVENT_URL) ? DEFAULT_HACKATHON_PROFILE : GENERIC_HACKATHON_PROFILE;

  return {
    ...base,
    ...overrides,
    id: overrides.id || base.id,
    eventUrl: cleanUrl || base.eventUrl,
    judgingCriteria: overrides.judgingCriteria || base.judgingCriteria,
    requiredArtifacts: overrides.requiredArtifacts || base.requiredArtifacts
  };
}

export function summarizeHackathonPipeline(profile = DEFAULT_HACKATHON_PROFILE) {
  const criteriaWeight = profile.judgingCriteria.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  const sponsorStageCount = HACKATHON_PIPELINE_STAGES.filter((stage) => stage.brightDataUse).length;

  return {
    headline: `${profile.name}: ${profile.primarySponsorLane}`,
    eventUrl: profile.eventUrl,
    artifactCount: profile.requiredArtifacts.length,
    criteriaCount: profile.judgingCriteria.length,
    criteriaWeight,
    sponsorStageCount,
    builderLoop: HACKATHON_PIPELINE_STAGES.filter((stage) => ["build", "submit"].includes(stage.id)).map((stage) => stage.proofrankFeature),
    judgeLoop: HACKATHON_PIPELINE_STAGES.filter((stage) => ["triage", "deep-review"].includes(stage.id)).map((stage) => stage.proofrankFeature),
    operatorLoop: HACKATHON_PIPELINE_STAGES.filter((stage) => ["brief", "postmortem"].includes(stage.id)).map((stage) => stage.proofrankFeature)
  };
}
