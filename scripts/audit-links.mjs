import { readFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const distDir = "dist";
const htmlFiles = await listHtmlFiles(distDir);
const missing = [];
const htmlIssues = [];
const internalInlinks = new Map();

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const hasDescription = /<meta\s+name="description"\s+content="[^"]+"/i.test(html);
  const hasCanonical = /<link\s+rel="canonical"\s+href="[^"]+"/i.test(html);
  const images = [...html.matchAll(/<img\s+[^>]*>/gi)].map((match) => match[0]);
  const imagesMissingAlt = images.filter((img) => !/\salt="[^"]+"/i.test(img));

  if (!hasDescription) {
    htmlIssues.push(`${file} -> missing meta description`);
  }
  if (!hasCanonical) {
    htmlIssues.push(`${file} -> missing canonical`);
  }
  for (const img of imagesMissingAlt) {
    htmlIssues.push(`${file} -> image alt missing or empty: ${img}`);
  }

  const links = [...html.matchAll(/<a\s+[^>]*href="([^"]+)"/gi)]
    .map((match) => match[1])
    .filter((href) => href.startsWith("/") && !href.startsWith("//"))
    .map((href) => href.split("#")[0].split("?")[0])
    .filter(Boolean);

  for (const link of links) {
    internalInlinks.set(link, (internalInlinks.get(link) || 0) + 1);
    if (!localTargetExists(link)) {
      missing.push({ file, link });
    }
  }
}

const sitemapFile = join(distDir, "sitemap.xml");
if (existsSync(sitemapFile)) {
  const sitemap = await readFile(sitemapFile, "utf8");
  const sitemapPaths = [...sitemap.matchAll(/<loc>(https?:\/\/[^<]+)<\/loc>/gi)]
    .map((match) => new URL(match[1]).pathname)
    .filter((pathname) => pathname !== "/");
  for (const pathname of sitemapPaths) {
    if (!internalInlinks.has(pathname)) {
      htmlIssues.push(`${pathname} -> sitemap page has no internal href inlinks`);
    }
  }
}

if (missing.length) {
  console.error(`Found ${missing.length} missing internal links:`);
  for (const item of missing) {
    console.error(`${item.file} -> ${item.link}`);
  }
  process.exit(1);
}

if (htmlIssues.length) {
  console.error(`Found ${htmlIssues.length} HTML audit issues:`);
  for (const issue of htmlIssues) {
    console.error(issue);
  }
  process.exit(1);
}

console.log(`Checked ${htmlFiles.length} HTML files. No missing internal links found.`);

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

function localTargetExists(pathname) {
  if (pathname === "/") {
    return existsSync(join(distDir, "index.html"));
  }

  const clean = pathname.replace(/^\/+/, "");
  const directFile = normalize(join(distDir, clean));
  const indexFile = normalize(join(distDir, clean, "index.html"));

  return existsSync(directFile) || existsSync(indexFile);
}
