import { COLLECTED_AT, EVENT_URL } from "./fixtures.js";

const ENTITY_MAP = {
  "&amp;": "&",
  "&quot;": "\"",
  "&#x27;": "'",
  "&#39;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " "
};

export function decodeHtml(value = "") {
  if (typeof document !== "undefined") {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value;
  }

  return value.replace(/&(amp|quot|lt|gt|nbsp);|&#x27;|&#39;/g, (match) => ENTITY_MAP[match] || match);
}

export function stripTags(value = "") {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteLablabUrl(href) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `https://lablab.ai${href.startsWith("/") ? "" : "/"}${href}`;
}

function evidenceFromCard(card) {
  const tech = card.technologies.join(" ").toLowerCase();
  const summary = card.summary.toLowerCase();
  const hasBright = tech.includes("bright data");

  return {
    hasDemo: false,
    hasPublicDemo: false,
    hasGithub: false,
    hasPresentation: false,
    nativeBuilderExplained: summary.includes("native.builder") || summary.includes("natively"),
    builtDuringEvent: true,
    isFunctional: summary.length > 80,
    notLandingPage: summary.includes("workflow") || summary.includes("agent") || summary.includes("dashboard") || summary.includes("answers"),
    demoWorkflow: summary.length > 120,
    conciseSummary: summary.length > 40,
    targetUser: true,
    clearPain: summary.length > 90,
    repeatableWorkflow: summary.includes("agent") || summary.includes("workflow") || summary.includes("dashboard") || summary.includes("assistant"),
    buyerExists: summary.includes("business") || summary.includes("founder") || summary.includes("team") || summary.includes("users"),
    urgency: summary.includes("risk") || summary.includes("before") || summary.includes("instant") || summary.includes("problems"),
    differentiation: true,
    lowCrowdOverlap: !summary.includes("pdf") && !summary.includes("expense"),
    proofReceipt: summary.includes("proof") || summary.includes("source") || summary.includes("exact") || summary.includes("verified"),
    specificWedge: true,
    nonGenericAgent: summary.includes("agent") || summary.includes("workflow"),
    brightDataRole: hasBright ? "supporting" : "none",
    brightDataTools: card.technologies.filter((item) => item.toLowerCase().includes("bright data")),
    agenticLoop: summary.includes("agent") || summary.includes("re-check") || summary.includes("autonomous"),
    brightDataTrace: false,
    brightDataTraceStatus: hasBright ? "claimed" : "missing",
    brightDataTraceVisible: hasBright
  };
}

function cardToProject(card, index) {
  const evidence = evidenceFromCard(card);
  return {
    id: card.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `project-${index + 1}`,
    title: card.title,
    team: card.team || "Unknown team",
    summary: card.summary,
    eventUrl: EVENT_URL,
    submissionUrl: absoluteLablabUrl(card.href),
    demoUrl: "",
    githubUrl: "",
    presentationUrl: "",
    createdAt: "2026-08-07",
    domain: inferDomain(card.summary, card.technologies),
    technologies: card.technologies,
    trackTags: [],
    evidence,
    evidenceItems: [
      {
        id: `parsed-${index + 1}`,
        sourceType: "uploaded-html",
        sourceUrl: absoluteLablabUrl(card.href),
        title: "Parsed submission card",
        excerpt: card.summary,
        collectedAt: COLLECTED_AT,
        collector: "ProofRank HTML parser",
        confidence: 0.68,
        supports: ["Eligibility triage", "Presentation"],
        limitations: "Uploaded card evidence does not prove demo availability or repository depth."
      }
    ],
    brightDataTraces: evidence.brightDataTraceVisible
      ? [
          {
            mode: "uploaded-html",
            provider: "public-evidence",
            traceStatus: "claimed",
            tool: "HTML snapshot",
            queryOrUrl: absoluteLablabUrl(card.href),
            resultCount: 1,
            status: "parsed from saved page",
            collectedAt: COLLECTED_AT,
            byteCount: 0,
            contentHash: "00000000"
          }
        ]
      : []
  };
}

function inferDomain(summary, technologies) {
  const haystack = `${summary} ${technologies.join(" ")}`.toLowerCase();
  if (haystack.includes("compliance") || haystack.includes("security") || haystack.includes("risk")) return "Risk";
  if (haystack.includes("founder") || haystack.includes("startup") || haystack.includes("business")) return "Business";
  if (haystack.includes("video") || haystack.includes("pdf") || haystack.includes("knowledge")) return "Knowledge";
  if (haystack.includes("factory") || haystack.includes("field") || haystack.includes("operations")) return "Operations";
  if (haystack.includes("finance") || haystack.includes("expense") || haystack.includes("pricing")) return "Finance";
  return "General";
}

function extractFromDom(html) {
  if (typeof DOMParser === "undefined") return [];

  const documentRef = new DOMParser().parseFromString(html, "text/html");
  const anchors = [...documentRef.querySelectorAll('a[href*="/ai-hackathons/nativebuilder-build-without-limits/"]')];
  const seen = new Set();
  const cards = [];

  for (const anchor of anchors) {
    const h2 = anchor.querySelector("h2");
    const paragraph = anchor.querySelector("p");
    if (!h2 || !paragraph) continue;

    const title = h2.textContent.replace(/\s+/g, " ").trim();
    const summary = paragraph.textContent.replace(/\s+/g, " ").trim();
    const href = anchor.getAttribute("href") || "";
    const key = `${title}|${href}`;
    if (!title || !summary || seen.has(key)) continue;
    seen.add(key);

    const spans = [...anchor.querySelectorAll("span")]
      .map((span) => span.textContent.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const team = spans[0] || "Unknown team";
    const technologies = [...new Set(spans.slice(2).filter((span) => !span.startsWith("+")))];
    cards.push({ title, summary, href, team, technologies });
  }

  return cards;
}

function extractWithRegex(html) {
  const cards = [];
  const seen = new Set();
  const anchorPattern = /<a\b[^>]*href="([^"]*\/ai-hackathons\/nativebuilder-build-without-limits\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorPattern.exec(html)) !== null) {
    const href = decodeHtml(match[1]);
    const body = match[2];
    const titleMatch = body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const summaryMatch = body.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (!titleMatch || !summaryMatch) continue;

    const title = stripTags(titleMatch[1]);
    const summary = stripTags(summaryMatch[1]);
    const key = `${title}|${href}`;
    if (!title || !summary || seen.has(key)) continue;
    seen.add(key);

    const spans = [...body.matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)]
      .map((spanMatch) => stripTags(spanMatch[1]))
      .filter(Boolean);
    const team = spans[0] || "Unknown team";
    const technologies = [...new Set(spans.slice(2).filter((span) => !span.startsWith("+")))];
    cards.push({ title, summary, href, team, technologies });
  }

  return cards;
}

