# ProofRank Design

## Context

The AI Factory Native.builder Hackathon requires a functional, publicly accessible application built primarily with native.builder. The Bright Data partner prize is for the best agentic use of Bright Data. The event page emphasizes complete workflows, deployed software, meaningful integrations, business value, originality, presentation quality, and clear evidence that the product was created during the hackathon.

Prior Bright Data hackathon winners and finalists show a repeated pattern: the strongest projects use live public web data as a load-bearing decision system. They do not stop at scraping and summarizing. They gather evidence, normalize it, score risk or opportunity, show citations, re-check assumptions, and produce an action the user can trust. Strong examples include counterparty due diligence, competitive intelligence, vehicle-risk intelligence, demand validation, trademark monitoring, bid intelligence, and proof-carrying regulatory analysis.

## Competition Refresh, 2026-08-08

Recent lablab.ai app and Bright Data hackathon pages show that the field is crowded with projects that already use search, scraping, and briefing flows. Public examples include trade/logistics intelligence, due-diligence agents, web-data briefing tools, crypto market scrapers, and generic business-opportunity analysis. This makes "we scrape the web" a weak pitch by itself.

The stronger wedge for ProofRank is review operations: Bright Data supplies live source, search, and discovery evidence, while ProofRank turns that evidence into a reviewer-safe decision, a visible gap list, and an exportable memo. The UI should therefore keep the first screen focused on "paste links, run public review, inspect evidence, export memo" and keep trace-heavy details behind disclosure controls. Bright Data should appear as the accountable evidence layer, not as raw infrastructure jargon.

## Product Thesis

ProofRank is a public AI product diligence engine for hackathons, accelerators, grants, sponsor programs, and procurement teams. The hackathon submission audit is the wedge. Given a public event or project URL, it gathers public evidence about each submission and produces a ranked diligence queue with proof receipts for accessibility, demo completeness, originality, sponsor/tool usage, source availability, business value, and eligibility risk.

The core judge-facing insight is simple: every sponsor program needs to know which projects are real, usable, original, and genuinely using sponsor technology. Manual review is slow and inconsistent. ProofRank makes the review faster by giving judges source-backed receipts instead of vague summaries.

## Target Users

- Hackathon judges who need to shortlist many projects quickly.
- Sponsor partner teams who need to verify meaningful tool usage.
- Accelerator and grant reviewers who need proof that submissions are real and accessible.
- Community organizers who need a post-event quality report.

## Recommended Approach

The chosen approach is a narrow, polished audit product focused on public hackathon submissions. This is preferable to a broad market-intelligence dashboard because the current competition field already has several strong generic intelligence products. ProofRank is meta-relevant to the event itself, visibly needs Bright Data, and can demo on the current AI Factory submission page.

Two alternatives were rejected:

- Founder demand validator: strong business value, but crowded by prior winners such as ConsumerIQ and by current startup-validation style entries.
- Vendor-risk monitor: strong Bright Data fit, but crowded by Verdict, Half-Life, Project Helix, and multiple compliance/security entries.

## Core Workflow

1. User enters an event URL, project URL, or uploads/saves a lablab HTML snapshot.
2. Audit coordinator discovers submissions and queues project pages.
3. Evidence agents collect public signals:
   - Submission page text and tags.
   - Public demo URL status and visible app content.
   - GitHub repo presence, README clarity, commit freshness, license, and apparent implementation depth.
   - Presentation/deck URL availability.
   - Claimed technology list and sponsor/tool references.
   - Similarity indicators from public search snippets and known competing submissions.
4. Scoring engine converts evidence into five judge dimensions:
   - Eligibility: accessible, functional, not merely a landing page, created during event window.
   - Bright Data usage: explicit, load-bearing, agentic, and source-visible.
   - Presentation: concise explanation, demo readiness, artifacts present.
   - Business value: target user, pain, workflow value, possible buyer.
   - Originality: differentiation from current field and prior public patterns.
