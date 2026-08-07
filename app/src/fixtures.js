export const EVENT_URL = "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits";

export const COLLECTED_AT = "2026-08-07T10:30:00+05:30";

export const fixtureProjects = [
  {
    id: "proofrank",
    title: "ProofRank",
    team: "SilverSpoon",
    summary:
      "Agentic submission truth auditor that ranks hackathon projects with source-backed proof receipts for accessibility, originality, sponsor usage, and review risk.",
    eventUrl: EVENT_URL,
    submissionUrl: "",
    demoUrl: "local-reference-app",
    githubUrl: "local-workspace",
    presentationUrl: "submission/pitch-deck.md",
    createdAt: "2026-08-07",
    domain: "Governance",
    technologies: [
      "native.builder",
      "Bright Data Remote MCP",
      "Bright Data SERP API",
      "Bright Data Web Scraper API",
      "Bright Data CLI"
    ],
    trackTags: ["Business", "Utility and Tools", "Web Scraping & Data Extraction"],
    evidence: {
      hasDemo: true,
      hasPublicDemo: false,
      hasGithub: true,
      hasPresentation: true,
      nativeBuilderExplained: true,
      builtDuringEvent: true,
      isFunctional: true,
      notLandingPage: true,
      demoWorkflow: true,
      conciseSummary: true,
      targetUser: true,
      clearPain: true,
      repeatableWorkflow: true,
      buyerExists: true,
      urgency: true,
      differentiation: true,
      lowCrowdOverlap: true,
      proofReceipt: true,
      specificWedge: true,
      nonGenericAgent: true,
      brightDataRole: "agentic",
      brightDataTools: ["Remote MCP", "SERP API", "Web Scraper API", "CLI"],
      agenticLoop: true,
      brightDataTrace: true
    },
    evidenceItems: [
      {
        id: "proofrank-1",
        sourceType: "design",
        sourceUrl: "docs/superpowers/specs/2026-08-07-proofrank-design.md",
        title: "Competition-aware design",
        excerpt:
          "The product is scoped to public submission verification, a judge and sponsor workflow with obvious Bright Data dependence.",
        collectedAt: COLLECTED_AT,
        collector: "Codex design agent",
        confidence: 0.91,
        supports: ["Originality", "Business value"],
        limitations: "Native.builder public URL must still be published before final submission."
      },
      {
        id: "proofrank-2",
        sourceType: "adapter",
        sourceUrl: "app/src/brightDataAdapter.js",
        title: "Bright Data trace model",
        excerpt:
          "Live mode maps event and project URLs into Remote MCP, SERP, Web Scraper API, and CLI collection steps.",
        collectedAt: COLLECTED_AT,
        collector: "Bright Data adapter",
        confidence: 0.86,
        supports: ["Application of technology"],
        limitations: "Local demo generates integration commands rather than calling private APIs from the browser."
      }
    ],
    brightDataTraces: [
      {
        mode: "planned-live",
        tool: "Remote MCP",
        queryOrUrl: EVENT_URL,
        resultCount: 31,
        status: "scoped for native.builder live mode",
        collectedAt: COLLECTED_AT
      },
      {
        mode: "planned-live",
        tool: "SERP API",
        queryOrUrl: "exact project title and team similarity checks",
        resultCount: 10,
        status: "scoped for originality audit",
        collectedAt: COLLECTED_AT
      }
    ]
  },
  {
    id: "half-life",
    title: "Half-Life - Decisions That Stopped Being True",
    team: "Kaizu",
    summary:
      "Records why a business decision was made, re-checks each premise against the live web on its own schedule, and retracts the decision when a premise fails.",
    eventUrl: EVENT_URL,
    submissionUrl:
      "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/kaizu/half-life-decisions-that-stopped-being-true",
    demoUrl: "https://3w7lf7mggbc22wz8qi0687ry.nativelyai.app",
    githubUrl: "public-github-linked",
    presentationUrl: "public-presentation-linked",
    createdAt: "2026-08-06",
    domain: "Governance",
    technologies: ["Bright Data Datasets", "Bright Data SERP API", "AI/ML API", "Speechmatics api"],
    trackTags: ["Agent Builder", "Business", "Knowledge Base", "Productivity"],
    evidence: {
      hasDemo: true,
      hasPublicDemo: true,
      hasGithub: true,
      hasPresentation: true,
      nativeBuilderExplained: true,
      builtDuringEvent: true,
      isFunctional: true,
      notLandingPage: true,
      demoWorkflow: true,
      conciseSummary: true,
      targetUser: true,
      clearPain: true,
      repeatableWorkflow: true,
      buyerExists: true,
      urgency: true,
      differentiation: true,
      lowCrowdOverlap: true,
      proofReceipt: true,
      specificWedge: true,
      nonGenericAgent: true,
      brightDataRole: "agentic",
      brightDataTools: ["SERP API", "Datasets"],
      agenticLoop: true,
      brightDataTrace: true
    },
    evidenceItems: [
      {
        id: "half-life-1",
        sourceType: "submission",
        sourceUrl:
          "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/kaizu/half-life-decisions-that-stopped-being-true",
        title: "Submission page",
        excerpt:
          "Bright Data fetches fresh evidence from the live web over Remote MCP and failed premises propagate into decision retraction.",
        collectedAt: COLLECTED_AT,
        collector: "Saved lablab page",
        confidence: 0.9,
        supports: ["Bright Data usage", "Originality"],
        limitations: "Receipt does not independently execute the app."
      }
    ],
    brightDataTraces: [
      {
        mode: "demo",
        tool: "SERP API",
        queryOrUrl: "decision premise verification",
        resultCount: 5,
        status: "claimed load-bearing",
        collectedAt: COLLECTED_AT
      }
    ]
  },
  {
    id: "askable",
    title: "Askable",
    team: "NEURENTIA",
    summary:
      "Turns any video into a source that can be queried in plain language, with answers linked to exact transcript seconds.",
    eventUrl: EVENT_URL,
    submissionUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/neurentia/askable",
    demoUrl: "https://bwpoxvkbjk5akz6bm7z430968.nativelyai.app",
    githubUrl: "public-github-linked",
    presentationUrl: "public-presentation-linked",
    createdAt: "2026-08-06",
    domain: "Knowledge",
    technologies: ["Bright Data Proxy Networks", "Bright Data Web Scraper API", "Speechmatics api", "AI/ML API"],
    trackTags: ["Video", "Utility and Tools", "Knowledge Base", "Productivity"],
    evidence: {
      hasDemo: true,
      hasPublicDemo: true,
      hasGithub: true,
      hasPresentation: true,
      nativeBuilderExplained: true,
      builtDuringEvent: true,
      isFunctional: true,
      notLandingPage: true,
      demoWorkflow: true,
      conciseSummary: true,
      targetUser: true,
      clearPain: true,
      repeatableWorkflow: true,
      buyerExists: true,
      urgency: true,
      differentiation: true,
      lowCrowdOverlap: false,
      proofReceipt: true,
      specificWedge: true,
      nonGenericAgent: true,
      brightDataRole: "load-bearing",
      brightDataTools: ["Proxy Networks", "Web Scraper API"],
      agenticLoop: false,
      brightDataTrace: true
    },
    evidenceItems: [
      {
        id: "askable-1",
        sourceType: "submission",
        sourceUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/neurentia/askable",
        title: "Submission page",
        excerpt:
          "Bright Data fetches transcripts for YouTube videos, while Speechmatics handles uploaded files.",
        collectedAt: COLLECTED_AT,
        collector: "Saved lablab page",
        confidence: 0.88,
        supports: ["Application of technology"],
        limitations: "Bright Data use is important, but less agentic than a self-directed audit loop."
      }
    ],
    brightDataTraces: [
      {
        mode: "demo",
        tool: "Web Scraper API",
        queryOrUrl: "YouTube transcript acquisition",
        resultCount: 1,
        status: "claimed load-bearing",
        collectedAt: COLLECTED_AT
      }
    ]
  },
  {
    id: "civictwin",
    title: "CivicTwin - Proof-Carrying Rule Twin",
    team: "Purrwolf",
    summary:
      "Compiles official rules into proof receipts so a multilingual small-business founder can see what changes when one operating choice changes.",
    eventUrl: EVENT_URL,
    submissionUrl:
      "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/purrwolf/civictwin-proof-carrying-rule-twin",
    demoUrl: "https://de2ryot975yrukt7xh4gymb1q.nativelyai.app",
    githubUrl: "public-github-linked",
    presentationUrl: "public-presentation-linked",
    createdAt: "2026-08-05",
    domain: "Regulatory",
    technologies: ["Bright Data Web Scraper API", "AI/ML API", "Speechmatics api"],
    trackTags: ["Legal", "Business", "Web Application"],
    evidence: {
      hasDemo: true,
      hasPublicDemo: true,
      hasGithub: true,
      hasPresentation: true,
      nativeBuilderExplained: true,
      builtDuringEvent: true,
      isFunctional: true,
      notLandingPage: true,
      demoWorkflow: true,
      conciseSummary: true,
      targetUser: true,
      clearPain: true,
      repeatableWorkflow: true,
      buyerExists: true,
      urgency: true,
      differentiation: true,
      lowCrowdOverlap: true,
      proofReceipt: true,
      specificWedge: true,
      nonGenericAgent: true,
      brightDataRole: "load-bearing",
      brightDataTools: ["Web Scraper API"],
      agenticLoop: true,
      brightDataTrace: true
    },
    evidenceItems: [
      {
        id: "civictwin-1",
        sourceType: "submission",
        sourceUrl:
          "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/purrwolf/civictwin-proof-carrying-rule-twin",
        title: "Submission page",
        excerpt:
          "Every decision opens a proof receipt containing triggering fact, rule identifier, source URL, clause, retrieval date, confidence, and unresolved boundary.",
        collectedAt: COLLECTED_AT,
        collector: "Saved lablab page",
        confidence: 0.91,
        supports: ["Trust surface", "Business value"],
        limitations: "Bright Data role is official-source acquisition rather than full web-wide orchestration."
      }
    ],
    brightDataTraces: [
      {
        mode: "demo",
        tool: "Web Scraper API",
        queryOrUrl: "official permitting source acquisition",
        resultCount: 8,
        status: "claimed load-bearing",
        collectedAt: COLLECTED_AT
      }
    ]
  },
  {
    id: "querypex",
    title: "Querypex - AI Data Analyst with Full Transparency",
    team: "Cal_AI",
    summary:
      "Connects to large datasets, discovers insights, and answers questions in plain English while showing the SQL behind every answer.",
    eventUrl: EVENT_URL,
    submissionUrl:
      "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/calai/querypex-ai-data-analyst-with-full-transparency",
    demoUrl: "public-demo-linked",
    githubUrl: "public-github-linked",
    presentationUrl: "public-presentation-linked",
    createdAt: "2026-08-06",
    domain: "Analytics",
    technologies: ["Anthropic Claude", "Bright Data Web Scraper API"],
    trackTags: ["Data", "Business", "Web Application"],
    evidence: {
      hasDemo: true,
      hasPublicDemo: true,
      hasGithub: true,
      hasPresentation: true,
      nativeBuilderExplained: true,
      builtDuringEvent: true,
      isFunctional: true,
      notLandingPage: true,
      demoWorkflow: true,
      conciseSummary: true,
      targetUser: true,
      clearPain: true,
      repeatableWorkflow: true,
      buyerExists: true,
      urgency: false,
      differentiation: true,
      lowCrowdOverlap: false,
      proofReceipt: true,
      specificWedge: false,
      nonGenericAgent: false,
      brightDataRole: "supporting",
      brightDataTools: ["Web Scraper API"],
      agenticLoop: false,
      brightDataTrace: true
    },
    evidenceItems: [
      {
        id: "querypex-1",
        sourceType: "submission-card",
        sourceUrl: EVENT_URL,
        title: "Submission card",
        excerpt:
          "AI data analyst that connects to datasets and shows exact SQL behind every answer.",
        collectedAt: COLLECTED_AT,
        collector: "Saved lablab page",
        confidence: 0.72,
        supports: ["Presentation", "Application of technology"],
        limitations: "Limited public detail about Bright Data being central to the workflow."
      }
    ],
    brightDataTraces: [
      {
        mode: "demo",
        tool: "Web Scraper API",
        queryOrUrl: "dataset enrichment",
        resultCount: 2,
        status: "claimed supporting",
        collectedAt: COLLECTED_AT
      }
    ]
  },
  {
    id: "countersign",
    title: "Countersign",
    team: "Countersign",
    summary:
      "Phone-first human gate for autonomous agent spending. Agents propose purchases, mandates set rules, and humans countersign exceptions.",
    eventUrl: EVENT_URL,
    submissionUrl: "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/countersign/countersign",
    demoUrl: "public-demo-linked",
    githubUrl: "",
    presentationUrl: "public-presentation-linked",
    createdAt: "2026-08-06",
    domain: "Operations",
    technologies: ["AI/ML API"],
    trackTags: ["Business", "Productivity"],
    evidence: {
      hasDemo: true,
      hasPublicDemo: true,
      hasGithub: false,
      hasPresentation: true,
      nativeBuilderExplained: false,
      builtDuringEvent: true,
      isFunctional: true,
      notLandingPage: true,
      demoWorkflow: true,
      conciseSummary: true,
      targetUser: true,
      clearPain: true,
      repeatableWorkflow: true,
      buyerExists: true,
      urgency: true,
      differentiation: true,
      lowCrowdOverlap: true,
      proofReceipt: false,
      specificWedge: true,
      nonGenericAgent: true,
      brightDataRole: "none",
      brightDataTools: [],
      agenticLoop: true,
      brightDataTrace: false
    },
    evidenceItems: [
      {
        id: "countersign-1",
        sourceType: "submission-card",
        sourceUrl: EVENT_URL,
        title: "Submission card",
        excerpt:
          "Agents propose purchases, mandates set rules, and users countersign spend that needs a person.",
        collectedAt: COLLECTED_AT,
        collector: "Saved lablab page",
        confidence: 0.8,
        supports: ["Originality", "Business value"],
        limitations: "No visible Bright Data usage from the public card."
      }
    ],
    brightDataTraces: []
  },
  {
    id: "nightwatch",
    title: "NIGHTWATCH: Factory Early Warning",
    team: "ANIMA_Research",
    summary:
      "Detects factory equipment problems before they disrupt production by comparing current conditions with a verified baseline.",
    eventUrl: EVENT_URL,
    submissionUrl:
      "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/animaresearch/nightwatch-factory-early-warning",
    demoUrl: "public-demo-linked",
    githubUrl: "public-github-linked",
    presentationUrl: "public-presentation-linked",
    createdAt: "2026-08-06",
    domain: "Industrial",
    technologies: ["OpenAI", "Claude Code", "Anthropic Claude"],
    trackTags: ["Operations", "Business"],
    evidence: {
      hasDemo: true,
      hasPublicDemo: true,
      hasGithub: true,
      hasPresentation: true,
      nativeBuilderExplained: true,
      builtDuringEvent: true,
      isFunctional: true,
      notLandingPage: true,
      demoWorkflow: true,
      conciseSummary: true,
      targetUser: true,
      clearPain: true,
      repeatableWorkflow: true,
      buyerExists: true,
      urgency: true,
      differentiation: true,
      lowCrowdOverlap: true,
      proofReceipt: true,
      specificWedge: true,
      nonGenericAgent: true,
      brightDataRole: "none",
      brightDataTools: [],
      agenticLoop: true,
      brightDataTrace: false
    },
    evidenceItems: [
      {
        id: "nightwatch-1",
        sourceType: "submission-card",
        sourceUrl: EVENT_URL,
        title: "Submission card",
        excerpt:
          "Compares current factory conditions with a verified baseline, explains critical deviations, and guides safe human action.",
        collectedAt: COLLECTED_AT,
        collector: "Saved lablab page",
        confidence: 0.82,
        supports: ["Business value"],
        limitations: "No visible Bright Data integration from the public card."
      }
    ],
    brightDataTraces: []
  },
  {
    id: "voice-to-ops",
    title: "Voice-to-Ops: field reports that write themselves",
    team: "Los elegantes",
    summary:
      "Field technicians dictate site notes, Speechmatics transcribes them, open models structure the report, and the app drafts follow-up email.",
    eventUrl: EVENT_URL,
    submissionUrl:
      "https://lablab.ai/ai-hackathons/nativebuilder-build-without-limits/los-elegantes/voice-to-ops-field-reports-that-write-themselves",
    demoUrl: "public-demo-linked",
    githubUrl: "public-github-linked",
    presentationUrl: "public-presentation-linked",
    createdAt: "2026-08-06",
    domain: "Field Service",
    technologies: ["Speechmatics api", "Featherless", "Llama 3"],
    trackTags: ["Operations", "Productivity"],
    evidence: {
      hasDemo: true,
      hasPublicDemo: true,
      hasGithub: true,
      hasPresentation: true,
      nativeBuilderExplained: true,
      builtDuringEvent: true,
      isFunctional: true,
      notLandingPage: true,
      demoWorkflow: true,
      conciseSummary: true,
      targetUser: true,
      clearPain: true,
      repeatableWorkflow: true,
      buyerExists: true,
      urgency: true,
      differentiation: false,
      lowCrowdOverlap: false,
      proofReceipt: false,
      specificWedge: true,
      nonGenericAgent: false,
      brightDataRole: "none",
      brightDataTools: [],
      agenticLoop: false,
      brightDataTrace: false
    },
    evidenceItems: [
      {
        id: "voice-to-ops-1",
        sourceType: "submission-card",
        sourceUrl: EVENT_URL,
        title: "Submission card",
        excerpt:
          "Transcribes field notes, structures severity-graded reports with action items, and drafts follow-up email.",
        collectedAt: COLLECTED_AT,
        collector: "Saved lablab page",
        confidence: 0.8,
        supports: ["Presentation", "Business value"],
        limitations: "Strong workflow, but not a Bright Data prize fit from visible evidence."
      }
    ],
    brightDataTraces: []
  }
];
