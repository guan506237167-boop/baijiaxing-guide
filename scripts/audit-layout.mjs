import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const distDir = "dist";
const htmlFiles = await listHtmlFiles(distDir);
const css = await readFile(join(distDir, "styles.css"), "utf8");
const issues = [];
const widePages = new Set(["page-home", "page-guides", "seo-report-page"]);

const requiredSelectors = [
  "body:not(.page-home):not(.page-guides):not(.seo-report-page) .tool-page",
  "body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-body",
  "body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-search",
  "body:not(.page-home):not(.page-guides):not(.seo-report-page) .content-section"
];

for (const selector of requiredSelectors) {
  if (!css.includes(selector)) {
    issues.push(`styles.css -> missing narrow layout selector: ${selector}`);
  }
}

if (!css.includes("max-width:980px")) {
  issues.push("styles.css -> missing 980px narrow content width");
}

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const bodyClass = (html.match(/<body[^>]*class="([^"]*)"/i) || [])[1] || "";
  if ([...widePages].some((item) => bodyClass.split(/\s+/).includes(item))) {
    continue;
  }

  const sections = [...html.matchAll(/<section\s+class="([^"]*(?:content-section|tool-page|article-search)[^"]*)"/gi)]
    .map((match) => match[1])
    .filter((classes) => !classes.includes("tool-strip"));

  if (sections.length >= 2 && !hasStylesheet(html)) {
    issues.push(`${relative(distDir, file)} -> missing shared stylesheet for content layout`);
  }
}

if (issues.length) {
  console.error(`Found ${issues.length} layout audit issues:`);
  for (const issue of issues) {
    console.error(issue);
  }
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files. No narrow-layout issues found.`);

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listHtmlFiles(path));
    } else if (entry.isFile() && extname(entry.name) === ".html") {
      files.push(path);
    }
  }
  return files;
}

function hasStylesheet(html) {
  return /<link\s+rel="stylesheet"\s+href="\/styles\.css\?v=/i.test(html);
}
