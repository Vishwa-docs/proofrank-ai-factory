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

Bright Data Dependency should be high only when Bright Data is load-bearing, agentic, traceable, visible in receipts, and backed by the full executed Bright Data sponsor proof bundle: source scrape, `search_engine`, and `discover`.

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
- Bright Data sponsor proof bundle
- Actual project reviewed
- Live collection backend
- Public app URL
- Public source evidence
- Under-three-minute demo video

Competitive gates:

- No visible secret risk
- Exportable proof packet

The cockpit should show a compact readiness meter, passed/action/improve labels, proof text, and the next concrete action. If a native.builder URL or Bright Data sponsor proof bundle is missing, the app should say the project is still gated rather than submission-safe.

The Actual project reviewed gate must not pass for a manually typed or pending target. It should pass only when a reviewer-supplied project has live-collected repository/demo evidence and at least one non-pending collection trace.

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

For any public live backend, require:

- A short-lived review/session token such as `PROOFRANK_REVIEW_TOKEN`.
- Restricted CORS origins through `PROOFRANK_ALLOWED_ORIGINS`.
- URL host allowlisting through `PROOFRANK_ALLOWED_HOSTS`.
- A per-run Bright Data call budget such as `PROOFRANK_MAX_BRIGHTDATA_CALLS=12`.
- A receipt signing secret such as `PROOFRANK_RECEIPT_SIGNING_SECRET` so live project receipts include an HMAC signature.

The browser may pass the short-lived review token with an `x-proofrank-token` header from a judge-session URL parameter, but it must never expose the Bright Data API token.

Use these live collection steps:

- Server endpoint `/api/review-event` fetches the event page, parses submission cards, and marks that event-intake trace as `countsForSponsorFit: false`.
- Event parsing must support both HTML cards and Bright Data MCP markdown output.
- `/api/review-event` may request exactly one bounded `/api/review-project` follow-up when the top parsed project has a real GitHub URL. If that follow-up fails, return event results with a `reviewError` instead of discarding event intake.
- Server endpoint `/api/review-project` fetches a selected GitHub repo, demo URL, package manifest, license, commit window, and secret-risk signals.
- Remote MCP `scrape_as_markdown` for submission pages, demo pages, GitHub README pages, and presentations.
- Remote MCP `search_engine` for public mentions, prior-art risk, and sponsor usage claims. In MCP live smoke tests, require at least one executed `search_engine` trace.
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

Each server-issued project review should also include `runReceipt` with:

- issuer
- issuedAt
- runId
- collectionMode
- provider
- traceCount and executedTraceCount
- tools
- traceDigest
- replayCommand
- signature when a signing secret is configured

## Error Handling

- Missing token: run Demo Evidence mode and show setup checklist.
- Missing or invalid review token: return 401 from the live backend and show a clear live-setup status.
- Disallowed origin or URL host: reject before calling Bright Data.
- Bright Data call budget exhausted: stop collection and mark the trace as failed rather than continuing.
- Failed fetch: keep project in queue and mark accessibility risk.
- Missing demo: reduce eligibility and presentation score.
- Missing native.builder explanation: add evidence gap.
- Missing Bright Data sponsor proof bundle: reduce Bright Data Dependency score and keep a sponsor-dependency dispute open.
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