5. UI ranks submissions and shows one selected project at a time with a proof receipt.
6. User exports:
   - A judge queue CSV/JSON.
   - A proof receipt JSON for the selected project.
   - A submission packet for ProofRank itself.

## Bright Data Integration Design

ProofRank treats Bright Data as the evidence acquisition layer.

Live mode:

- Remote MCP or CLI search discovers project pages, demos, GitHub repos, and public comparison targets.
- Web Scraper API or Web Unlocker fetches pages that are dynamic, geo-blocked, or bot-protected.
- SERP search checks exact title, team name, and problem-statement similarity across the public web.
- The app stores Bright Data request traces in each proof receipt so sponsor judges can see the tool was load-bearing.

Demo mode:

- Uses saved hackathon HTML snapshots and curated fixture evidence when Bright Data credentials are unavailable.
- Labels every fixture-derived field as demo evidence.
- Preserves the same scoring and receipt format as live mode, so the demo is deterministic and judge-friendly.

## Native.builder Compliance Path

The competition-compliant build should be created primarily inside native.builder using this spec and the dedicated builder prompt. Native.builder should generate the app structure, UI routes, stateful workflow, export views, and deployment. The local implementation in this workspace is a fallback reference, fixture source, and submission-asset generator. If native.builder account access blocks full automation, the remaining user action is to paste the prepared prompt into native.builder, publish, and provide the resulting nativelyai.app URL.

## Application Surface

First screen is the actual audit workspace, not a landing page.

- Top bar: product name, mode switch, export buttons.
- Left panel: event input, audit run controls, filter chips, ranked submissions.
- Center panel: selected submission scorecard with score breakdown, claim ledger, evidence gaps, and diligence verdict.
- Right panel: proof receipt with source snippets, Bright Data trace, risks, and recommended review action.
- Bottom band: current field map showing how projects cluster by domain and technology claims.

## Data Model

ProjectRecord:

- id
- title
- team
- summary
- eventUrl
- submissionUrl
- demoUrl
- githubUrl
- presentationUrl
- createdAt
- technologies
- trackTags
- evidenceItems
- scores
- verdict

EvidenceItem:

- id
- sourceType
- sourceUrl
- title
- excerpt
- collectedAt
- collector
- confidence
- supports
- limitations

Scores:

- eligibility
- brightDataFit
- presentation
- businessValue
- originality
- overall

BrightDataTrace:

- mode
- tool
- queryOrUrl
- resultCount
- status
- collectedAt

ClaimLedgerItem:

- claim
- status: Verified, Weak Evidence, Not Found, or Needs Proof
- evidence

## Error Handling

- Missing API key: run demo mode and show the live-mode setup checklist.
- Failed page fetch: keep the project in the queue with an accessibility warning.
- Missing demo or GitHub link: reduce presentation and eligibility scores, but do not discard the project.
- Ambiguous evidence: mark the receipt as unresolved rather than inventing a conclusion.
- Similarity and originality checks: present prior-art risk signals, not plagiarism accusations.
- External-service downtime: use saved fixtures and display the last successful collection timestamp.

## Testing Strategy

- Unit tests for scoring math and verdict thresholds.
- Unit tests for parsing saved lablab HTML into project records.
- Unit tests for export format stability.
- Browser checks for desktop and mobile layouts.
- Manual demo-path verification: load fixture, run audit, select project, export receipt.

## Submission Assets

ProofRank should ship with:

- native.builder prompt and iteration prompts.
- Project description.
- Bright Data usage explanation.
- Demo script under three minutes.
- Pitch deck outline.
- Public demo fallback package.
- List of external APIs/tools and credential steps.

## Open Risks

- I cannot guarantee judging outcomes or prize awards.
- Native.builder and Bright Data account creation, coupon redemption, and API tokens may require the user's authenticated browser session or billing choices.
- A local-only implementation would be a strong demo but may not satisfy the "primarily built using native.builder" eligibility requirement. The native.builder publish step is therefore mandatory before final submission.
