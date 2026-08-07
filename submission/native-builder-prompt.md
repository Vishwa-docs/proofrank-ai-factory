# Native.builder Prompt For ProofRank

Build a production-quality web app named ProofRank.

ProofRank is a public AI product diligence engine for hackathons, accelerators, sponsor programs, grants, and enterprise innovation teams. Its first wedge is hackathon submission review. It helps reviewers decide which public AI projects are real, accessible, original, and genuinely using sponsor technology.

## Primary Goal

Create a functional deployed app, not a landing page. The first screen must be the audit workspace.

## Core Workflow

1. User enters an event URL or project URL.
2. User chooses Demo Evidence or Bright Data Live mode.
3. User clicks Run Audit.
4. The app discovers or loads project submissions.
5. The app ranks projects by:
   - Eligibility
   - Bright Data Dependency
   - Business Value
   - Originality
   - Presentation
6. User selects a project.
7. Center panel shows the scorecard, Adversarial Tribunal, Originality Radar, and Claim Ledger.
8. Left panel shows a Submission Cockpit with required and competitive readiness gates.
9. Right panel shows source-backed Proof Receipt and a trace table that distinguishes executed Bright Data, direct fallback, planned, claimed, pending, and failed collection.
10. User exports CSV, all receipts JSON, selected receipt JSON, and submission packet Markdown.

## Required UI

Use a quiet, dense operations-dashboard layout.

- Sticky top bar with ProofRank mark, mode selector, CSV export, JSON export, and Submission Packet button.
- Left column with event URL input, live API endpoint input, HTML upload, Run Audit button, Submission Cockpit, project reviewer intake, filters, and ranked queue.
- Center column with selected project summary, five score tiles, verdict, evidence gaps, Adversarial Tribunal, Originality Radar, Claim Ledger, and field map.
- Right column with Proof Receipt source snippets, confidence, limitations, trace-state table, and live collection plan.
- Responsive mobile layout that stacks panels without overlapping text.
- Cards should have 8px radius or less.
- Use a varied palette: white, charcoal, teal, blue, amber, red, and green.

Do not build a marketing hero. The app should open directly into the working audit interface.

## Claim Ledger

For each selected project, extract and show these claims:

- Public demo is reachable and shows a workflow.
- Project explains native.builder use.
- Bright Data is load-bearing.
- Originality has public support.
- Review packet is defensible.
- Repository evidence is reproducible.

Each claim must have one of these statuses:

- Verified
- Weak Evidence
- Not Found
- Needs Proof

Every claim must include a short evidence explanation and should avoid truth absolutism. Use "confidence" and "prior-art risk" language rather than calling a project fake or plagiarized.

## Scoring Formula

Use deterministic scoring, then allow future AI enrichment.

- Eligibility: 25%
- Bright Data Dependency: 25%
- Business Value: 20%
- Originality: 15%
- Presentation: 15%

Bright Data Dependency should be high only when Bright Data is load-bearing, agentic, traceable, visible in receipts, and backed by at least one executed Bright Data trace.

## Adversarial Tribunal

For each selected project, show a three-perspective tribunal:

- Bright Data sponsor judge: argues whether Bright Data is genuinely load-bearing.
- Skeptical hackathon judge: attacks eligibility, native.builder proof, public demo reachability, event-window commits, and source hygiene.
- Business buyer: tests whether a real buyer has a repeatable urgent workflow.

Each perspective should include a confidence score, strongest reasons, objections, and a short stance. The tribunal must produce a final recommendation and a dispute log. It should make uncertainty visible instead of hiding it behind one score.

## Originality Radar

For each selected project, compare against the current event field. Show:

- Risk label: Defensible wedge, Watch overlap, or High overlap risk.
- Numeric originality radar score.
- Top similar projects with overlap score and reasons.
- Defensible wedge bullets.
- Bright Data `search_engine` and `discover` prior-art queries.

The radar should not accuse projects of copying. It should show overlap, uncertainty, and the next source-backed checks.

## Submission Cockpit

Show a readiness cockpit that separates required submission gates from competitive-strength checks. It must never mark demo, planned, direct, claimed, pending, failed, or event-intake-only traces as sponsor-proof.

Required gates:

- Native.builder primary URL
- Executed Bright Data trace
- Actual project reviewed
- Live collection backend
- Public app URL
- Public source evidence
- Under-three-minute demo video

Competitive gates:

- No visible secret risk
- Exportable proof packet

The cockpit should show a compact readiness meter, passed/action/improve labels, proof text, and the next concrete action. If a native.builder URL or executed Bright Data trace is missing, the app should say the project is still gated rather than submission-safe.

## Demo Fixtures

Include fixture records for:

- ProofRank
- Half-Life - Decisions That Stopped Being True
- Askable
- CivicTwin - Proof-Carrying Rule Twin
- Querypex - AI Data Analyst with Full Transparency
- Countersign
- NIGHTWATCH: Factory Early Warning
- Voice-to-Ops: field reports that write themselves

Use these records to make Demo Evidence mode fully functional without credentials.

## Bright Data Live Mode

Bright Data must be the evidence acquisition layer.

Do not expose private tokens in the browser. Store the Bright Data API token server-side or in native.builder secure environment variables if available.

Use these live collection steps:

- Server endpoint `/api/review-event` fetches the event page, parses submission cards, and marks that event-intake trace as `countsForSponsorFit: false`.
- Server endpoint `/api/review-project` fetches a selected GitHub repo, demo URL, package manifest, license, commit window, and secret-risk signals.
- Remote MCP `search_engine` for public mentions, prior-art risk, and sponsor usage claims.
- Remote MCP `scrape_as_markdown` for submission pages, demo pages, GitHub README pages, and presentations.
- SERP API for title and team similarity search.
- Web Scraper API or Web Unlocker for dynamic pages and pages with bot protection.
- CLI-compatible command generation for transparent sponsor review.

Every live result should normalize into:

- mode
- provider
- traceStatus
- tool
- queryOrUrl
- resultCount
- status
- collectedAt
- byteCount
- contentHash

## Error Handling

- Missing token: run Demo Evidence mode and show setup checklist.
- Failed fetch: keep project in queue and mark accessibility risk.
- Missing demo: reduce eligibility and presentation score.
- Missing native.builder explanation: add evidence gap.
- Missing executed Bright Data trace: reduce Bright Data Dependency score and keep a sponsor-dependency dispute open.
- Visible secret-risk files or credential-looking values: flag source hygiene risk.
- Ambiguous originality: mark Weak Evidence, not a hard accusation.

## Exports

Implement:

- Judge queue CSV
- All proof receipts JSON
- Selected receipt JSON
- ProofRank submission packet Markdown

## Submission Narrative

Frame ProofRank as "Bright Data-powered public AI product diligence." Hackathons are the wedge, but the broader buyer is sponsors, accelerators, grant programs, procurement teams, and innovation teams.

## Acceptance Criteria

- The app runs with no credentials in Demo Evidence mode.
- Live mode has a secure Bright Data integration plan and token handling.
- A user can complete the audit workflow in under three minutes.
- The Claim Ledger is visible in the first 90 seconds of the demo.
- The Adversarial Tribunal is visible in the first 90 seconds of the demo.
- The Originality Radar is visible in the first 90 seconds of the demo.
- The Submission Cockpit makes native.builder, Bright Data, and real-project readiness visible without opening docs.
- Bright Data Dependency score is prominent.
- Exports produce usable files.
- App can be published to a public native.builder URL.
