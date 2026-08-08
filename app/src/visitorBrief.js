function displayText(value = "") {
  return String(value)
    .replace(/[—–]/g, "-")
    .replace(/→/g, "to")
    .replace(/\s+/g, " ")
    .trim();
}

function hasExecutedTrace(project = {}, matcher) {
  return (project.brightDataTraces || []).some((trace) => {
    const text = `${trace.tool || ""} ${trace.queryOrUrl || ""}`.toLowerCase();
    const status = String(trace.traceStatus || trace.status || "").toLowerCase();
    return status === "executed" && matcher(text);
  });
}

function hasBrightDataBundle(project = {}) {
  const source = hasExecutedTrace(project, (text) => /scrape|source|markdown|scraper/.test(text));
  const search = hasExecutedTrace(project, (text) => /search|serp/.test(text));
  const discover = hasExecutedTrace(project, (text) => /discover/.test(text));
  return source && search && discover;
}

function hasDirectEvidence(project = {}) {
  return (
    project.evidence?.repoMetadataCollected === true ||
    project.evidence?.hasGithub === true ||
    project.evidence?.hasPublicDemo === true ||
    (project.brightDataTraces || []).some((trace) => trace.provider === "direct" && String(trace.traceStatus || "").toLowerCase() === "executed")
  );
}

function isDraft(project = {}) {
  return String(project.id || "").startsWith("review-") && !hasBrightDataBundle(project) && !hasDirectEvidence(project);
}

export function buildVisitorBrief(project = {}) {
  const title = displayText(project.title || "Selected project");
  const hasDemo = Boolean(project.demoUrl);

  if (isDraft(project)) {
    return {
      variant: "draft",
      badge: "Link-only draft",
      title: "Draft review created",
      summary: `${title} is in the review queue. It is useful for sharing and triage, but it is not collected evidence yet.`,
      rows: [
        {
          label: "What was checked",
          detail: `${project.githubUrl ? "GitHub URL format accepted" : "GitHub URL missing"}${hasDemo ? "; demo URL format accepted" : "; no demo URL supplied"}.`
        },
        {
          label: "What still is not checked",
          detail: "Repo content, demo reachability, functionality, and Bright Data evidence remain pending."
        },
        {
          label: "Bright Data plan",
          detail: "Source fetch, web search, and discovery are planned, not run yet."
        },
        {
          label: "Best next click",
          detail: "Share the draft link, then run public review or the Bright Data source, search, and discovery collection."
        }
      ],
      actions: [
        { label: "Copy replay link", action: "copy" },
        { label: "Run public review", action: "public" },
        { label: "Export draft memo", action: "export" }
      ]
    };
  }

  if (String(project.id || "").startsWith("review-") && hasDirectEvidence(project) && !hasBrightDataBundle(project)) {
    return {
      variant: "review",
      badge: "Public evidence",
      title: "Public review ready",
      summary: `${title} has real public repo/demo evidence. Add private Bright Data evidence before treating it as prize-track ready.`,
      rows: [
        {
          label: "What was checked",
          detail: "Public repository metadata, README/package evidence, and any supported demo URL that could be fetched."
        },
        {
          label: "What still is not checked",
          detail: "Bright Data source, search, discovery, and saved Bright Data review are still incomplete."
        },
        {
          label: "Best next click",
          detail: "Open Bright Data receipt, then run the Bright Data evidence collection when reviewer access is available."
        }
      ],
      actions: [
        { label: "Open Bright Data receipt", action: "evidence" },
        { label: "Bright Data evidence run", action: "live" },
        { label: "Export memo", action: "export" }
      ]
    };
  }

  if (hasBrightDataBundle(project)) {
    return {
      variant: "evidence",
      badge: "Bright Data ready",
      title: "Evidence-backed review",
      summary: `${title} has a Bright Data evidence path that judges can inspect before export.`,
      rows: [
        {
          label: "What was checked",
          detail: "Bright Data source fetch, search, and discovery evidence are attached to this review."
        },
        {
          label: "Review record",
          detail: project.runReceipt?.signature ? "Saved review is attached to the evidence view." : "Evidence exists; the saved review still needs final confirmation."
        },
        {
          label: "Best next click",
          detail: "Open the evidence view, export the memo, then submit on lablab.ai from the team account."
        }
      ],
      actions: [
        { label: "Open Bright Data receipt", action: "evidence" },
        { label: "Export memo", action: "export" },
        { label: "Final submission", action: "live" }
      ]
    };
  }

  return {
    variant: "review",
    badge: "Needs evidence",
    title: "Review needs evidence",
    summary: `${title} has project context, but the evidence path still needs public or sponsor collection.`,
    rows: [
      {
        label: "What was checked",
        detail: project.evidence?.hasGithub || project.evidence?.hasPublicDemo ? "Some project links are attached to the review." : "No strong public source checks are attached yet."
      },
      {
        label: "What still is not checked",
          detail: "Bright Data source, search, discovery, and saved review are still incomplete."
      },
      {
        label: "Best next click",
        detail: "Run public review or open the evidence view to see which source checks are missing."
      }
    ],
    actions: [
      { label: "Open Bright Data receipt", action: "evidence" },
      { label: "Run public review", action: "public" },
      { label: "Export memo", action: "export" }
    ]
  };
}
