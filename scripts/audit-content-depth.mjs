import { readFile } from "node:fs/promises";
import { join } from "node:path";

const minimumWords = 1000;
const pages = [
  "/wu-surname-meaning/",
  "/zhang-surname-origin/"
];

const issues = [];

for (const page of pages) {
  const htmlPath = join("dist", page, "index.html");
  const html = await readFile(htmlPath, "utf8");
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ");
  const words = text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)?/g) || [];
  if (words.length < minimumWords) {
    issues.push(`${page} -> ${words.length} words, expected at least ${minimumWords}`);
  }
}

if (issues.length) {
  console.error(`Found ${issues.length} content depth issues:`);
  for (const issue of issues) {
    console.error(issue);
  }
  process.exit(1);
}

console.log(`Checked ${pages.length} published article pages. Content depth passed.`);
