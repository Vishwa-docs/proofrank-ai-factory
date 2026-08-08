import { createRequire } from "node:module";
import path from "node:path";

const playwrightPackage =
  process.env.PLAYWRIGHT_PACKAGE_JSON ||
  "/Users/daver/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json";
const chromePath =
  process.env.CHROME_EXECUTABLE ||
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const targetUrl = process.env.PROOFRANK_URL || "http://127.0.0.1:4283/";

const require = createRequire(`file://${playwrightPackage}`);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath
});

const results = [];

async function tourTargetVisible(page, targetSelector) {
  return page.evaluate((selector) => {
    const tour = document.querySelector("#guidedTour");
    const target = document.querySelector(selector);
    if (!tour || !target || tour.hidden || !target.classList.contains("is-tour-target")) return false;
    const tourRect = tour.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight;
    const visible = (rect) =>
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right >= 0 &&
      rect.left <= viewportWidth &&
      rect.bottom >= 0 &&
      rect.top <= viewportHeight;
    return visible(tourRect) && visible(targetRect);
  }, targetSelector);
}

for (const spec of [
  { name: "desktop", width: 1440, height: 950 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-414", width: 414, height: 896 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-375", width: 375, height: 812 },
  { name: "mobile-320", width: 320, height: 740 }
]) {
  const page = await browser.newPage({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: 1
  });
  const messages = [];

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      messages.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.__proofrankCopiedText = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text) => {
          window.__proofrankCopiedText = String(text);
        }
      }
    });
  });
  await page.waitForSelector("#rankedList .project-row", { state: "attached", timeout: 5000 });

  const initialQuickReviewCalm = await page.evaluate(() => {
    const quick = document.querySelector(".quick-review");
    const isVisible = (element) => {
      if (!element) return false;
      if (typeof element.checkVisibility === "function") {
        return element.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true });
      }
      return Boolean(element.offsetParent && getComputedStyle(element).visibility !== "hidden");
    };
    const visibleInputs = [...quick.querySelectorAll("input")].filter(isVisible);
    const visiblePrimary = [...quick.querySelectorAll("button.primary-button")].filter(isVisible);
    const visibleSecondary = [...quick.querySelectorAll(".quick-actions .text-button, .quick-actions .secondary-button")].filter(isVisible);
    const hiddenGroups = [
      ".visitor-mode",
      ".bright-actions",
      ".review-focus",
      ".starter-projects",
      ".public-room-note",
      ".mode-ladder",
      ".inline-qtip"
    ].every((selector) => !isVisible(quick.querySelector(selector)));

    return {
      visibleInputs: visibleInputs.length,
      visiblePrimary: visiblePrimary.length,
      visibleSecondary: visibleSecondary.length,
      hiddenGroups,
      optionsClosed: document.querySelector("#reviewOptions")?.open === false
    };
  });
  if (
    initialQuickReviewCalm.visibleInputs > 2 ||
    initialQuickReviewCalm.visiblePrimary !== 1 ||
    initialQuickReviewCalm.visibleSecondary > 1 ||
    !initialQuickReviewCalm.hiddenGroups ||
    !initialQuickReviewCalm.optionsClosed
  ) {
    throw new Error(`Initial quick review is still too crowded: ${JSON.stringify(initialQuickReviewCalm)}`);
  }

  if (spec.name === "desktop") {
    await page.click('.topbar [data-focus-target="quickRepoUrl"]');
    await page.waitForTimeout(300);
    const focusedReviewTarget = await page.evaluate(() => document.activeElement?.id === "quickRepoUrl");
    if (!focusedReviewTarget) {
      throw new Error("Topbar Review target did not focus the hero GitHub repository field.");
    }
    await page.click("#startTourTop");
    await page.waitForTimeout(250);
    const tourVisible = await tourTargetVisible(page, "#quickRepoUrl");
    if (!tourVisible) {
      throw new Error("Guided review did not open beside the repo field with a visible highlight.");
    }
    await page.click("#tourNext");
    await page.waitForTimeout(750);
    const tourStepTwo =
      (await page.evaluate(() => document.querySelector('[data-section-panel="overview"]')?.classList.contains("is-active"))) &&
      (await tourTargetVisible(page, "#scorecard"));
    if (!tourStepTwo) {
      throw new Error("Guided review step 2 did not highlight the scorecard.");
    }
    await page.click("#tourNext");
    await page.waitForTimeout(750);
    const tourStepThree =
      (await page.evaluate(() => document.querySelector('[data-section-panel="queue"]')?.classList.contains("is-active"))) &&
      (await tourTargetVisible(page, "#rankedList"));
    if (!tourStepThree) {
      throw new Error("Guided review step 3 did not switch to Projects and highlight the ranked list.");
    }
    await page.click("#tourNext");
    await page.waitForTimeout(750);
    const tourStepFour =
      (await page.evaluate(() => document.querySelector('[data-section-panel="receipt"]')?.classList.contains("is-active"))) &&
      (await tourTargetVisible(page, "#receipt"));
    if (!tourStepFour) {
      throw new Error("Guided review step 4 did not switch to Evidence and highlight the receipt.");
    }
    await page.click("#tourNext");
    await page.waitForTimeout(750);
    const tourStepFive =
      (await page.evaluate(() => document.querySelector('[data-section-panel="setup"]')?.classList.contains("is-active"))) &&
      (await tourTargetVisible(page, "#modeSelect"));
    if (!tourStepFive) {
      throw new Error("Guided review step 5 did not switch to Readiness and highlight review mode.");
    }
    await page.click("#tourClose");
    await page.click("#reviewOptions summary");
    await page.waitForTimeout(150);
    const pitchCollapsedByDefault = await page.evaluate(() => {
      return document.querySelector("#pitchCheckDrawer")?.open === false && !document.querySelector(".pitch-review-panel");
    });
    if (!pitchCollapsedByDefault) {
      throw new Error("Presentation check should be collapsed by default and absent from Review until analysis runs.");
    }
    await page.click("#pitchCheckDrawer summary");
    await page.click("#loadPitchSample");
    await page.click("#analyzePitch");
    await page.waitForTimeout(250);
    const pitchReviewReady = await page.evaluate(() => {
      const panel = document.querySelector(".pitch-review-panel");
      const text = panel?.textContent || "";
      return Boolean(
        panel &&
          /Presentation check/i.test(text) &&
          /not video verification/i.test(text) &&
          /Bright Data evidence status stays separate/i.test(text) &&
          document.querySelectorAll(".pitch-review-rows li").length === 7
      );
    });
    if (!pitchReviewReady) {
      throw new Error("Presentation check did not render an honest evidence-support panel.");
    }
    await page.click('[data-section-tab="setup"]');
    const firstStepControlsReady = await page.evaluate(() => {
      return (
        document.querySelectorAll("[data-review-focus]").length === 3 &&
        document.querySelectorAll("[data-starter-project]").length === 3 &&
        document.querySelectorAll(".mode-ladder span").length === 3 &&
        Boolean(document.querySelector("#loadExternalSample")) &&
        Boolean(document.querySelector(".bright-path"))
      );
    });
    if (!firstStepControlsReady) {
      throw new Error("Hero review lens, starter projects, or mode ladder did not render.");
    }
    await page.click('[data-review-focus="buyer"]');
    await page.waitForTimeout(100);
    const buyerFocusSelected = await page.evaluate(() => {
      return (
        document.querySelector('[data-review-focus="buyer"]')?.classList.contains("is-active") &&
        /Buyer lens/i.test(document.querySelector("#quickReviewHint")?.textContent || "")
      );
    });
    if (!buyerFocusSelected) {
      throw new Error("Review lens selector did not activate the buyer lens.");
    }
    await page.click('[data-starter-project="brightdata-mcp"]');
    await page.waitForTimeout(100);
    const starterLoaded = await page.evaluate(() => {
      return (
        document.querySelector("#quickRepoUrl")?.value === "https://github.com/brightdata/brightdata-mcp" &&
        document.querySelector("#quickDemoUrl")?.value === "" &&
        document.querySelector('[data-review-focus="sponsor"]')?.classList.contains("is-active")
      );
    });
    if (!starterLoaded) {
      throw new Error("Starter project did not populate links and focus.");
    }
    await page.fill("#quickRepoUrl", "https://example.com/github.com/fake/project");
    await page.fill("#quickDemoUrl", "https://vishwa-docs.github.io/proofrank-ai-factory/");
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(200);
    const fakeRepoRejected = await page.evaluate(() => {
      const status = document.querySelector("#statusLine")?.textContent || "";
      return /public GitHub repository URL/i.test(status) && !document.querySelector('#rankedList [data-id^="review-example"]');
    });
    if (!fakeRepoRejected) {
      throw new Error("Fake GitHub host was accepted by the hero review form.");
    }
    await page.fill("#quickRepoUrl", "https://github.com/brightdata/brightdata-mcp");
    await page.fill("#quickDemoUrl", "not-a-url");
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(200);
    const invalidDemoRejected = await page.evaluate(() => {
      const status = document.querySelector("#statusLine")?.textContent || "";
      return /Demo app URL must start/i.test(status) && !document.querySelector('#rankedList [data-id="review-brightdata-brightdata-mcp"]');
    });
    if (!invalidDemoRejected) {
      throw new Error("Invalid non-empty demo URL was accepted without a warning.");
    }
    const repoDescribed = await page.getAttribute("#quickRepoUrl", "aria-describedby");
    const demoDescribed = await page.getAttribute("#quickDemoUrl", "aria-describedby");
    if (repoDescribed !== "quickRepoHelp" || demoDescribed !== "quickDemoHelp") {
      throw new Error("Hero review inputs are missing persistent field help.");
    }
    await page.click("#loadSampleProject");
    await page.waitForTimeout(200);
    const verifiedSampleSelected = await page.evaluate(() => {
      const title = document.querySelector("#scorecard .focus-strip h2")?.textContent || "";
      const strip = document.querySelector("#liveProofStrip")?.textContent || "";
      return title === "ProofRank" && /Sample evidence record:\s*ProofRank/i.test(strip) && /Bright Data evidence attached/i.test(strip);
    });
    if (!verifiedSampleSelected) {
      throw new Error("ProofRank sample did not select the Bright Data review record.");
    }
    await page.fill("#quickRepoUrl", "https://github.com/brightdata/brightdata-mcp");
    await page.fill("#quickDemoUrl", "https://brightdata.com/");
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(200);
    const shareableReviewReady = await page.evaluate(() => {
      const button = document.querySelector("#copyReviewLink");
      const params = new URL(window.location.href).searchParams;
      return Boolean(
        button &&
          !button.disabled &&
          params.get("reviewRepo") === "https://github.com/brightdata/brightdata-mcp" &&
          params.get("reviewDemo") === "https://brightdata.com/" &&
          params.get("reviewFocus") === "sponsor"
      );
    });
    if (!shareableReviewReady) {
      throw new Error("Valid hero review did not enable a shareable review link.");
    }
    const draftRoutePending = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll("#proofTopology .route-node")];
      const repoNode = nodes.find((node) => /Repository/i.test(node.textContent || ""));
      const demoNode = nodes.find((node) => /Deployed app/i.test(node.textContent || ""));
      const packetNode = nodes.find((node) => /Review memo/i.test(node.textContent || ""));
      return Boolean(
        repoNode?.classList.contains("pending") &&
          demoNode?.classList.contains("pending") &&
          packetNode?.classList.contains("pending") &&
          /Draft memo ready/i.test(packetNode.textContent || "")
      );
    });
    if (!draftRoutePending) {
      throw new Error("Browser-created draft review looked like a fully passed live review packet.");
    }
    const draftCardReady = await page.evaluate(() => {
      const card = document.querySelector(".draft-review-card");
      const text = card?.textContent || "";
      return Boolean(
        card &&
          /Draft review card/i.test(text) &&
          /Link-only/i.test(text) &&
          /URL accepted, content not fetched/i.test(text) &&
          /Bright Data\s*Evidence pending/i.test(text) &&
          /Source fetch, web search, and discovery are planned, not run yet/i.test(text)
      );
    });
    if (!draftCardReady) {
      throw new Error("Draft review card did not render honest link-only status after visitor draft.");
    }
    const draftVerdictNeutral = await page.evaluate(() => {
      const scorecard = document.querySelector("#scorecard")?.textContent || "";
      const heroDecision = document.querySelector("#heroDecision")?.textContent || "";
      const fixList = document.querySelector("#fixList")?.textContent || "";
      const combined = `${scorecard} ${heroDecision} ${fixList}`;
      return (
        /Draft created/i.test(combined) &&
        /Collect evidence/i.test(combined) &&
        /No ranking score until public or sponsor evidence runs/i.test(combined) &&
        !/High risk/i.test(combined) &&
        !/Review score\s*10/i.test(combined)
      );
    });
    if (!draftVerdictNeutral) {
      throw new Error("Visitor draft still looked like a punitive scored review before public or sponsor evidence.");
    }
    const draftBriefReady = await page.evaluate(() => {
      const brief = document.querySelector(".visitor-brief.draft");
      const text = brief?.textContent || "";
      const forbidden = /verified|reachable|passed|certified|signed proof|submission-ready|finalist-ready/i.test(text);
      return Boolean(
        brief &&
          /Link-only draft/i.test(text) &&
          /Draft review created/i.test(text) &&
          /repo content, demo reachability, functionality, and Bright Data evidence/i.test(text) &&
          /Source fetch, web search, and discovery are planned, not run yet/i.test(text) &&
          /Run public review/i.test(text) &&
          !forbidden
      );
    });
    if (!draftBriefReady) {
      throw new Error("Visitor review brief did not explain the link-only draft state.");
    }
    await page.click('[data-score-action="copy-card"]');
    await page.waitForTimeout(100);
    const copiedDraftCardReady = await page.evaluate(() => {
      const copied = window.__proofrankCopiedText || "";
      const forbidden = /verified|reachable|passed|certified|signed proof/i.test(copied);
      return (
        /Draft review only/i.test(copied) &&
        /not fetched|no repo\/demo fetch/i.test(copied) &&
        /Bright Data evidence pending|no Bright Data evidence yet/i.test(copied) &&
        !forbidden
      );
    });
    if (!copiedDraftCardReady) {
      throw new Error("Copied draft review card did not include honest limitations or contained forbidden proof language.");
    }
    await page.evaluate(() => {
      const select = document.querySelector("#modeSelect");
      select.value = "live";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(250);
    const quickLiveSwitchWarned = await page.evaluate(() => {
      const status = document.querySelector("#statusLine")?.textContent || "";
      const mode = document.querySelector("#modeSelect")?.value || "";
      return mode === "demo" && /Private Bright Data review needs private access/i.test(status) && /Draft review ran instead/i.test(status);
    });
    if (!quickLiveSwitchWarned) {
      throw new Error("Hero quick review did not clearly warn when switching private Bright Data review back to public review.");
    }
    const reviewRoomReady = await page.evaluate(() => {
      const room = document.querySelector("#reviewRoomStats");
      const text = document.querySelector(".review-room-strip")?.textContent || "";
      return Boolean(
        room &&
          room.querySelectorAll("article").length === 4 &&
          /Visitor drafts\s*1/i.test(text) &&
          document.querySelector("#exportRoomMemo") &&
          document.querySelector("#exportProgramReport")
      );
    });
    if (!reviewRoomReady) {
      throw new Error("Review Room summary or room memo export is not visible after adding a visitor project.");
    }
    await page.click('[data-section-tab="queue"]');
    await page.click('#rankedList [data-id="proofrank"]');
    const draftCardGoneForReceipt = await page.evaluate(() => !document.querySelector(".draft-review-card"));
    if (!draftCardGoneForReceipt) {
      throw new Error("Draft review card stayed visible after selecting the ProofRank sample evidence record.");
    }
    const receiptBriefReady = await page.evaluate(() => {
      const brief = document.querySelector(".visitor-brief.evidence");
      const text = brief?.textContent || "";
      return Boolean(
        brief &&
          /Bright Data ready/i.test(text) &&
          /Evidence-backed review/i.test(text) &&
          /source fetch, search, and discovery/i.test(text) &&
          /Export memo/i.test(text)
      );
    });
    if (!receiptBriefReady) {
      throw new Error("Visitor review brief did not switch to the Bright Data evidence state.");
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
  }

  if (spec.name === "mobile-320") {
    const mobilePitchCollapsed = await page.evaluate(() => {
      return document.querySelector("#pitchCheckDrawer")?.open === false && !document.querySelector(".pitch-review-panel");
    });
    if (!mobilePitchCollapsed) {
      throw new Error("Mobile presentation check should stay collapsed until the user opens it.");
    }
    await page.click(".qmark[aria-label='GitHub repo help']");
    await page.waitForTimeout(100);
    const qtipVisible = await page.evaluate(() => {
      const button = document.querySelector(".qmark[aria-label='GitHub repo help']");
      const panel = button?.closest(".field-label")?.querySelector(".tip-panel");
      return button?.getAttribute("aria-expanded") === "true" && panel && getComputedStyle(panel).display !== "none";
    });
    if (!qtipVisible) {
      throw new Error("Mobile GitHub help did not open from the keyboard/clickable help control.");
    }
    await page.click(".qmark[aria-label='GitHub repo help']");
    await page.waitForTimeout(100);
    const qtipClosed = await page.evaluate(() => {
      const button = document.querySelector(".qmark[aria-label='GitHub repo help']");
      return button?.getAttribute("aria-expanded") === "false";
    });
    if (!qtipClosed) {
      throw new Error("Mobile GitHub help did not toggle closed.");
    }
    await page.click(".qmark[aria-label='GitHub repo help']");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(100);
    const qtipEscapeClosed = await page.evaluate(() => {
      const button = document.querySelector(".qmark[aria-label='GitHub repo help']");
      return button?.getAttribute("aria-expanded") === "false";
    });
    if (!qtipEscapeClosed) {
      throw new Error("Mobile GitHub help did not close on Escape.");
    }
    await page.fill("#quickRepoUrl", "https://github.com/brightdata/brightdata-mcp");
    await page.fill("#quickDemoUrl", "https://brightdata.com/");
    await page.click("#quickAddReviewerProject");
    await page.waitForTimeout(250);
    const mobileDraftReady = await page.evaluate(() => {
      const row = document.querySelector('#rankedList [data-id="review-brightdata-brightdata-mcp"]');
      const hint = document.querySelector("#quickReviewHint")?.textContent || "";
      return Boolean(row) && /Public review collects real evidence/i.test(hint);
    });
    if (!mobileDraftReady) {
      throw new Error("Mobile visitor path did not create a draft review with honest Bright Data upgrade copy.");
    }
    const mobileDraftCardReady = await page.evaluate(() => {
      const card = document.querySelector(".draft-review-card");
      const text = card?.textContent || "";
      return Boolean(card && /Draft review card/i.test(text) && /Link-only/i.test(text) && /Bright Data\s*Evidence pending/i.test(text));
    });
    if (!mobileDraftCardReady) {
      throw new Error("Mobile visitor draft did not show the draft review card.");
    }
    const mobileBriefReady = await page.evaluate(() => {
      const brief = document.querySelector(".visitor-brief.draft");
      const text = brief?.textContent || "";
      return Boolean(
        brief &&
          /Link-only draft/i.test(text) &&
          /Draft review created/i.test(text) &&
          /Source fetch, web search, and discovery are planned, not run yet/i.test(text) &&
          /Run public review/i.test(text)
      );
    });
    if (!mobileBriefReady) {
      throw new Error("Mobile visitor draft did not show the review brief.");
    }
  }

  const metrics = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const panels = [...document.querySelectorAll(".panel, .filter-bar, .topbar")];
    const offscreenPanels = panels.filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > html.clientWidth + 1;
    });

    const visibleText = document.body.innerText || "";
    const forbiddenVisible = [
      "signed proof",
      "submission-ready",
      "finalist-ready",
      "overall 100",
      "sponsor bundle executed",
      "bright data passed",
      "bright data evidence passed",
      "evidence passed",
      "evidence checks passed",
      "server checked",
      "server record ready",
      "judge packet",
      "bright data packet",
      "ready record",
      "certified",
      "proves",
      "proof plan",
      "review packet is defensible",
      "verified public demos"
    ].filter((text) => visibleText.toLowerCase().includes(text));

    return {
      title: document.title,
      rows: document.querySelectorAll(".project-row").length,
      selectedTitle: document.querySelector("#scorecard .focus-strip h2")?.textContent || "",
      routeNodes: document.querySelectorAll("#proofTopology .route-node").length,
      winnerBenchmarkCount: document.querySelectorAll(".winner-benchmark").length,
      fixListCount: document.querySelectorAll(".fix-list").length,
      fixCardCount: document.querySelectorAll(".fix-card-grid article").length,
      fixScoreStripCount: document.querySelectorAll(".fix-score-strip > div").length,
      fixListCopyReady: /What to fix next/i.test(document.querySelector(".fix-list")?.textContent || ""),
      reviewRoomStats: document.querySelectorAll("#reviewRoomStats article").length,
      sponsorMatrixRows: document.querySelectorAll("#sponsorMatrix .matrix-row").length,
      sponsorMatrixCells: document.querySelectorAll("#sponsorMatrix .matrix-cell").length,
      reviewFocusCount: document.querySelectorAll("[data-review-focus]").length,
      starterCount: document.querySelectorAll("[data-starter-project]").length,
      modeLadderCount: document.querySelectorAll(".mode-ladder span").length,
      externalSampleReady: Boolean(document.querySelector("#loadExternalSample")),
      brightPathReady: document.querySelectorAll(".bright-path").length >= 2,
      actionBoardCount: document.querySelectorAll(".action-board").length,
      actionButtonCount: document.querySelectorAll(".action-board [data-score-action]").length,
      visitorBriefCount: document.querySelectorAll(".visitor-brief").length,
      visitorBriefActions: document.querySelectorAll(".visitor-brief [data-score-action]").length,
      draftReviewCardCount: document.querySelectorAll(".draft-review-card").length,
      draftReviewCardActions: document.querySelectorAll(".draft-review-card [data-score-action]").length,
      fieldComparisonCount: document.querySelectorAll(".field-comparison article").length,
      pitchDrawerPresent: Boolean(document.querySelector("#pitchCheckDrawer")),
      pitchReviewRows: document.querySelectorAll(".pitch-review-rows li").length,
      traceTimelineSteps: document.querySelectorAll(".trace-timeline li").length,
      qtipButtonCount: document.querySelectorAll(".qmark").length,
      roomLinkReady: Boolean(document.querySelector("#copyAppLinkHero") && document.querySelector("#copyAppLink")),
      publicRoomNoteReady: /Public test room/i.test(document.querySelector(".public-room-note")?.textContent || ""),
      forbiddenVisible: [
        ...forbiddenVisible,
        ...["verified video", "transcribed by Speechmatics", "demo reachable"].filter((text) => visibleText.toLowerCase().includes(text))
      ],
      readinessCount: document.querySelectorAll("#readinessList li").length,
      reviewerRowPresent: Boolean(document.querySelector('#rankedList [data-id^="review-"]')),
      scrollWidth: html.scrollWidth,
      clientWidth: html.clientWidth,
      horizontalOverflow: html.scrollWidth > html.clientWidth + 1,
      bodyHeight: Math.max(body.scrollHeight, html.scrollHeight),
      offscreenPanels: offscreenPanels.length
    };
  });

  const screenshotPath = path.join("/tmp", `proofrank-${spec.name}-redesign.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  results.push({ spec, metrics, messages, screenshotPath });
  await page.close();
}

await browser.close();

const failures = results.flatMap((result) => {
  const problems = [];
  if (result.messages.length) problems.push(`${result.spec.name}: console/page messages`);
  if (result.metrics.rows < 1) problems.push(`${result.spec.name}: no ranked rows rendered`);
  if (result.metrics.routeNodes !== 6) problems.push(`${result.spec.name}: evidence route did not render`);
  if (result.metrics.winnerBenchmarkCount !== 1) problems.push(`${result.spec.name}: winner benchmark did not render`);
  if (result.metrics.fixListCount !== 1) problems.push(`${result.spec.name}: what-to-fix panel did not render`);
  if (result.metrics.fixCardCount < 5) problems.push(`${result.spec.name}: what-to-fix cards did not render`);
  if (result.metrics.fixScoreStripCount !== 2) problems.push(`${result.spec.name}: what-to-fix score strip did not render`);
  if (!result.metrics.fixListCopyReady) problems.push(`${result.spec.name}: what-to-fix copy is missing`);
  if (result.metrics.reviewRoomStats !== 4) problems.push(`${result.spec.name}: review room stats did not render`);
  if (result.metrics.sponsorMatrixRows < 1) problems.push(`${result.spec.name}: evidence checklist did not render`);
  if (result.metrics.sponsorMatrixCells < 6) problems.push(`${result.spec.name}: evidence checklist cells did not render`);
  if (result.metrics.reviewFocusCount !== 3) problems.push(`${result.spec.name}: review focus controls did not render`);
  if (result.metrics.starterCount !== 3) problems.push(`${result.spec.name}: starter projects did not render`);
  if (result.metrics.modeLadderCount !== 3) problems.push(`${result.spec.name}: evidence mode ladder did not render`);
  if (!result.metrics.externalSampleReady) problems.push(`${result.spec.name}: external sample action did not render`);
  if (!result.metrics.brightPathReady) problems.push(`${result.spec.name}: Bright Data evidence/private review actions did not render`);
  if (result.metrics.actionBoardCount !== 1) problems.push(`${result.spec.name}: action board did not render`);
  if (result.metrics.actionButtonCount < 4) problems.push(`${result.spec.name}: action board controls did not render`);
  if (result.metrics.visitorBriefCount !== 1) problems.push(`${result.spec.name}: visitor review brief did not render`);
  if (result.metrics.visitorBriefActions < 3) problems.push(`${result.spec.name}: visitor review brief actions did not render`);
  if (result.spec.name === "mobile-320" && result.metrics.draftReviewCardCount !== 1) {
    problems.push("mobile-320: draft review card did not remain visible after visitor draft");
  }
  if (result.spec.name === "mobile-320" && result.metrics.draftReviewCardActions < 3) {
    problems.push("mobile-320: draft review card actions did not render");
  }
  if (result.spec.name === "desktop" && result.metrics.draftReviewCardCount !== 0) {
    problems.push("desktop: draft review card did not disappear after selecting built-in receipt");
  }
  if (result.metrics.fieldComparisonCount < 5) problems.push(`${result.spec.name}: field comparison panel did not render`);
  if (!result.metrics.pitchDrawerPresent) problems.push(`${result.spec.name}: presentation check drawer did not render`);
  if (result.spec.name === "desktop" && result.metrics.pitchReviewRows !== 7) {
    problems.push("desktop: presentation check rows did not render after analysis");
  }
  if (result.metrics.traceTimelineSteps !== 4) problems.push(`${result.spec.name}: Bright Data run timeline did not render`);
  if (result.metrics.qtipButtonCount < 2) problems.push(`${result.spec.name}: field help buttons did not render`);
  if (!result.metrics.roomLinkReady) problems.push(`${result.spec.name}: room link copy actions did not render`);
  if (!result.metrics.publicRoomNoteReady) problems.push(`${result.spec.name}: public test room note did not render`);
  if (result.metrics.forbiddenVisible.length) {
    problems.push(`${result.spec.name}: forbidden old labels visible (${result.metrics.forbiddenVisible.join(", ")})`);
  }
  if (result.metrics.horizontalOverflow) problems.push(`${result.spec.name}: horizontal overflow`);
  if (result.metrics.offscreenPanels) problems.push(`${result.spec.name}: offscreen panels`);
  if (result.spec.name === "desktop" && !result.metrics.reviewerRowPresent) {
    problems.push("desktop: reviewer project did not remain in queue");
  }
  return problems;
});

console.log(JSON.stringify(results, null, 2));

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
