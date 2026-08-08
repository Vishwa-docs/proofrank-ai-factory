# Native.builder Prompt For ProofRank

Build a production-quality web app named ProofRank.

ProofRank is a public AI product diligence engine for hackathons, accelerators, sponsor programs, grants, and enterprise innovation teams. Its first wedge is hackathon submission review. It helps reviewers decide which public AI projects are real, accessible, original, and genuinely using sponsor technology.

## Primary Goal

Create a functional deployed app, not a landing page. The first screen must be a review workspace where a visitor can paste public project links.

## Core Workflow

1. User pastes a public GitHub repository URL and optional deployed app URL in the first viewport.
2. User can create a Draft audit (link-only local review) without credentials.
3. Draft projects show Draft created / Not scored, a Draft Review Card with link-only status, copyable draft summary, copyable draft link, and a primary Run Bright Data action.
4. User can open Links and choose Live Bright Data review when a reviewer-access backend session is available.
5. The app adds the project to a ranked queue and can also discover or load event submissions.
6. The app ranks projects by:
   - Eligibility
   - Bright Data Dependency
   - Business Value
   - Originality
   - Presentation
7. User selects a project.
8. Review shows What to fix next, the scorecard, field comparison, Review Panel, Winner Benchmark, Similarity Check, and Claim Check.
9. Links tab shows full project intake, event collection, advanced live review API, and readiness checklist.
10. Links tab also includes a collapsed Presentation check. A user can paste a demo transcript or pitch notes, analyze them locally, and see which presentation claims still need evidence.
11. Evidence tab shows source-backed review evidence and a source table that distinguishes executed Bright Data, direct fallback, planned, claimed, pending, and failed collection.
12. User exports CSV, all review evidence JSON, selected review JSON, and review memo Markdown.

## Required UI

Use a calm lablab-style event layout. The first viewport must explain the project before exposing operational controls.

- Sticky top bar with ProofRank mark, Run review, Start guided review, Projects, and Export actions.
- First viewport with event metadata, a large ProofRank headline, a 60-second review value statement, a GitHub repository field, a demo app field, Run public review button, Replay sample button, Share blank test room button, one safety sentence, a compact review coach, a Bright Data flight recorder strip, a collapsed Advanced evidence options drawer with the three review modes (Public review active by default, Save draft, Bright Data evidence run), and one compact current-selection card.
- The first viewport must not look crowded. Put samples, review lens, starter projects, blank test room link, ProofRank sample result, external sample, and Bright Data setup actions inside More options.
- Decision card shows the selected ProofRank sample result, Bright Data evidence attached, review ID `pr-20260807t200529345z-23568b05`, still needs lablab.ai submission, and Native app published. Do not imply the final lablab.ai submission is already complete. Keep detailed numeric scoring inside the score breakdown.
- Review tab starts with What to fix next before the long scorecard. It shows score if judged today for evidence-backed projects, but for visitor-created drafts it must say Draft / No ranking score until public or Bright Data evidence runs.
- Result includes a compact Bright Data evidence panel above the collapsible analysis drawers. It must show the exact Bright Data source/search/discovery run (`scrape_as_markdown`, `search_engine`, `discover`), the review ID, and the judge-safe replay state. This strip should explain that planned, claimed, direct, failed, pending, or event-intake-only traces do not count.
- Result includes a Draft Review Card only for visitor-created draft projects. It must say Link-only, GitHub URL accepted/content not fetched, demo URL supplied/reachability not checked, and Bright Data evidence pending. Its copied summary must include the limitation that no repo/demo fetch, functionality check, or Bright Data evidence has run yet. Draft projects must not show High risk, Review score 10, finalist-ready language, or any final verdict before public or Bright Data evidence runs.
- If the user runs Presentation check, Result shows a compact pitch evidence panel. It must say the source is pasted transcript text, not video verification, and that Bright Data evidence status stays separate.
- Result includes an Against the field panel with ProofRank beside current AI Factory project patterns such as Half-Life, CivicTwin, Askable, and Querypex. It should show domain, Bright Data role, decision artifact, and evidence visibility so judges understand that ProofRank is the review operations product.
- Tabs below the first viewport: Review, Projects, Evidence, Readiness.
- Review shows What to fix next, selected project summary, score tiles, evidence route, Review Panel, Bright Data prize readiness, Similarity Check, and Claim Check.
- Projects shows filters, ranked projects, Evidence checklist, and Category map.
- Evidence shows source snippets, confidence, limitations, source-state table, and live collection plan.
- Readiness contains Event URL, Review API URL in an Advanced drawer, keyboard-accessible HTML upload, GitHub/deployed-app intake, collapsed Presentation check, and readiness checklist. Use `https://proofrank-ai-factory.vercel.app/api/review-project-public` as the public review API example and `https://proofrank-ai-factory.vercel.app/api/review-project` as the reviewer-access sponsor endpoint when the judge has a tokenized replay session.
- Responsive mobile layout that stacks panels without overlapping text.
- Cards should have 8px radius or less.
- Use a varied palette: white, charcoal, teal, blue, amber, red, and green.