function isTechnologyLine(value = "") {
  return /(bright data|api|mcp|claude|openai|chatgpt|gemini|deepseek|speechmatics|featherless|vercel|supabase|github|copilot|llama|agent|studio|datasets?|scraper|proxy)/i.test(
    value
  );
}

function cleanMarkdownText(value = "") {
  return stripTags(
    decodeHtml(value)
      .replace(/^#+\s*/, "")
      .replace(/^[-*]\s*/, "")
      .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
  );
}

function extractWithMarkdown(markdown = "") {
  const cards = [];
  const seen = new Set();
  const linkPattern = /\[([^\]]+)]\(([^)]*\/ai-hackathons\/nativebuilder-build-without-limits\/[^)]*)\)/g;
  const matches = [...String(markdown || "").matchAll(linkPattern)];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const rawTitle = cleanMarkdownText(match[1]);
    const href = decodeHtml(match[2]);
    if (!rawTitle || /^play video$/i.test(rawTitle) || /nativebuilder-build-without-limits$/i.test(href)) continue;

    const nextStart = matches[index + 1]?.index ?? markdown.length;
    const chunk = markdown.slice((match.index || 0) + match[0].length, nextStart);
    const lines = chunk
      .split(/\r?\n/)
      .map(cleanMarkdownText)
      .filter(Boolean)
      .filter((line) => !/^play$/i.test(line) && !/^submitted concepts/i.test(line));
    const summary = lines.find((line) => line.length > 45 && !isTechnologyLine(line)) || lines.find((line) => line.length > 45) || "";
    if (!summary) continue;

    const afterSummary = lines.slice(Math.max(0, lines.indexOf(summary) + 1));
    const team = afterSummary.find((line) => line.length <= 60 && !isTechnologyLine(line) && !line.startsWith("+")) || "Unknown team";
    const technologies = [
      ...new Set(afterSummary.filter((line) => line !== team && !line.startsWith("+") && isTechnologyLine(line)).slice(0, 8))
    ];
    const key = `${rawTitle}|${href}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({ title: rawTitle, summary, href, team, technologies });
  }

  return cards;
}

export function extractProjectsFromHtml(html) {
  const cards = extractFromDom(html);
  const sourceCards = cards.length ? cards : extractWithRegex(html);
  const parsedCards = sourceCards.length ? sourceCards : extractWithMarkdown(html);
  return parsedCards.map(cardToProject);
}
