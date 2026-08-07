import { brightDataTraceState, hasExecutedBrightDataTrace } from "./scoring.js";

function clampPercent(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function bool(value) {
  return value ? 1 : 0;
}

function compactReasons(reasons) {
  return reasons.filter(Boolean).slice(0, 4);
}

function sponsorJudge(project) {
  const evidence = project.evidence || {};
  const scores = project.scores || {};
  const tools = evidence.brightDataTools || [];
  const executedBrightTrace = hasExecutedBrightDataTrace(project);
  const traceState = brightDataTraceState(project);
  const confidence = clampPercent((scores.brightDataFit || 0) * 0.7 + bool(executedBrightTrace) * 12 + bool(evidence.proofReceipt) * 10 + Math.min(tools.length, 3) * 3);

  return {
    role: "Bright Data sponsor judge",
    stance:
      confidence >= 80
        ? "Bright Data appears load-bearing, visible, and sponsor-relevant."
        : confidence >= 55
          ? "Bright Data is useful but needs stronger replay proof."
          : "Bright Data is not yet central enough for the sponsor prize.",
    confidence,
    reasons: compactReasons([
      evidence.brightDataRole === "agentic" ? "Agentic Bright Data role is visible." : "",
      tools.length ? `${tools.join(", ")} are referenced.` : "",
      executedBrightTrace ? "Receipt includes executed Bright Data trace rows." : "",
      evidence.proofReceipt ? "Output is framed as a proof receipt rather than a generic summary." : ""
    ]),
    objections: compactReasons([
      !executedBrightTrace ? `Bright Data trace is ${traceState}, not executed.` : "",
      (scores.brightDataFit || 0) < 75 ? "Sponsor-fit score is below shortlist strength." : "",
      evidence.brightDataRole === "none" ? "Bright Data is not described as load-bearing." : ""
    ])
  };
}

function skepticalJudge(project) {
  const evidence = project.evidence || {};
  const scores = project.scores || {};
  const confidence = clampPercent(
    bool(evidence.hasPublicDemo) * 20 +
      bool(evidence.demoWorkflow) * 15 +
      bool(evidence.nativeBuilderExplained) * 16 +
      bool(evidence.builtDuringEvent) * 14 +
      bool(evidence.repoTreeCollected) * 10 +
      bool(evidence.packageManifestPresent) * 8 +
      bool(evidence.licensePresent) * 7 +
      bool(!evidence.secretRiskVisible) * 10
  );

  return {
    role: "Skeptical hackathon judge",
    stance:
      confidence >= 80
        ? "Eligibility concerns are mostly answered by public evidence."
        : confidence >= 55
          ? "The project is plausible but still has judge-facing gaps."
          : "The project needs stronger eligibility evidence before shortlist.",
    confidence,
    reasons: compactReasons([
      evidence.hasPublicDemo && evidence.demoWorkflow ? "Public demo and workflow evidence are present." : "",
      evidence.nativeBuilderExplained ? "native.builder usage is explained." : "",
      evidence.builtDuringEvent ? "Event-window commits are visible." : "",
      evidence.repoTreeCollected && evidence.packageManifestPresent ? "Repository tree and package manifest are inspectable." : "",
      evidence.licensePresent ? "License signal is present." : ""
    ]),
    objections: compactReasons([
      !evidence.hasPublicDemo ? "Public demo is missing or unreachable." : "",
      !evidence.nativeBuilderExplained ? "native.builder usage is not explained." : "",
      !evidence.builtDuringEvent ? "No public commits are visible inside the hackathon window." : "",
      evidence.secretRiskVisible ? "Potential secret-bearing public files or values need cleanup." : "",
      (scores.originality || 0) < 70 ? "Originality proof is still thin." : ""
    ])
  };
}

function businessBuyer(project) {
  const evidence = project.evidence || {};
  const scores = project.scores || {};
  const confidence = clampPercent((scores.businessValue || 0) * 0.65 + bool(evidence.targetUser) * 10 + bool(evidence.clearPain) * 10 + bool(evidence.buyerExists) * 10 + bool(evidence.repeatableWorkflow) * 5);

  return {
    role: "Business buyer",
    stance:
      confidence >= 80
        ? "The workflow maps to a real buyer with repeatable review pain."
        : confidence >= 55
          ? "The buyer case is credible but needs sharper urgency."
          : "The business value is not yet concrete enough.",
    confidence,
    reasons: compactReasons([
      evidence.targetUser ? "Target user is explicit." : "",
      evidence.clearPain ? "Manual review pain is clear." : "",
      evidence.repeatableWorkflow ? "Workflow can be repeated across many submissions." : "",
      evidence.buyerExists ? "Sponsor, accelerator, or reviewer buyer exists." : "",
      evidence.urgency ? "Deadline pressure creates urgency." : ""
    ]),
    objections: compactReasons([
      !evidence.targetUser ? "Target user is still vague." : "",
      !evidence.clearPain ? "Pain statement is not concrete enough." : "",
      !evidence.buyerExists ? "Buyer or budget owner is not proven." : "",
      !evidence.repeatableWorkflow ? "Workflow does not yet look repeatable." : ""
    ])
  };
}

function disputeLog(project, panel) {
  const evidence = project.evidence || {};
  const scores = project.scores || {};
  const disputes = [];

  disputes.push({
    topic: "Sponsor dependency",
    status: (scores.brightDataFit || 0) >= 75 && hasExecutedBrightDataTrace(project) ? "resolved" : "open",
    detail:
      (scores.brightDataFit || 0) >= 75 && hasExecutedBrightDataTrace(project)
        ? "Bright Data usage is executed and visible enough for a sponsor-side review."
        : "Need a replayable Bright Data run before claiming sponsor-prize strength."
  });

  if (!evidence.hasPublicDemo || !evidence.nativeBuilderExplained || !evidence.builtDuringEvent) {
    disputes.push({
      topic: "Eligibility",
      status: "open",
      detail: "Demo, native.builder explanation, or event-window proof is incomplete."
    });
  }

  if (evidence.secretRiskVisible || !evidence.licensePresent) {
    disputes.push({
      topic: "Public-source hygiene",
      status: evidence.secretRiskVisible ? "open" : "watch",
      detail: evidence.secretRiskVisible ? "Public repo may expose sensitive files or credential-looking values." : "License evidence should be kept visible for submission compliance."
    });
  }

  if ((scores.originality || 0) < 70 || !evidence.lowCrowdOverlap) {
    disputes.push({
      topic: "Originality",
      status: "watch",
      detail: "Prior-art discovery should be rerun before final submission."
    });
  }

  const spread = Math.max(...panel.map((judge) => judge.confidence)) - Math.min(...panel.map((judge) => judge.confidence));
  if (spread >= 30) {
    disputes.push({
      topic: "Panel disagreement",
      status: "watch",
      detail: "Judges disagree materially; use the objections as the next improvement queue."
    });
  }

  return disputes;
}

function recommendation(panel, disputes) {
  const average = panel.reduce((sum, judge) => sum + judge.confidence, 0) / panel.length;
  const openDisputes = disputes.filter((dispute) => dispute.status === "open").length;
  const confidence = clampPercent(average - openDisputes * 7);

  if (confidence >= 82 && openDisputes === 0) {
    return {
      label: "Push for sponsor shortlist",
      confidence,
      action: "Use this project as the final demo target and record the sponsor-prize walkthrough."
    };
  }

  if (confidence >= 65) {
    return {
      label: "Improve then submit",
      confidence,
      action: "Close open disputes, then export the proof receipt and final packet."
    };
  }

  return {
    label: "Hold until evidence improves",
    confidence,
    action: "Do not rely on this project for the prize until missing evidence is resolved."
  };
}

export function buildTribunal(project) {
  const panel = [sponsorJudge(project), skepticalJudge(project), businessBuyer(project)];
  const disputes = disputeLog(project, panel);

  return {
    panel,
    disputes,
    finalRecommendation: recommendation(panel, disputes)
  };
}
