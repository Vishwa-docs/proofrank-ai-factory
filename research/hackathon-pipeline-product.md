# ProofRank Hackathon Pipeline Product Analysis

ProofRank should be a reusable hackathon evidence and review-operations product, not an AI Factory-only dashboard. AI Factory remains the default sample profile because it proves the Bright Data sponsor lane, but the sellable product is a two-sided workspace for builders, judges, sponsors, and organizers.

## Product Position

**Category:** hackathon evidence, eligibility, and judge-assist sidecar.

**Buyer:** sponsor teams, hackathon organizers, accelerator programs, grant reviewers, and innovation teams that need defensible public-project review.

**Wedge:** AI hackathons with sponsor-required tools. These events have a concrete pain: builders need fast feedback before submission, while sponsors need proof that teams meaningfully used the sponsor technology.

## Pipeline

1. **Brief and rules**
   - Input: event URL, rules, dates, prizes, required tech, judging rubric.
   - Output: machine-checkable event profile.
   - Bright Data role: scrape event and sponsor pages as Markdown.

2. **Builder preflight**
   - Input: GitHub repo, demo app, pitch/script, optional event profile.
   - Output: missing-artifact list, sponsor-tool gap list, claim ledger, submission copy.
   - Bright Data role: scrape public repo/demo pages and discover similar products.

3. **Submission readiness**
   - Input: deployed URL, native builder URL, video/deck, categories, tools.
   - Output: form-ready copy and eligibility receipt.
   - Bright Data role: check public reachability, duplicate/title risk, and source availability.

4. **Judge triage**
   - Input: event field and submissions.
   - Output: shortlist queue, needs-evidence queue, broken-link queue, conflict/recusal notes.
   - Bright Data role: bounded source/search/discovery traces with freshness and cost state.

5. **Sponsor review**
   - Input: selected finalist/project.
   - Output: sponsor dependency score, evidence receipt, judge readout, dispute log.
   - Bright Data role: Remote MCP source/search/discovery, Scraper Studio for repeatable sources, Web Unlocker for protected pages, CLI replay commands.

6. **Winner audit and postmortem**
   - Input: winners, judge notes, public announcements, prize tasks.
   - Output: winner dossier, sponsor recap, builder feedback, event-quality analytics.
   - Bright Data role: scheduled freshness checks on winner links, repos, claims, and public pages.

## Feature Roadmap

1. **Hackathon Profile**
   - Treat an event as data: `eventUrl`, platform, criteria, artifact requirements, sponsor lanes, evidence standard.
   - Default profile: AI Factory / Best Agentic Use of Bright Data.
   - Custom profile: any event URL falls back to generic criteria until a collected profile is available.

2. **Rubric-to-Checklist Compiler**
   - Convert event rules into builder checklist, judge checklist, and sponsor evidence standard.
   - Keep weights explicit. If an event has no weights, show equal-weight assumptions.

3. **Builder Preflight**
   - Let builders paste repo/demo before submission.
   - Return: “what is missing,” “what judge will question,” “what sponsor proof is weak,” and “what to fix next.”

4. **Judge Proof Packet**
   - One page per project: verdict, target user, demo/repo state, sponsor tech proof, risks, source rows, suggested judge questions.

5. **Sponsor Dependency Score**
   - Separate “mentions sponsor tool” from “sponsor tool changed the outcome.”
   - Require source scrape, web search, and discovery traces for the high-confidence Bright Data state.

6. **Winner Dossier**
   - Export why winners passed, what evidence was collected, remaining risks, prize eligibility tasks, and public recap copy.

## Bright Data Usage Strategy

Use Bright Data where ordinary direct fetch is weak or where sponsor judges need replayable evidence:

- `scrape_as_markdown`: event pages, submission pages, demos, GitHub README, docs, public decks.
- `search_engine`: prior art, duplicate titles, sponsor usage claims, team/project public mentions.
- `discover`: AI-ranked adjacent products and comparison evidence.
- Scraper Studio: repeatable event/submission collectors for organizers.
- Web Unlocker / Scraping Browser: only for pages that direct fetch cannot access or one screenshot/protected-demo proof.
- CLI: sponsor-visible replay commands and self-healing scraper workflow.

Budget rule for this submission: run narrow, high-value traces. Prefer 50-100 source/search/discovery operations and at most one browser-heavy navigation under the $20-25 target.

## Current Implementation Slice

The app now has a first-class hackathon pipeline model in `app/src/hackathonPipeline.js`, tests in `app/tests/hackathonPipeline.test.js`, and UI hooks for the active profile and lifecycle stages. AI Factory is loaded by default, but changing the Event URL switches the product into a generic custom-hackathon profile.
