# ProofRank Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ProofRank, a Bright Data-focused hackathon submission truth auditor with a working local demo, native.builder build prompt, exports, and submission assets.

**Architecture:** A dependency-light static TypeScript web app runs entirely in the browser for demo reliability. Data ingestion uses saved lablab HTML and fixture evidence, while a Bright Data adapter documents and exposes live-mode integration points for native.builder/server deployment. The UI is a dense audit workspace with ranked submissions, score breakdowns, proof receipts, and export actions.

**Tech Stack:** HTML, CSS, TypeScript-flavored ES modules, browser DOM APIs, local static fixtures, optional Bright Data Remote MCP or CLI in live deployments.

---

### Task 1: Repository Baseline And Documentation

**Files:**
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/.gitignore`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/README.md`
- Already created: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/docs/superpowers/specs/2026-08-07-proofrank-design.md`
- Already created: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/docs/superpowers/plans/2026-08-07-proofrank-implementation.md`

- [ ] **Step 1: Add baseline ignore rules**

Create `.gitignore` with:

```gitignore
.DS_Store
node_modules/
dist/
.env
.env.*
!.env.example
coverage/
playwright-report/
test-results/
```

- [ ] **Step 2: Add README**

Create `README.md` describing ProofRank, demo mode, live Bright Data mode, local run instructions, and native.builder compliance instructions.

- [ ] **Step 3: Commit docs baseline**

Run:

```bash
git add .gitignore README.md docs/superpowers/specs/2026-08-07-proofrank-design.md docs/superpowers/plans/2026-08-07-proofrank-implementation.md
git commit -m "docs: define proofrank product plan"
```

Expected: initial commit succeeds.

### Task 2: Static App Shell

**Files:**
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/index.html`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/styles.css`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/src/main.js`

- [ ] **Step 1: Create app shell**

Create semantic workspace regions: topbar, run panel, ranked list, scorecard, proof receipt, field map, and export drawer.

- [ ] **Step 2: Style the app**

Use a restrained operations-dashboard palette with white, charcoal, teal, amber, red, and blue. Avoid a single-hue theme. Keep cards at 8px radius or less and use stable grid dimensions for ranking rows and score tiles.

- [ ] **Step 3: Wire initial render**

`main.js` imports fixture data, computes rankings, renders the initial selected project, and attaches event listeners.

- [ ] **Step 4: Verify shell in browser**

Run a static server:

```bash
python3 -m http.server 4173 --directory app
```

Expected: `http://127.0.0.1:4173` loads the audit workspace.

### Task 3: Data Fixtures And Parsing

**Files:**
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/src/fixtures.js`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/src/parser.js`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/src/scoring.js`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/src/exporters.js`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/tests/scoring.test.js`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/tests/parser.test.js`

- [ ] **Step 1: Add fixture records**

Include representative current-field projects: Half-Life, Askable, CivicTwin, Querypex, Countersign, NIGHTWATCH, Voice-to-Ops, and ProofRank itself.

- [ ] **Step 2: Implement parser**

Implement a browser-safe parser that can extract project cards from saved lablab HTML text using `DOMParser`.

- [ ] **Step 3: Implement scoring**

Implement deterministic scoring from evidence fields. Overall score is weighted: eligibility 25%, Bright Data fit 25%, business value 20%, originality 15%, presentation 15%.

- [ ] **Step 4: Implement exports**

Implement `downloadJson`, `toCsv`, `buildReceipt`, and `buildSubmissionPacket`.

- [ ] **Step 5: Test parser and scoring**

Run:

```bash
node app/tests/scoring.test.js
node app/tests/parser.test.js
```

Expected: both scripts print passing assertions and exit with code 0.

### Task 4: Interactive Audit Workflow

**Files:**
- Modify: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/src/main.js`
- Modify: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/styles.css`

- [ ] **Step 1: Add run states**

Add idle, running, complete, and live-key-missing states.

- [ ] **Step 2: Add filters**

Filters: all, high risk, Bright Data strong, missing demo, missing GitHub, finalist-ready.

- [ ] **Step 3: Add selection and receipt rendering**

Clicking a ranking row updates the center scorecard and right proof receipt without layout shift.

- [ ] **Step 4: Add export buttons**

Buttons export judge queue CSV, all receipts JSON, selected receipt JSON, and ProofRank submission packet Markdown.

### Task 5: Bright Data Live Adapter And Native.builder Prompt

**Files:**
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/app/src/brightDataAdapter.js`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/submission/native-builder-prompt.md`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/submission/bright-data-setup.md`

- [ ] **Step 1: Add Bright Data adapter**

Provide functions for `buildMcpQueries`, `buildCliCommands`, and `normalizeBrightDataTrace`. The browser demo does not call private APIs directly; it generates server/native.builder integration instructions.

- [ ] **Step 2: Add native.builder prompt**

Write a full prompt that asks native.builder to recreate ProofRank as the primary competition app, using the design spec, data model, UI sections, exports, and Bright Data live-mode adapter.

- [ ] **Step 3: Add Bright Data setup**

Document coupon `aiaccess50`, the 5,000 free MCP request allowance, token-only Remote MCP endpoint, scoped tools, and required environment variables.

### Task 6: Submission Package

**Files:**
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/submission/project-description.md`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/submission/demo-script.md`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/submission/pitch-deck.md`
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/submission/checklist.md`

- [ ] **Step 1: Write project description**

Include problem, target user, native.builder usage, Bright Data usage, external tools, and why it matters.

- [ ] **Step 2: Write demo script**

Keep it under three minutes and include a complete end-to-end workflow.

- [ ] **Step 3: Write pitch deck outline**

Create 7 slides: title, problem, why now, product workflow, Bright Data architecture, demo/results, business model/ask.

- [ ] **Step 4: Write checklist**

List exact remaining account actions: native.builder publish URL, Bright Data token, optional GitHub URL, final lablab submission fields.

### Task 7: Verification

**Files:**
- Create: `/Users/daver/Desktop/LabLabAI AI Factory NativeBuilder Hackathon/scripts/verify.sh`

- [ ] **Step 1: Add verifier**

Script checks required files, runs Node tests, starts static server briefly, and confirms the index page is reachable.

- [ ] **Step 2: Run verifier**

Run:

```bash
bash scripts/verify.sh
```

Expected: all checks pass.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add app submission scripts README.md docs
git commit -m "feat: build proofrank demo and submission package"
```

Expected: commit succeeds.
