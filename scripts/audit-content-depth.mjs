import { readdir, readFile } from "node:fs/promises";
import { relative, sep } from "node:path";

const minimumWords = 1000;
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
    const fullPath = `${dir}/${entry.name}`;
    if (entry.isDirectory()) await walk(fullPath, files);
    else if (entry.name === "index.html") files.push(fullPath);
  }
  return files;
}

function pagePath(file) {
  const parent = file.slice(0, -"/index.html".length);
  const rel = relative("dist", parent).split(sep).join("/");
  return rel ? `/${rel}/` : "/";
}

function visibleWordCount(html) {
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
  return (text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) || []).length;
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
}

if (issues.length) {
  console.error(`Found ${issues.length} content depth issues:`);
  for (const issue of issues) console.error(issue);
  process.exit(1);
}

console.log(`Checked ${checked} formal content pages. Content depth passed.`);