Do not expose old audit controls, target URL forms, live settings, reviewer intake, or the old cockpit layout above the tabs. The first screen must start with public project links and make it unmistakable that other builders can test their own repo/demo. Advanced live settings belong in Readiness. Use ProofRank as the selected sample result, but do not present it as a self-awarded win. Use Bright Data evidence attached and lablab.ai submission pending copy instead of old finalist/winner/finality labels or claims that draft reviews fetch repository contents.

## Claim Check

For each selected project, extract and show these claims:

- Public demo is reachable and shows a workflow.
- Project explains native.builder use.
- Bright Data is load-bearing.
- Originality has public support.
- Review memo is defensible.
- Repository evidence is reproducible.

Each claim must have one of these statuses:

- Supported
- Weak Evidence
- Not Found
- Needs Evidence

Every claim must include a short evidence explanation and should avoid truth absolutism. Use "confidence" and "prior-art risk" language rather than calling a project fake or plagiarized.

## Scoring Formula

Use deterministic scoring, then allow future AI enrichment.

- Eligibility: 25%
- Bright Data Dependency: 25%
- Business Value: 20%
- Originality: 15%
- Presentation: 15%

Bright Data Dependency should be high only when Bright Data is load-bearing, agentic, traceable, visible in receipts, and backed by the full executed Bright Data source/search/discovery run: source fetch, `search_engine`, and `discover`.

## Review Panel

For each selected project, show a three-perspective review panel:

- Bright Data sponsor judge: argues whether Bright Data is genuinely load-bearing.
- Skeptical hackathon judge: attacks eligibility, native.builder evidence, public demo reachability, event-window commits, and source hygiene.
- Business buyer: tests whether a real buyer has a repeatable urgent workflow.

Each perspective should include a confidence score, strongest reasons, objections, and a short stance. The panel must produce a final recommendation and a dispute log. It should make uncertainty visible instead of hiding it behind one score.

## Similarity Check

For each selected project, compare against the current event field. Show:

- Risk label: Distinct angle, Watch overlap, or High overlap risk.
- Numeric originality score.
- Top similar projects with overlap score and reasons.
- What makes it different bullets.
- Bright Data `search_engine` and `discover` prior-art queries.

The radar should not accuse projects of copying. It should show overlap, uncertainty, and the next source-backed checks.

## Winner Benchmark

Show a sponsor-prize benchmark panel for the selected project. It should compare the project against seven Bright Data winner-shaped signals:

- Decision-shaped output
- Executed live-web source/search/discovery bundle
- Multi-tool Bright Data dependency
- Judge-visible evidence trail
- Defensible originality wedge
- Public end-to-end workflow
- Native.builder primary deployment

The panel should show a numeric score, tier label, matched signals, and the top prize gaps. It should help the presenter explain why the project is prize-shaped while staying honest about missing Native.builder or executed Bright Data gates.

## Collect Gates

Show readiness gates that separate required submission gates from competitive-strength checks. They must never mark saved, planned, direct, claimed, pending, failed, or event-intake-only traces as completed Bright Data review evidence.

Required gates:

- Native.builder primary URL
- Bright Data source/search/discovery run
- Actual project reviewed
- Live collection backend
- Public app URL
- Public source evidence
- Under-three-minute demo video

Competitive gates:

- No visible secret risk
- Exportable review memo

The cockpit should show a compact readiness meter, checked/action/improve labels, evidence text, and the next concrete action. If a native.builder URL or Bright Data source/search/discovery run is missing, the app should say the review package is still gated rather than ready to hand off.

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

Use these records to make Demo review mode fully functional without credentials.

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
The app must read `#reviewToken=...` or `?reviewToken=...` on load, store it only in browser session storage, remove it from the visible URL, and send it only as `x-proofrank-token` to `/api/review-project` or `/api/review-event`.

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

- Missing token: run Demo review mode and show setup checklist.
- Missing or invalid review token: return 401 from the live backend and show a clear live-setup status.
- Disallowed origin or URL host: reject before calling Bright Data.
- Bright Data call budget exhausted: stop collection and mark the trace as failed rather than continuing.
- Failed fetch: keep project in queue and mark accessibility risk.
- Missing demo: reduce eligibility and presentation score.
- Missing native.builder explanation: add evidence gap.
- Missing Bright Data source/search/discovery run: reduce Bright Data Dependency score and keep a Bright Data dependency dispute open.
- Visible secret-risk files or credential-looking values: flag source hygiene risk.
- Ambiguous originality: mark Weak Evidence, not a hard accusation.

## Exports

Implement:

- Judge queue CSV
- All review evidence JSON
- Selected review JSON
- ProofRank review memo Markdown

## Submission Narrative

Frame ProofRank as "Bright Data-powered public AI product diligence." Hackathons are the wedge, but the broader buyer is sponsors, accelerators, grant programs, procurement teams, and innovation teams.

## Acceptance Criteria

- The app runs with no credentials in Demo review mode.
- Live mode has a secure Bright Data integration plan and token handling.
- A user can complete the audit workflow in under three minutes.
- The Claim Check is visible in the first 90 seconds of the demo.
- The Review Panel is visible in the first 90 seconds of the demo.
- The Winner Benchmark is visible in the first 90 seconds of the demo.
- The Similarity Check is visible in the first 90 seconds of the demo.
- The Links tab makes native.builder, Bright Data, and real-project readiness visible without opening docs.
- Bright Data Dependency score is prominent.
- Exports produce usable files.
- App can be published to a public native.builder URL.
