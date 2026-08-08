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

function isDraft(project = {}) {
  return String(project.id || "").startsWith("review-") && !hasBrightDataBundle(project);
}

export function buildVisitorBrief(project = {}) {
  const title = displayText(project.title || "Selected project");
  const hasDemo = Boolean(project.demoUrl);

  if (isDraft(project)) {
    return {
      variant: "draft",
      badge: "Link-only draft",
      title: "Draft review created",
      summary: `${title} is in the review queue. It is useful for sharing and triage, but it is not live evidence yet.`,
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
          detail: "scrape_as_markdown + search_engine + discover planned, not executed."
        },
        {
          label: "Best next click",
          detail: "Share the draft link, then run private Bright Data source, search, and discovery collection."
        }
      ],
      actions: [
        { label: "Copy draft link", action: "copy" },
        { label: "Run live evidence", action: "live" },
        { label: "Export draft memo", action: "export" }
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
          detail: project.runReceipt?.signature ? "Server record is attached to the evidence receipt." : "Evidence exists; server record still needs final confirmation."
        },
        {
          label: "Best next click",
          detail: "Open the evidence view, export the memo, then complete final submission from the team account."
        }
      ],
      actions: [
        { label: "Open evidence", action: "evidence" },
        { label: "Export memo", action: "export" },
        { label: "Final submission", action: "live" }
      ]
    };
  }

  return {
    variant: "review",
    badge: "Needs evidence",
    title: "Review needs live evidence",
    summary: `${title} has project context, but the evidence path still needs a live collection run.`,
    rows: [
      {
        label: "What was checked",
        detail: project.evidence?.hasGithub || project.evidence?.hasPublicDemo ? "Some project links are attached to the review." : "No strong public source checks are attached yet."
      },
      {
        label: "What still is not checked",
        detail: "Bright Data source, search, discovery, and final evidence receipt are still incomplete."
      },
      {
        label: "Best next click",
        detail: "Run live evidence or open the evidence view to see which traces are missing."
      }
    ],
    actions: [
      { label: "Open evidence", action: "evidence" },
      { label: "Run live evidence", action: "live" },
      { label: "Export memo", action: "export" }
    ]
  };
}
