import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const checkedFiles = [
  "app/index.html",
  "app/src/main.js",
  "app/src/visitorBrief.js",
  "app/src/publicReviewCard.js",
  "app/src/prizeBrief.js"
];

const forbiddenVisiblePhrases = [
  "signed proof",
  "judge packet",
  "bright data packet",
  "submission-ready",
  "finalist-ready",
  "bright data evidence passed",
  "evidence passed",
  "server-checked",
  "verified public demos",
  "proof plan",
  "review packet is defensible"
];

for (const file of checkedFiles) {
  const text = readFileSync(join(root, file), "utf8").toLowerCase();
  for (const phrase of forbiddenVisiblePhrases) {
    assert.ok(!text.includes(phrase), `${file} should not include overclaiming phrase: ${phrase}`);
  }
}

console.log("copy guard tests passed");
