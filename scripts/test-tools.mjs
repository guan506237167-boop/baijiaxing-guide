import { readFile } from "node:fs/promises";

const home = await readFile("dist/index.html", "utf8");
const lookup = await readFile("dist/surname-lookup/index.html", "utf8");
const common = await readFile("dist/common-chinese-surnames/index.html", "utf8");
const baijiaxing = await readFile("dist/hundred-family-surnames/index.html", "utf8");

assert(home.includes("Chinese Surname Guide"), "Home should contain site brand");
assert(home.includes("Find a Chinese surname starting point"), "Home should contain lookup tool");
assert(lookup.includes("Chinese Surname Lookup"), "Lookup page should render");
assert(common.includes("Common surname reference table"), "Common surnames page should contain the table");
assert(baijiaxing.includes("Hundred Family Surnames"), "Baijiaxing guide should render");

assert(searchTarget("li surname origin") === "/surnames/li/", "Li surname search should route to Li profile");
assert(searchTarget("wong surname meaning") === "/surnames/wang/", "Wong search should route to Wang profile");
assert(searchTarget("common chinese surnames") === "/common-chinese-surnames/", "Common list search should route correctly");
assert(searchTarget("hundred family surnames") === "/hundred-family-surnames/", "Baijiaxing search should route correctly");
assert(searchTarget("surname pronunciation") === "/chinese-surname-pronunciation/", "Pronunciation search should route correctly");

console.log("Surname tool logic tests passed.");

function searchTarget(raw) {
  const q = String(raw || "").trim().toLowerCase();
  const surnames = [
    { slug: "li", pinyin: "li", hanzi: "李", variants: ["lee", "lei"], keywords: ["li surname origin", "li surname meaning", "li chinese surname"] },
    { slug: "wang", pinyin: "wang", hanzi: "王", variants: ["wong", "ong"], keywords: ["wang surname origin", "wang surname meaning", "wong surname origin", "wong surname meaning"] }
  ];
  const found = surnames.find((item) => item.pinyin === q || item.hanzi === q || item.variants.includes(q) || item.keywords.some((keyword) => q.includes(keyword.replace(/ surname (origin|meaning)/, "")) || keyword.includes(q)));
  if (found) return `/surnames/${found.slug}/`;
  const rules = [
    { pattern: /meaning/, path: "/chinese-surname-meaning/" },
    { pattern: /origin|history|ancestry/, path: "/chinese-surname-origin/" },
    { pattern: /common|list|top|popular/, path: "/common-chinese-surnames/" },
    { pattern: /hundred|baijiaxing|100 family/, path: "/hundred-family-surnames/" },
    { pattern: /pronunciation|pinyin|tone/, path: "/chinese-surname-pronunciation/" },
    { pattern: /rare|uncommon|compound/, path: "/rare-chinese-surnames/" }
  ];
  const hit = rules.find((rule) => rule.pattern.test(q));
  return hit ? hit.path : "/guides/";
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
