import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

const minimumWords = 1000;
const minimumH2 = 4;
const bannedPhrases = [
  "in this article",
  "this comprehensive guide",
  "in today's fast-paced world",
  "it is important to note",
  "overall,",
  "in conclusion",
  "for advertising review",
  "for publishing quality control",
  "for search quality",
  "this page should help readers",
  "a useful guide should"
];
const practicalSignals = [
  "when you",
  "if you",
  "for beginners",
  "for buyers",
  "gift",
  "daily",
  "mistake",
  "check",
  "choose",
  "compare",
  "quality",
  "use case",
  "next step",
  "birth",
  "lunar",
  "boundary",
  "relationship",
  "partner",
  "surname",
  "spelling",
  "character",
  "origin",
  "variant",
  "research",
  "meaning"
];
const excludedPages = new Set([
  "/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/guides/",
  "/chinese-surnames-faq/",
  "/surname-lookup/",
  "/admin/seo-report/"
]);

async function walk(dir, files = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, files);
    } else if (entry.name === "index.html") {
      files.push(fullPath);
    }
  }
  return files;
}

function pagePath(file) {
  const parent = file.slice(0, -"/index.html".length);
  const rel = relative("dist", parent).split(sep).join("/");
  return rel ? `/${rel}/` : "/";
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordsFromText(text) {
  return text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) || [];
}

function visibleWordCount(html) {
  return wordsFromText(visibleText(html)).length;
}

function htmlParagraphs(html) {
  return [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)]
    .map((match) => visibleText(match[1]))
    .filter(Boolean);
}

function countMatches(html, pattern) {
  return (html.match(pattern) || []).length;
}

function qualityIssues(html) {
  const text = visibleText(html);
  const lower = text.toLowerCase();
  const paragraphs = htmlParagraphs(html);
  const issues = [];
  const h2Count = countMatches(html, /<h2\b/gi);
  const faqCount = countMatches(html, /class="[^"]*faq-list|<h[23][^>]*>[^<]*(faq|frequently asked questions)/gi);
  const signalCount = practicalSignals.filter((phrase) => lower.includes(phrase)).length;
  const longParagraphs = paragraphs
    .map((paragraph) => wordsFromText(paragraph).length)
    .filter((count) => count > 130);
  const banned = bannedPhrases.filter((phrase) => lower.includes(phrase));

  if (h2Count < minimumH2) issues.push(`weak structure: ${h2Count} H2 headings, expected at least ${minimumH2}`);
  if (faqCount < 1) issues.push("missing FAQ section");
  if (signalCount < 4) issues.push(`weak human-use signals: ${signalCount}, expected at least 4`);
  if (longParagraphs.length) issues.push(`paragraphs too long: ${longParagraphs.join(", ")} words`);
  if (banned.length) issues.push(`banned template phrases: ${banned.join(", ")}`);

  return issues;
}

const issues = [];
let checked = 0;

for (const file of await walk("dist")) {
  const path = pagePath(file);
  if (excludedPages.has(path) || path.startsWith("/admin/")) continue;
  checked += 1;
  const html = await readFile(file, "utf8");
  const words = visibleWordCount(html);
  if (words < minimumWords) {
    issues.push(`${path} -> ${words} words, expected at least ${minimumWords}`);
  }
  for (const issue of qualityIssues(html)) {
    issues.push(`${path} -> ${issue}`);
  }
}

if (issues.length) {
  console.error(`Found ${issues.length} content quality issues:`);
  for (const issue of issues) {
    console.error(issue);
  }
  process.exit(1);
}

console.log(`Checked ${checked} formal content pages. Content depth and readability passed.`);




