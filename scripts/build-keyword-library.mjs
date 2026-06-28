import fs from "node:fs";
import path from "node:path";

const sourcePath = path.resolve("docs/keyword-library/baijiaxing-keyword-library.csv");
const outDir = path.resolve("docs/keyword-library");

const rows = parseCsv(fs.readFileSync(sourcePath, "utf8"));
const usable = rows.filter((row) => String(row.keyword || "").trim());
const priority = usable.filter((row) => /^P[1-3]$/i.test(String(row.priority || "").trim()));
const groups = groupTopKeywords(priority.length ? priority : usable);

const markdown = [
  "# Chinese Surname Guide 关键词库",
  "",
  `- Source: \`${sourcePath.replaceAll("\\", "/")}\``,
  `- Total keywords: ${usable.length}`,
  `- Priority keywords: ${priority.length}`,
  "",
  "## Topic Buckets",
  ""
];

for (const group of groups) {
  markdown.push(`### ${group.name}`);
  markdown.push("");
  markdown.push("| Keyword | Volume | Competition | Intent | Asset | Priority |");
  markdown.push("|---|---:|---|---|---|---|");
  for (const row of group.rows.slice(0, 60)) {
    markdown.push(`| ${escapePipe(row.keyword)} | ${row.search_volume || ""} | ${row.competition || ""} | ${row.intent || ""} | ${escapePipe(row.recommended_asset || "")} | ${row.priority || ""} |`);
  }
  markdown.push("");
}

fs.writeFileSync(path.join(outDir, "baijiaxing-keyword-library.md"), markdown.join("\n"), "utf8");
console.log(`Wrote ${path.join(outDir, "baijiaxing-keyword-library.md")}`);

function groupTopKeywords(rows) {
  const definitions = [
    { name: "Core Surnames", test: (row) => row.category === "general" },
    { name: "Reference Lists", test: (row) => row.category === "reference-list" },
    { name: "Meaning and Origin", test: (row) => row.category === "meaning-origin" },
    { name: "Expansion", test: () => true }
  ];
  const used = new Set();
  return definitions.map((definition) => {
    const matched = rows.filter((row) => !used.has(row.keyword) && definition.test(row));
    for (const row of matched) used.add(row.keyword);
    return { name: definition.name, rows: matched };
  }).filter((group) => group.rows.length);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  const headers = rows.shift()?.map((value) => value.replace(/^\uFEFF/, "").trim()) || [];
  return rows
    .filter((current) => current.some((value) => String(value || "").trim()))
    .map((current) => Object.fromEntries(headers.map((header, index) => [header, current[index] ?? ""])));
}

function escapePipe(value) {
  return String(value || "").replaceAll("|", "\\|");
}
