import { mkdir, readdir, readFile, rm, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";

const SITE = {
  name: "Chinese Surname Guide",
  url: "https://www.chinesefamilynames.com",
  description: "Explore Chinese surnames, common family names, surname meanings, origins, pronunciation notes, and Hundred Family Surnames context.",
  assetVersion: "20260628-images-01"
};

const GA_MEASUREMENT_ID = process.env.GA_MEASUREMENT_ID || "G-9D7CV8SXGQ";
const keywordRows = parseCsv(await readFile("docs/keyword-library/baijiaxing-keyword-library.csv", "utf8"));
const referenceKeywords = keywordRows.filter((row) => row.category === "reference-list").slice(0, 16);
const meaningKeywords = keywordRows.filter((row) => row.category === "meaning-origin").slice(0, 24);
const generalKeywords = keywordRows.filter((row) => row.category === "general").slice(0, 16);

const surnames = [
  { slug: "li", hanzi: "李", pinyin: "Li", variants: "Lee, Lei", rank: 1, meaning: "Often explained through the character for plum or plum tree in modern reference contexts.", origin: "Li is one of the most common Chinese surnames and appears across many regional romanization systems.", keywords: ["li surname origin", "li surname meaning", "li chinese surname"] },
  { slug: "wang", hanzi: "王", pinyin: "Wang", variants: "Wong, Ong", rank: 2, meaning: "The character Wang means king or ruler.", origin: "Wang is widely used in Mandarin and appears as Wong or Ong in some Cantonese, Hokkien, or regional communities.", keywords: ["wang surname origin", "wang surname meaning", "wong surname origin"] },
  { slug: "zhang", hanzi: "张", pinyin: "Zhang", variants: "Cheung, Chang", rank: 3, meaning: "The character is associated with drawing or stretching a bow.", origin: "Zhang is a major Mandarin surname with common romanized forms such as Cheung and Chang in overseas communities.", keywords: ["zhang surname origin", "zhang surname meaning", "zhang chinese surname"] },
  { slug: "liu", hanzi: "刘", pinyin: "Liu", variants: "Lau, Low", rank: 4, meaning: "The surname is usually treated as a lineage name rather than a simple literal-word surname.", origin: "Liu is historically important and strongly represented in Chinese history and overseas Chinese communities.", keywords: ["liu surname meaning", "liu surname origin", "liu chinese surname"] },
  { slug: "chen", hanzi: "陈", pinyin: "Chen", variants: "Chan, Tan", rank: 5, meaning: "Chen is commonly connected with an ancient state name and lineage identity.", origin: "Chen is a very common Chinese surname, while Chan and Tan are common regional romanizations.", keywords: ["chen surname meaning", "chen surname origin", "chan surname meaning"] },
  { slug: "yang", hanzi: "杨", pinyin: "Yang", variants: "Yeung", rank: 6, meaning: "The character is associated with poplar or willow-like trees in common explanations.", origin: "Yang is a common surname across Mandarin-speaking regions and appears as Yeung in some Cantonese romanization.", keywords: ["yang surname origin", "yang surname meaning", "yang chinese surname"] },
  { slug: "huang", hanzi: "黄", pinyin: "Huang", variants: "Wong, Ng", rank: 7, meaning: "The character Huang means yellow.", origin: "Huang is common in Mandarin contexts; Wong and Ng can appear as related regional romanization forms depending on language and family history.", keywords: ["huang surname origin", "huang surname meaning", "wong surname meaning"] },
  { slug: "zhao", hanzi: "赵", pinyin: "Zhao", variants: "Chao, Chiu", rank: 8, meaning: "Zhao is usually understood as a historical lineage and place-linked surname.", origin: "Zhao is famous as the first surname in the traditional Hundred Family Surnames text.", keywords: ["zhao surname meaning", "zhao surname origin", "zhao chinese surname"] },
  { slug: "wu", hanzi: "吴", pinyin: "Wu", variants: "Ng, Woo", rank: 9, meaning: "Wu is tied to a historical state and lineage identity.", origin: "Wu is common in Mandarin, while Ng and Woo are frequent overseas romanization forms.", keywords: ["wu surname meaning", "wu surname origin", "ng surname origin"] },
  { slug: "zhou", hanzi: "周", pinyin: "Zhou", variants: "Chou, Chow", rank: 10, meaning: "Zhou is associated with an ancient dynasty and lineage tradition.", origin: "Zhou appears in Mandarin as Zhou and in older or regional romanizations as Chou or Chow.", keywords: ["zhou surname meaning", "zhou surname origin", "zhou chinese surname"] }
];

const guides = [
  { title: "Chinese Surnames", path: "/chinese-surnames/", category: "Core Guides", description: "A clear introduction to Chinese family names, order, romanization, and cultural context." },
  { title: "Most Common Chinese Surnames", path: "/common-chinese-surnames/", category: "Reference Lists", description: "Browse common Chinese surnames with characters, pinyin, and romanization notes." },
  { title: "Chinese Surname Meanings", path: "/chinese-surname-meaning/", category: "Meaning Guides", description: "Understand how surname meanings work and why many names need historical context." },
  { title: "Chinese Surname Origins", path: "/chinese-surname-origin/", category: "Origin Guides", description: "Learn common origin patterns behind Chinese family names and lineage references." },
  { title: "Hundred Family Surnames", path: "/hundred-family-surnames/", category: "Classic Text", description: "A practical explanation of the Baijiaxing text and how to read it today." },
  { title: "Surname Lookup", path: "/surname-lookup/", category: "Tools", description: "Look up common Chinese surnames by pinyin, character, or romanized variants." },
  { title: "Rare Chinese Surnames", path: "/rare-chinese-surnames/", category: "Reference Lists", description: "Understand rare, uncommon, compound, and historically notable Chinese surnames." },
  { title: "Chinese Surname Pronunciation", path: "/chinese-surname-pronunciation/", category: "Pronunciation", description: "Read basic pinyin and romanization notes for Chinese surnames in English." }
];

const pages = [];

await rm("dist", { recursive: true, force: true });
await mkdir("dist/assets", { recursive: true });
for (const asset of await readdir("public/assets")) {
  await copyFile(join("public/assets", asset), join("dist/assets", asset));
}
await copyFile("public/_headers", "dist/_headers");
for (const file of await readdir("public")) {
  if (file.endsWith(".html")) await copyFile(join("public", file), join("dist", file));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function absolute(path) {
  return `${SITE.url}${path === "/" ? "" : path}`;
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
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
    .map((current) => Object.fromEntries(headers.map((header, idx) => [header, current[idx] ?? ""])));
}

function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function breadcrumbSchema(items) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.url)
    }))
  });
}

function faqSchema(faqs) {
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a }
    }))
  });
}

function analyticsSnippet() {
  if (!GA_MEASUREMENT_ID) return "";
  const id = escapeHtml(GA_MEASUREMENT_ID);
  return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
  </script>`;
}

function pageClass(path) {
  if (path === "/") return "page-home";
  if (path === "/guides/") return "page-guides";
  return `page-${path.replace(/^\/|\/$/g, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
}

function pageLayout({ title, description, path, h1, intro, body, faqs = [], pageType = "WebPage", extraSchema = "", articleSidebar = false, heroLabel = "Chinese surname reference" }) {
  const canonical = absolute(path);
  const schema = [
    jsonLd({ "@context": "https://schema.org", "@type": pageType, name: title, description, url: canonical, inLanguage: "en" }),
    breadcrumbSchema([{ name: "Home", url: "/" }, { name: h1, url: path }]),
    faqs.length ? faqSchema(faqs) : "",
    extraSchema
  ].join("\n");

  pages.push({ path, title, description, h1, faqs: faqs.length });

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE.url}/assets/surname-archive-hero.webp">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="stylesheet" href="/styles.css?v=${SITE.assetVersion}">
  ${analyticsSnippet()}
  ${schema}
</head>
<body class="${pageClass(path)}">
  <header class="site-header">
    <a class="brand" href="/" aria-label="${SITE.name} home"><img class="brand-logo" src="/assets/logo.svg" alt="${SITE.name} logo">${SITE.name}</a>
    <nav class="nav" aria-label="Main navigation">
      <a href="/">Home</a>
      <a href="/surname-lookup/">Lookup</a>
      <a href="/common-chinese-surnames/">Common Surnames</a>
      <a href="/chinese-surname-meaning/">Meanings</a>
      <a href="/chinese-surname-origin/">Origins</a>
      <a href="/hundred-family-surnames/">Baijiaxing</a>
      <a href="/guides/">Guides</a>
    </nav>
  </header>
  <main>
    <section class="page-hero">
      <div>
        <p class="eyebrow">${heroLabel}</p>
        <h1>${h1}</h1>
        <p class="intro">${intro}</p>
      </div>
    </section>
    ${articleSidebar ? articleLayout(body) : body}
  </main>
  <footer class="site-footer">
    <div class="footer-about">
      <strong>${SITE.name}</strong>
      <p>This site explains Chinese surnames, common romanizations, meanings, and origins for educational reference. It is not a genealogy verification service.</p>
    </div>
    <nav class="footer-nav" aria-label="Footer navigation">
      <div>
        <span>Reference</span>
        <a href="/chinese-surnames/">Chinese surnames</a>
        <a href="/common-chinese-surnames/">Common surnames</a>
        <a href="/hundred-family-surnames/">Hundred Family Surnames</a>
      </div>
      <div>
        <span>Research</span>
        <a href="/surname-lookup/">Surname lookup</a>
        <a href="/chinese-surname-meaning/">Meanings</a>
        <a href="/chinese-surname-origin/">Origins</a>
      </div>
      <div>
        <span>Site</span>
        <a href="/about/">About</a>
        <a href="/contact/">Contact</a>
        <a href="/privacy/">Privacy</a>
        <a href="/terms/">Terms</a>
      </div>
    </nav>
  </footer>
  <script src="/toolkit.js?v=${SITE.assetVersion}" defer></script>
</body>
</html>`;
}

function articleLayout(body) {
  return `<div class="article-shell"><div class="article-main">${body}</div>${articleSidebarBlock()}</div>`;
}

function articleSidebarBlock() {
  const items = [
    { title: "Surname Lookup", path: "/surname-lookup/", description: "Search common surnames by pinyin, Chinese character, or romanization." },
    { title: "Common Chinese Surnames", path: "/common-chinese-surnames/", description: "Browse a quick surname table." },
    { title: "Surname Meanings", path: "/chinese-surname-meaning/", description: "Understand what meaning can and cannot tell you." },
    { title: "Hundred Family Surnames", path: "/hundred-family-surnames/", description: "Read the Baijiaxing context." }
  ];
  return `<aside class="article-sidebar" aria-label="Related guides">
    <section class="sidebar-card">
      <p class="eyebrow">Popular Guides</p>
      <h2>Continue reading</h2>
      <div class="sidebar-link-list">${items.map((item) => `<a href="${item.path}"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.description)}</span></a>`).join("")}</div>
    </section>
    <section class="sidebar-card compact">
      <p class="eyebrow">Quick Tools</p>
      <a class="button-link" href="/surname-lookup/">Open lookup</a>
      <a class="button-link secondary" href="/common-chinese-surnames/">View table</a>
    </section>
  </aside>`;
}

function standardFaqs() {
  return [
    { q: "What is the most common Chinese surname?", a: "Li, Wang, Zhang, Liu, and Chen are among the most common Chinese surnames in modern reference lists." },
    { q: "Why do Chinese surnames usually come first?", a: "In Chinese naming order, the family name normally comes before the given name because lineage is placed first." },
    { q: "Are Chinese surname meanings always literal?", a: "No. Some characters have literal meanings, but surname origin is often historical, regional, or lineage-based." },
    { q: "Why does one Chinese surname have several spellings?", a: "Different romanization systems and dialects can turn one surname into forms such as Wang, Wong, Ong, or Ng." },
    { q: "Is Baijiaxing a complete list of all Chinese surnames?", a: "No. Hundred Family Surnames is a classic educational text, not a complete modern census list." },
    { q: "Can this site verify my family genealogy?", a: "No. It provides surname reference information, but genealogy verification needs family records and specialist research." }
  ];
}

function faqBlock(faqs) {
  const grouped = [
    { title: "Basics", hint: "Names and order", items: faqs.slice(0, 2) },
    { title: "Meaning", hint: "Characters and origins", items: faqs.slice(2, 4) },
    { title: "Research", hint: "Lists and genealogy", items: faqs.slice(4) }
  ].filter((group) => group.items.length);
  return `<section class="content-section faq-list">
    <div class="section-heading"><p class="eyebrow">FAQ</p><h2>Common Chinese surname questions</h2></div>
    <div class="faq-categories">${grouped.map((group) => `<details class="faq-category"${group.title === "Basics" ? " open" : ""}>
      <summary><span>${escapeHtml(group.title)}</span><small>${escapeHtml(group.hint)}</small></summary>
      <div class="faq-grid">${group.items.map((item) => `<div class="faq-item"><h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p></div>`).join("")}</div>
    </details>`).join("")}</div>
  </section>`;
}

function articleSearchBlock() {
  return `<section class="content-section article-search">
    <div><p class="eyebrow">Site Search</p><h2>Search surname topics</h2></div>
    <form class="site-search-form" data-site-search>
      <label>Search the site
        <input type="text" name="q" placeholder="li surname origin, common Chinese surnames, Baijiaxing" required>
      </label>
      <button type="submit">Search</button>
    </form>
  </section>`;
}

function guideCard(guide) {
  return `<a class="guide-card" href="${guide.path}" data-guide-card data-guide-category="${slugify(guide.category)}">
    <span>${escapeHtml(guide.category)}</span>
    <strong>${escapeHtml(guide.title)}</strong>
    <p>${escapeHtml(guide.description)}</p>
  </a>`;
}

function guideFilterBlock() {
  const categories = [...new Set(guides.map((guide) => guide.category))];
  return `<nav class="guide-filter-nav" aria-label="Filter guides by category"><button type="button" class="is-active" data-guide-filter="all">All</button>${categories.map((category) => `<button type="button" data-guide-filter="${slugify(category)}">${escapeHtml(category.replace(" Guides", ""))}</button>`).join("")}</nav>`;
}

function latestGuidesBlock(items = guides.slice(0, 6)) {
  return `<section class="content-section latest-guides">
    <div class="section-heading"><p class="eyebrow">Latest Guides</p><h2>Start with these surname topics</h2></div>
    <div class="guide-grid">${items.map(guideCard).join("")}</div>
    <div class="section-action"><a class="button-link secondary" href="/guides/">Browse all guides</a></div>
  </section>`;
}

function relatedGuidesBlock(title, items) {
  return `<section class="content-section related-guides">
    <div class="section-heading"><p class="eyebrow">Related Guides</p><h2>${escapeHtml(title)}</h2></div>
    <div class="guide-grid compact">${items.map(guideCard).join("")}</div>
  </section>`;
}

function surnameTable(items = surnames) {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Character</th><th>Pinyin</th><th>Common variants</th><th>Meaning note</th><th>Guide</th></tr></thead>
    <tbody>${items.map((item) => `<tr><td class="hanzi">${escapeHtml(item.hanzi)}</td><td>${escapeHtml(item.pinyin)}</td><td>${escapeHtml(item.variants)}</td><td>${escapeHtml(item.meaning)}</td><td><a href="/surnames/${item.slug}/">Open</a></td></tr>`).join("")}</tbody>
  </table></div>`;
}

function surnameCards(items = surnames.slice(0, 8)) {
  return `<div class="animal-grid">${items.map((item) => `<a class="animal-card" href="/surnames/${item.slug}/">
    <span class="animal-seal">${escapeHtml(item.hanzi)}</span>
    <span class="animal-order">#${item.rank}</span>
    <strong>${escapeHtml(item.pinyin)}</strong>
    <span>${escapeHtml(item.variants)}</span>
    <p>${escapeHtml(item.origin)}</p>
  </a>`).join("")}</div>`;
}

function keywordTable(rows, title, eyebrow = "Keyword Cluster") {
  return `<section class="content-section">
    <div class="section-heading"><p class="eyebrow">${eyebrow}</p><h2>${escapeHtml(title)}</h2></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Keyword</th><th>Volume</th><th>Intent</th><th>Page type</th></tr></thead>
      <tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.keyword)}</td><td>${escapeHtml(row.search_volume)}</td><td>${escapeHtml(row.intent)}</td><td>${escapeHtml(row.recommended_asset)}</td></tr>`).join("")}</tbody>
    </table></div>
  </section>`;
}

function adSlot(position) {
  return `<aside class="ad-slot" data-ad-position="${position}" aria-label="Advertisement area">Advertisement</aside>`;
}

function simpleInfoPage({ title, description, path, h1, intro, body }) {
  return pageLayout({ title, description, path, h1, intro, body, heroLabel: "Site information" });
}

function simpleLegalPage({ title, description, path, h1, intro, sections }) {
  return pageLayout({
    title,
    description,
    path,
    h1,
    intro,
    heroLabel: "Legal information",
    body: sections.map((section) => `<section class="content-section article-body"><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.text)}</p></section>`).join("")
  });
}

function supportArticle({ title, description, path, h1, intro, answer, details, related }) {
  return pageLayout({
    title,
    description,
    path,
    h1,
    intro,
    heroLabel: "Surname guide",
    faqs: standardFaqs(),
    articleSidebar: true,
    body: `
      ${articleSearchBlock()}
      <section class="content-section article-body">
        <p class="lead-answer">${escapeHtml(answer)}</p>
        ${details.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
      </section>
      ${relatedGuidesBlock("Related surname guides", related)}
      ${faqBlock(standardFaqs())}
    `
  });
}

function surnamePage(item) {
  return pageLayout({
    title: `${item.pinyin} Surname Meaning, Origin, Chinese Character, and Variants`,
    description: `Learn the ${item.pinyin} Chinese surname, character ${item.hanzi}, common romanized forms, meaning notes, and origin context.`,
    path: `/surnames/${item.slug}/`,
    h1: `${item.pinyin} Surname`,
    intro: `A focused guide to the ${item.pinyin} surname, its Chinese character, romanized variants, and basic origin context.`,
    heroLabel: "Surname profile",
    faqs: standardFaqs(),
    articleSidebar: true,
    body: `
      ${articleSearchBlock()}
      <section class="content-section article-body">
        <p class="lead-answer">The ${escapeHtml(item.pinyin)} surname is written ${escapeHtml(item.hanzi)} in simplified Chinese. Common romanized forms include ${escapeHtml(item.variants)}. Its meaning and origin should be read as surname reference context, not as a direct genealogy record.</p>
        <p>${escapeHtml(item.origin)}</p>
      </section>
      <section class="content-section split">
        <div class="fact-card"><strong>Quick facts</strong><span>Character: ${escapeHtml(item.hanzi)}</span><span>Pinyin: ${escapeHtml(item.pinyin)}</span><span>Variants: ${escapeHtml(item.variants)}</span></div>
        <div class="fact-card"><strong>Meaning note</strong><span>${escapeHtml(item.meaning)}</span></div>
      </section>
      ${keywordTable(keywordRows.filter((row) => item.keywords.includes(row.keyword)).slice(0, 8), `${item.pinyin} surname keyword cluster`, "Surname Intent")}
      ${relatedGuidesBlock("Continue surname research", [guides[1], guides[2], guides[3], guides[5]])}
      ${faqBlock(standardFaqs())}
    `
  });
}

await writePage("/", pageLayout({
  title: "Chinese Surname Guide: Meanings, Origins, Common Family Names, and Lookup",
  description: SITE.description,
  path: "/",
  h1: "Chinese Surname Guide",
  intro: "Look up Chinese surnames, compare common family names, and understand meaning, origin, pinyin, and romanization notes in one place.",
  heroLabel: "Chinese family name reference",
  body: `
    <section class="surname-hero">
      <div class="surname-hero-copy">
        <p class="eyebrow">Hundred Family Surnames</p>
        <h2>Trace Chinese family names through characters, origins, and heritage.</h2>
        <p>Explore common Chinese surnames with character notes, pinyin, romanized variants, Baijiaxing context, and practical English explanations.</p>
        <form class="surname-lookup-strip" data-surname-form>
          <label>Search surname
            <input name="surname" placeholder="Li, Wang, Chen, Lee, Wong">
          </label>
          <label>Research goal
            <select name="goal">
              <option value="meaning">Meaning</option>
              <option value="origin">Origin</option>
              <option value="common">Common surname list</option>
            </select>
          </label>
          <button type="submit">Look up</button>
        </form>
        <div class="result-card" data-surname-result hidden></div>
      </div>
      <figure class="surname-photo-card" aria-label="Chinese genealogy archive scene">
        <img src="/assets/surname-archive-hero.webp" alt="Premium Chinese genealogy archive table with old books, brush, rice paper, and seal stone">
        <figcaption><strong>百家姓</strong><small>classic surname reference</small></figcaption>
      </figure>
    </section>
    <section class="surname-stats" aria-label="Surname guide strengths">
      <div><strong>10</strong><span>starter surname profiles</span></div>
      <div><strong>4</strong><span>research paths</span></div>
      <div><strong>Baijiaxing</strong><span>classic text context</span></div>
      <div><strong>Pinyin</strong><span>variant spelling support</span></div>
    </section>
    <section class="surname-section surname-grid-section">
      <div class="section-heading"><p class="eyebrow">Top Surnames</p><h2>Start with major Chinese family names</h2></div>
      ${surnameCards(surnames.slice(0, 10))}
    </section>
    <section class="surname-section origin-paths">
      <div class="section-heading"><p class="eyebrow">Research Paths</p><h2>Read a surname from four useful angles</h2></div>
      <div class="origin-grid">
        <a href="/chinese-surname-meaning/"><img src="/assets/surname-seal-research.webp" alt="Chinese seal and rice paper for surname meaning research"><span>01</span><strong>Meaning</strong><p>Read the character meaning without overclaiming genealogy.</p></a>
        <a href="/chinese-surname-origin/"><img src="/assets/surname-classic-books.webp" alt="Chinese lineage books and archive materials for surname origin research"><span>02</span><strong>Origin</strong><p>Connect surnames with states, places, titles, and lineage context.</p></a>
        <a href="/common-chinese-surnames/"><img src="/assets/surname-archive-hero.webp" alt="Old Chinese surname books and archive table for common surname reference"><span>03</span><strong>Common Names</strong><p>Compare high-frequency surnames with pinyin and variants.</p></a>
        <a href="/hundred-family-surnames/"><img src="/assets/surname-classic-books.webp" alt="Classic Chinese books and bamboo slips for Hundred Family Surnames context"><span>04</span><strong>Baijiaxing</strong><p>Use the classic text as a cultural reference, not a census list.</p></a>
      </div>
    </section>
    ${latestGuidesBlock()}
  `
}));

await writePage("/guides/", pageLayout({
  title: "Chinese Surname Guides: Meanings, Origins, Lists, and Baijiaxing",
  description: "Browse all Chinese surname guides covering common family names, surname meanings, origins, pronunciation, and Hundred Family Surnames.",
  path: "/guides/",
  h1: "Chinese Surname Guides",
  intro: "Browse reference pages, meaning guides, origin guides, and surname lookup tools.",
  body: `
    ${articleSearchBlock()}
    <section class="content-section latest-guides"><div class="section-heading"><p class="eyebrow">Guide Library</p><h2>Browse all surname guides</h2></div>${guideFilterBlock()}<div class="guide-grid">${guides.map(guideCard).join("")}</div></section>
    ${keywordTable(meaningKeywords.slice(0, 10), "Meaning and origin keyword cluster", "Publishing Queue")}
  `
}));

await writePage("/chinese-surnames/", supportArticle({
  title: "Chinese Surnames: Family Name Order, Characters, Meanings, and Variants",
  description: "Learn how Chinese surnames work, why the family name comes first, and why one surname can have multiple romanized spellings.",
  path: "/chinese-surnames/",
  h1: "Chinese Surnames",
  intro: "Chinese surnames are short, historically layered, and often written before the given name.",
  answer: "Chinese surnames usually come before the given name. Many are one Chinese character, but some are compound surnames with two characters. English spellings can vary because Mandarin, Cantonese, Hokkien, and other systems romanize names differently.",
  details: [
    "A surname is not always explained by its literal character meaning. It can also reflect old place names, noble titles, ancient states, occupations, or lineage traditions.",
    "For English readers, the most useful first step is to match the character, pinyin, and common romanized variants before reading deeper origin notes."
  ],
  related: [guides[1], guides[2], guides[3], guides[5]]
}));

await writePage("/common-chinese-surnames/", pageLayout({
  title: "Most Common Chinese Surnames List with Characters, Pinyin, and Variants",
  description: "Browse common Chinese surnames with simplified characters, pinyin spellings, romanized variants, and quick meaning notes.",
  path: "/common-chinese-surnames/",
  h1: "Most Common Chinese Surnames",
  intro: "Use this table as a practical starting point for the most searched Chinese surnames.",
  faqs: standardFaqs(),
  articleSidebar: true,
  body: `
    ${articleSearchBlock()}
    <section class="content-section article-body"><p class="lead-answer">The most common Chinese surnames include Li, Wang, Zhang, Liu, Chen, Yang, Huang, Zhao, Wu, and Zhou. English spellings can vary, so a surname table should include character, pinyin, and romanized variants together.</p></section>
    <section class="content-section"><div class="section-heading"><p class="eyebrow">Surname Table</p><h2>Common surname reference table</h2></div>${surnameTable()}</section>
    ${keywordTable(referenceKeywords.slice(0, 10), "Reference-list keyword cluster", "List Intent")}
    ${faqBlock(standardFaqs())}
  `
}));

await writePage("/chinese-surname-meaning/", supportArticle({
  title: "Chinese Surname Meanings: How to Read Family Name Characters Carefully",
  description: "Understand Chinese surname meanings, why literal character translation is limited, and how to read meaning with origin context.",
  path: "/chinese-surname-meaning/",
  h1: "Chinese Surname Meanings",
  intro: "Surname meaning is useful, but it should not be read as a complete family history.",
  answer: "A Chinese surname meaning may come from the written character, but the family name itself often carries older historical and lineage context. The literal meaning is only one layer.",
  details: [
    "Some surnames have clear modern character meanings, such as Wang meaning king. Others are better understood through old states, places, clans, or historical references.",
    "For a practical article, explain the character first, then explain why surname origin may be broader than the character meaning."
  ],
  related: [guides[3], guides[1], guides[5], guides[0]]
}));

await writePage("/chinese-surname-origin/", supportArticle({
  title: "Chinese Surname Origins: Lineage, Ancient States, Places, and History",
  description: "Learn common Chinese surname origin patterns, including ancient states, place names, titles, clans, and regional romanization.",
  path: "/chinese-surname-origin/",
  h1: "Chinese Surname Origins",
  intro: "Chinese surname origins often connect to old states, places, titles, clans, and historical lineage traditions.",
  answer: "Chinese surname origins commonly come from ancient states, place names, official titles, ancestral names, occupations, or clan history. A modern spelling alone is rarely enough to identify the full origin.",
  details: [
    "The same English spelling may refer to different Chinese characters, and the same Chinese character can appear under different romanized spellings.",
    "That is why serious surname research should start with the Chinese character and then move into pinyin, regional spellings, and documented family history."
  ],
  related: [guides[2], guides[4], guides[5], guides[1]]
}));

await writePage("/hundred-family-surnames/", supportArticle({
  title: "Hundred Family Surnames: Baijiaxing Meaning, Order, and Modern Use",
  description: "Understand the Hundred Family Surnames text, why it starts with Zhao, Qian, Sun, Li, and how to use it as a reference today.",
  path: "/hundred-family-surnames/",
  h1: "Hundred Family Surnames",
  intro: "Baijiaxing is a classic surname text, but it is not a modern ranking table or complete surname database.",
  answer: "Hundred Family Surnames, or Baijiaxing, is a traditional Chinese educational text that lists surnames in a memorable sequence. It begins with Zhao, Qian, Sun, and Li, but the order is historical and literary, not a modern population ranking.",
  details: [
    "The text is useful because it preserves a shared cultural surname reference. It should not be confused with a full census list.",
    "Modern readers can use it to understand classic surname order, but common-surname ranking requires modern demographic data."
  ],
  related: [guides[1], guides[0], guides[6], guides[7]]
}));

await writePage("/surname-lookup/", pageLayout({
  title: "Chinese Surname Lookup Tool by Character, Pinyin, and Romanized Spelling",
  description: "Use the Chinese surname lookup tool to search common family names by pinyin, Chinese character, or romanized variants.",
  path: "/surname-lookup/",
  h1: "Chinese Surname Lookup",
  intro: "Search a surname spelling and get the closest guide, character, variant forms, and next research step.",
  faqs: standardFaqs(),
  articleSidebar: true,
  body: `
    ${articleSearchBlock()}
    <section class="tool-page"><section class="tool-panel">
      <div class="tool-copy"><p class="eyebrow">Lookup Tool</p><h2>Find surname details</h2><p>Enter a pinyin spelling, common English spelling, or Chinese character.</p></div>
      <form class="calculator-form match-form" data-surname-form>
        <label>Surname or spelling<input name="surname" placeholder="Lee, Wang, 陈, Ng"></label>
        <label>Goal<select name="goal"><option value="meaning">Meaning</option><option value="origin">Origin</option><option value="common">Common surname list</option></select></label>
        <button type="submit">Look up</button>
      </form>
      <div class="result-card" data-surname-result hidden></div>
    </section></section>
    <section class="content-section article-body"><p class="lead-answer">A good Chinese surname lookup should match more than one spelling. Lee may point to Li, Wong may point to Wang or Huang depending on character, and Ng may point to Wu or Huang depending on regional usage.</p></section>
    ${surnameTable()}
    ${faqBlock(standardFaqs())}
  `
}));

await writePage("/rare-chinese-surnames/", supportArticle({
  title: "Rare Chinese Surnames: Uncommon Names, Compound Surnames, and Notes",
  description: "Learn how rare Chinese surnames and two-character compound surnames work, with examples and research cautions.",
  path: "/rare-chinese-surnames/",
  h1: "Rare Chinese Surnames",
  intro: "Rare surnames can be historically important, regionally concentrated, or simply less visible in English search data.",
  answer: "Rare Chinese surnames include less common single-character surnames and compound surnames such as Ouyang, Sima, and Situ. Rarity depends on region, dataset, and romanization.",
  details: [
    "A surname can look rare in English because its spelling is uncommon, even if the Chinese character is better known under another romanization.",
    "Compound surnames deserve separate handling because two characters work together as one family name."
  ],
  related: [guides[1], guides[4], guides[5], guides[3]]
}));

await writePage("/chinese-surname-pronunciation/", supportArticle({
  title: "Chinese Surname Pronunciation: Pinyin, Tones, and English Spellings",
  description: "Learn basic Chinese surname pronunciation issues, including pinyin, tones, and why English spellings vary.",
  path: "/chinese-surname-pronunciation/",
  h1: "Chinese Surname Pronunciation",
  intro: "Chinese surname pronunciation is easier when you separate character, pinyin, tone, and romanized spelling.",
  answer: "Pinyin gives a standard Mandarin reading, but many English surname spellings come from Cantonese, Hokkien, older systems, or family-specific romanization. That is why spelling and pronunciation do not always match neatly.",
  details: [
    "For example, Wang, Wong, Ong, Ng, and Huang can overlap in confusing ways when only English spelling is available.",
    "When accuracy matters, ask for the Chinese character first, then read the pinyin and regional spelling notes."
  ],
  related: [guides[0], guides[1], guides[5], guides[2]]
}));

for (const item of surnames) {
  await writePage(`/surnames/${item.slug}/`, surnamePage(item));
}

await writePage("/chinese-surnames-faq/", pageLayout({
  title: "Chinese Surnames FAQ: Common Questions About Family Names and Meanings",
  description: "Browse frequently asked questions about Chinese surnames, family name order, meanings, romanization, and Baijiaxing.",
  path: "/chinese-surnames-faq/",
  h1: "Chinese Surnames FAQ",
  intro: "Use this FAQ for quick answers about Chinese family names, common spellings, and surname history.",
  faqs: standardFaqs(),
  body: `${articleSearchBlock()}${faqBlock(standardFaqs())}`
}));

await writePage("/about/", simpleInfoPage({
  title: "About Chinese Surname Guide and Its Reference Scope",
  description: "Learn what Chinese Surname Guide covers, including surname meanings, common family names, romanization, and Baijiaxing reference content.",
  path: "/about/",
  h1: "About Chinese Surname Guide",
  intro: "This site explains Chinese surnames for English readers who need quick, practical reference pages.",
  body: `<section class="content-section article-body"><h2>What this site covers</h2><p>Chinese Surname Guide covers common surnames, surname meanings, origin patterns, romanization variants, pronunciation basics, and the Hundred Family Surnames text.</p><p>The site is designed for reference and content discovery, not private genealogy verification.</p></section><section class="content-section article-body"><h2>How to use the site</h2><p>Start with the lookup tool if you already have a surname spelling. Use the common surname table when you need a broader list, and use meaning or origin pages when writing or researching a specific name.</p></section>`
}));

await writePage("/contact/", simpleInfoPage({
  title: "Contact Chinese Surname Guide for Corrections and Feedback",
  description: "Contact Chinese Surname Guide for page corrections, spelling feedback, romanization notes, or relevant partnership discussion.",
  path: "/contact/",
  h1: "Contact",
  intro: "Use this page for corrections, feedback, or site-related discussion.",
  body: `<section class="content-section article-body"><h2>Email</h2><p>Email: <a href="mailto:guan@shanyuegroup.com">guan@shanyuegroup.com</a></p><p>Please include the page URL, surname spelling, and Chinese character if your message is about a correction.</p></section><section class="content-section article-body"><h2>Scope</h2><p>The site can review public reference corrections, but it does not verify private family trees or personal genealogy claims.</p></section>`
}));

await writePage("/privacy/", simpleLegalPage({
  title: "Privacy Policy for Chinese Surname Guide Website Visitors",
  description: "Read the Chinese Surname Guide privacy policy covering analytics, email contact use, and standard website visitor data handling.",
  path: "/privacy/",
  h1: "Privacy Policy",
  intro: "This page explains what data may be handled through normal site usage.",
  sections: [
    { title: "Analytics", text: "The site may use analytics tools to understand visits, pages viewed, and general content performance." },
    { title: "Contact", text: "If you contact the site by email, the information you send is used only for that communication." },
    { title: "No user accounts", text: "The current site does not provide public user accounts, subscriptions, or checkout forms." }
  ]
}));

await writePage("/terms/", simpleLegalPage({
  title: "Terms of Use for Chinese Surname Guide Reference Content",
  description: "Review the terms of use for Chinese Surname Guide, including educational reference scope and genealogy limitations.",
  path: "/terms/",
  h1: "Terms of Use",
  intro: "This site provides educational reference content about Chinese surnames and related cultural context.",
  sections: [
    { title: "Reference use", text: "Content is provided for general educational and informational use only." },
    { title: "No genealogy guarantee", text: "The site does not verify private family records, lineage claims, or personal ancestry." },
    { title: "Content boundaries", text: "Surname meanings and origins are simplified reference explanations and should be checked against primary records for formal research." }
  ]
}));

await writeFile("dist/toolkit.js", clientScript(), "utf8");
await writeFile("dist/styles.css", css() + themeCss(), "utf8");
await writeFile("dist/sitemap.xml", sitemapXml(), "utf8");
await writeFile("dist/robots.txt", robotsTxt(), "utf8");
await writeFile("dist/llms.txt", llmsTxt(), "utf8");
await buildSeoReport();

async function writePage(path, html) {
  const file = path === "/" ? join("dist", "index.html") : join("dist", path, "index.html");
  await mkdir(join(file, ".."), { recursive: true });
  await writeFile(file, html, "utf8");
}

function sitemapXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((page) => `  <url><loc>${absolute(page.path)}</loc></url>`).join("\n")}\n</urlset>\n`;
}

function robotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`;
}

function llmsTxt() {
  return `# Chinese Surname Guide\n- Home: ${SITE.url}/\n- Surname lookup: ${SITE.url}/surname-lookup/\n- Common Chinese surnames: ${SITE.url}/common-chinese-surnames/\n- Chinese surname meanings: ${SITE.url}/chinese-surname-meaning/\n- Hundred Family Surnames: ${SITE.url}/hundred-family-surnames/\n- Sitemap: ${SITE.url}/sitemap.xml\n`;
}

async function buildSeoReport() {
  const sitemap = await readFile("dist/sitemap.xml", "utf8");
  const reports = [];
  for (const page of pages) {
    const file = page.path === "/" ? join("dist", "index.html") : join("dist", page.path, "index.html");
    reports.push(auditPage(page, await readFile(file, "utf8"), sitemap));
  }
  const totals = {
    average: Math.round(reports.reduce((sum, item) => sum + item.score, 0) / reports.length),
    pages: reports.length,
    pass: reports.filter((item) => item.score >= 85).length,
    review: reports.filter((item) => item.score >= 70 && item.score < 85).length,
    fix: reports.filter((item) => item.score < 70).length
  };
  const rows = reports.map((item) => `<tr><td><a href="${item.path}">${item.path}</a></td><td>${item.score}</td><td>${item.titleLength}</td><td>${item.descriptionLength}</td><td>${item.wordCount}</td><td>${item.h1}/${item.h2}</td><td>${item.faqs}</td><td>${escapeHtml(item.issues.join("; ") || "None")}</td></tr>`).join("");
  await mkdir("dist/admin", { recursive: true });
  await writeFile("dist/admin/seo-report.json", JSON.stringify({ generatedAt: new Date().toISOString(), totals, reports }, null, 2), "utf8");
  await writePage("/admin/seo-report/", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pre-Publish SEO Check</title><meta name="robots" content="noindex,nofollow"><meta name="description" content="Internal publishing QA report for Chinese Surname Guide pages."><link rel="canonical" href="${absolute("/admin/seo-report/")}"><link rel="stylesheet" href="/styles.css?v=${SITE.assetVersion}"></head><body class="seo-report-page"><main><section class="content-section report-hero"><p class="eyebrow">Publishing QA</p><h1>Pre-Publish SEO Check</h1><p>Internal publishing checks for title, description, headings, FAQ, canonical, schema, sitemap, internal links, images, and content depth.</p><div class="report-summary"><div><strong>${totals.average}</strong><span>Average score</span></div><div><strong>${totals.pages}</strong><span>Pages</span></div><div><strong>${totals.pass}</strong><span>Pass</span></div><div><strong>${totals.review}</strong><span>Review</span></div><div><strong>${totals.fix}</strong><span>Fix</span></div></div></section><section class="content-section"><div class="table-wrap"><table class="seo-table"><thead><tr><th>URL</th><th>Score</th><th>Title</th><th>Description</th><th>Words</th><th>H1/H2</th><th>FAQ</th><th>Issues</th></tr></thead><tbody>${rows}</tbody></table></div></section></main></body></html>`);
}

function auditPage(page, html, sitemap) {
  const title = (html.match(/<title>(.*?)<\/title>/i) || [])[1] || "";
  const description = (html.match(/<meta name="description" content="([^"]*)"/i) || [])[1] || "";
  const h1 = (html.match(/<h1/g) || []).length;
  const h2 = (html.match(/<h2/g) || []).length;
  const faqCount = (html.match(/"@type":"Question"/g) || []).length;
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const issues = [];
  if (title.length < 35 || title.length > 78) issues.push("title length");
  if (description.length < 90 || description.length > 170) issues.push("description length");
  if (h1 !== 1) issues.push("h1 count");
  if (h2 < 2) issues.push("low h2 count");
  if (!sitemap.includes(`<loc>${absolute(page.path)}</loc>`)) issues.push("missing from sitemap");
  const needsFaq = page.path.startsWith("/surnames/")
    || page.path.includes("surname")
    || ["/chinese-surnames/", "/common-chinese-surnames/", "/hundred-family-surnames/", "/rare-chinese-surnames/"].includes(page.path);
  if (needsFaq && page.path !== "/guides/" && faqCount < 2) issues.push("missing FAQ");
  if (wordCount < 180) issues.push("thin content");
  let score = Math.max(54, Math.min(100, 100 - issues.length * 8 + (wordCount > 520 ? 4 : 0)));
  return { path: page.path, score, titleLength: title.length, descriptionLength: description.length, wordCount, h1, h2, faqs: faqCount, issues };
}

function clientScript() {
  const surnameTargets = surnames.map((item) => ({ ...item, path: `/surnames/${item.slug}/` }));
  const guideTargets = guides.map((guide) => ({ title: guide.title, path: guide.path, category: guide.category }));
  return `const surnames=${JSON.stringify(surnameTargets)};const guideTargets=${JSON.stringify(guideTargets)};function resultLink(path,label){return '<div class="result-actions"><a class="button-link" href="'+path+'">'+label+'</a></div>'}function findSurname(q){q=String(q||'').trim().toLowerCase();return surnames.find(s=>s.pinyin.toLowerCase()===q||s.hanzi===q||s.variants.toLowerCase().split(/,\\s*/).includes(q)||s.keywords.some(k=>k.includes(q)||q.includes(k.replace(/ surname (origin|meaning)/,''))))}document.querySelectorAll('[data-surname-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const data=new FormData(form);const found=findSurname(data.get('surname'));const goal=data.get('goal');const box=form.parentElement.querySelector('[data-surname-result]');box.hidden=false;if(found){const intro=goal==='origin'?found.origin:goal==='meaning'?found.meaning:'Open the profile or compare it with common surname lists.';box.innerHTML='<h3>'+found.pinyin+' surname '+found.hanzi+'</h3><p>'+intro+'</p>'+resultLink(found.path,'Open surname guide');return}const target=goal==='origin'?'/chinese-surname-origin/':goal==='meaning'?'/chinese-surname-meaning/':'/common-chinese-surnames/';box.innerHTML='<h3>No exact profile yet</h3><p>Use the broader guide while this surname is added to the publishing queue.</p>'+resultLink(target,'Open related guide');}));document.querySelectorAll('[data-site-search]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();const q=String(new FormData(form).get('q')||'').toLowerCase().trim();if(!q){location.href='/guides/';return}const found=findSurname(q);if(found){location.href=found.path;return}const direct=[{pattern:/meaning/,path:'/chinese-surname-meaning/'},{pattern:/origin|history|ancestry/,path:'/chinese-surname-origin/'},{pattern:/common|list|top|popular/,path:'/common-chinese-surnames/'},{pattern:/hundred|baijiaxing|100 family/,path:'/hundred-family-surnames/'},{pattern:/pronunciation|pinyin|tone/,path:'/chinese-surname-pronunciation/'},{pattern:/rare|uncommon|compound/,path:'/rare-chinese-surnames/'}].find(item=>item.pattern.test(q));if(direct){location.href=direct.path;return}const match=guideTargets.find(item=>item.title.toLowerCase().split(' ').some(word=>word.length>3&&q.includes(word)));location.href=match?match.path:'/guides/';}));document.querySelectorAll('[data-guide-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-guide-filter]').forEach(item=>item.classList.remove('is-active'));button.classList.add('is-active');const value=button.dataset.guideFilter;document.querySelectorAll('[data-guide-card]').forEach(card=>{card.hidden=value!=='all'&&card.dataset.guideCategory!==value;});}));`;
}

function css() {
  return `:root{--ink:#211d18;--muted:#62594e;--paper:#f7f2ea;--panel:#fffdfa;--line:#e3d6c7;--red:#9f3528;--red-dark:#7d291f;--gold:#b88c4a;--jade:#286b61;--blue:#2f4f63;--shadow:0 10px 28px rgba(47,37,23,.08)}*{box-sizing:border-box}body{margin:0;font-family:Inter,Segoe UI,Arial,sans-serif;color:var(--ink);background:var(--paper);font-size:16px;line-height:1.62}a{color:inherit}.site-header{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:13px clamp(18px,4vw,52px);background:rgba(247,242,234,.96);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-size:17px;font-weight:780;white-space:nowrap}.brand-logo{display:block;width:34px;height:34px;border-radius:8px;box-shadow:0 8px 18px rgba(159,53,40,.18)}.nav{display:flex;align-items:center;justify-content:flex-end;gap:18px;flex-wrap:wrap}.nav a{text-decoration:none;color:#554d45;font-size:15px;font-weight:720;line-height:1.2;padding:4px 0}.nav a:hover{color:var(--red)}main{min-height:70vh}.page-hero{padding:28px clamp(18px,4vw,52px) 16px;max-width:1160px;margin:auto}.page-hero h1{font-family:Georgia,serif;font-size:clamp(31px,3.6vw,46px);line-height:1.08;margin:9px 0 10px;color:#211b17}.intro{font-size:16px;max-width:760px;color:var(--muted)}.eyebrow{display:inline-flex;align-items:center;min-height:28px;padding:0 11px;border-radius:999px;background:rgba(40,107,97,.08);border:1px solid rgba(40,107,97,.18);text-transform:uppercase;letter-spacing:.05em;color:var(--jade);font-size:12px;line-height:1;font-weight:780;margin:0}.hero-grid,.content-section{max-width:1160px;margin:0 auto 22px;padding:0 clamp(18px,4vw,52px)}.hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(300px,.95fr);gap:22px;align-items:stretch}.tool-page{max-width:820px;margin:0 auto 22px;padding:0 clamp(18px,4vw,40px)}.tool-page .tool-panel{max-width:720px;margin:0 auto;padding:20px 22px}.tool-panel,.visual-panel,.content-section:not(.split),.fact-card{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:8px}.tool-panel{padding:22px;border-top:4px solid var(--red)}.tool-copy h2,.section-heading h2,.content-section h2{font-family:Georgia,serif;font-size:clamp(22px,2.2vw,27px);line-height:1.18;margin:8px 0 10px;color:#241f1a}.content-section p{max-width:820px}.calculator-form{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:12px;align-items:end;margin-top:16px;max-width:620px}.match-form{grid-template-columns:1fr 1fr}.match-form button{grid-column:1/-1;width:100%}.calculator-form label{display:grid;gap:7px;font-size:14px;font-weight:720}.calculator-form input,.calculator-form select{height:43px;border:1px solid var(--line);border-radius:8px;padding:0 12px;font:inherit;background:#fff;width:100%;min-width:0}.calculator-form button,.button-link{min-height:43px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:8px;background:var(--red);color:#fff;font-size:14px;font-weight:780;text-decoration:none;padding:0 15px;cursor:pointer;white-space:nowrap}.button-link.secondary{background:#f2eadf;color:#3a3028;border:1px solid #dfd1bd}.calculator-form button:hover,.button-link:hover{background:var(--red-dark);color:#fff}.result-card{margin-top:16px;padding:16px;border-left:4px solid var(--jade);background:#eff7f3;border-radius:8px}.result-card h3{margin:0 0 10px;font-size:20px}.result-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}.visual-panel{position:relative;margin:0;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#fffaf0,#f1eadb);padding:18px}.visual-panel img{position:relative;width:92%;height:92%;object-fit:contain;filter:drop-shadow(0 18px 28px rgba(80,50,25,.12))}.ad-slot{max-width:1056px;margin:0 auto 22px;border:1px dashed #d7c8b5;background:#fffaf1;color:#8a7257;border-radius:8px;min-height:70px;display:grid;place-items:center;font-size:13px;font-weight:720}.section-heading{margin-bottom:14px}.fact-grid,.animal-grid,.step-grid,.guide-grid,.pair-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.guide-grid.compact{grid-template-columns:repeat(2,minmax(0,1fr))}.fact-grid div,.animal-card,.step-grid div,.guide-card,.pair-card{background:#fff;border:1px solid var(--line);border-radius:8px;padding:16px}.animal-card{text-decoration:none;min-height:180px;display:grid;gap:7px;position:relative;grid-template-columns:50px minmax(0,1fr);grid-template-rows:auto auto 1fr;column-gap:16px;row-gap:6px;padding:20px 22px;overflow:hidden;isolation:isolate}.animal-card::after{content:"";position:absolute;right:-42px;bottom:-46px;z-index:0;width:92px;height:92px;border-radius:50%;background:rgba(184,140,74,.08);opacity:.32}.animal-card strong,.animal-card p,.animal-card>span{position:relative;z-index:1}.animal-card strong{grid-column:2;grid-row:1;padding-right:34px;margin-top:1px;color:#12100e;font-size:18px;font-weight:740}.animal-card>span:not(.animal-order):not(.animal-seal){grid-column:2;grid-row:2;color:#4d463f;font-size:14px}.animal-card p{grid-column:2;grid-row:3;margin-top:8px;color:var(--muted)}.animal-seal{position:relative!important;grid-column:1;grid-row:1/3;align-self:start;display:grid;place-items:center;width:50px;height:50px;border-radius:12px;background:#fff2e7;border:1px solid rgba(159,53,40,.24);color:var(--red);font-family:Georgia,serif;font-size:26px;font-weight:850;line-height:1;box-shadow:0 8px 16px rgba(60,40,20,.08)}.animal-order{position:absolute!important;right:18px;top:18px;z-index:2;color:#4f463d;font-size:13px;font-weight:760}.guide-card{text-decoration:none;display:grid;gap:8px;min-height:172px;background:linear-gradient(180deg,#fffefa,#fffaf2)}.guide-card span{font-size:12px;color:var(--jade);font-weight:780;text-transform:uppercase;letter-spacing:.05em}.guide-card strong{font-size:18px;font-weight:740}.guide-card p{margin:0;color:var(--muted)}.guide-filter-nav{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px}.guide-filter-nav button{border:1px solid var(--line);background:#fff;border-radius:999px;min-height:37px;padding:0 14px;font:inherit;font-weight:720;color:#4f463d;cursor:pointer}.guide-filter-nav button.is-active,.guide-filter-nav button:hover{background:#f3ebe0;border-color:#d6b57d;color:#352b22}.section-action{display:flex;justify-content:flex-start;margin-top:16px}.split{display:grid;grid-template-columns:1fr 1fr;gap:22px}.split>div{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:8px;padding:22px}.fact-card{display:grid;gap:8px}.fact-card strong{font-size:20px}.fact-card span{display:block;color:var(--muted)}.table-wrap{overflow:auto}.content-section table{width:100%;border-collapse:collapse;background:#fff;font-size:15px}.content-section th,.content-section td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}.content-section th{background:#f1eadc;color:#352b22}.hanzi{font-family:Georgia,serif;font-size:24px;font-weight:800;color:var(--red)}.article-shell{max-width:1160px;margin:0 auto 22px;padding:0 clamp(18px,4vw,52px);display:grid;grid-template-columns:minmax(0,.96fr) minmax(270px,.44fr);gap:22px;align-items:start}.article-main{min-width:0}.article-sidebar{display:grid;gap:18px;position:sticky;top:92px}.sidebar-card{background:var(--panel);border:1px solid var(--line);box-shadow:var(--shadow);border-radius:8px;padding:18px}.sidebar-card.compact{display:grid;gap:12px}.sidebar-link-list{display:grid;gap:12px}.sidebar-link-list a{text-decoration:none;display:grid;gap:4px;padding-bottom:12px;border-bottom:1px solid #ece2d4}.sidebar-link-list a:last-child{padding-bottom:0;border-bottom:0}.sidebar-link-list strong{font-size:15px}.sidebar-link-list span{font-size:14px;color:var(--muted)}.article-search{display:grid;grid-template-columns:minmax(260px,.9fr) minmax(300px,1.1fr);gap:22px;align-items:end}.article-search h2{margin-bottom:0}.site-search-form{display:grid;grid-template-columns:minmax(220px,1fr) auto;gap:12px;align-items:end}.site-search-form label{display:grid;gap:7px;font-size:14px;font-weight:720}.site-search-form input{height:43px;border:1px solid var(--line);border-radius:8px;padding:0 12px;font:inherit;background:#fff;width:100%;min-width:0}.site-search-form button{min-height:43px;display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:8px;background:var(--jade);color:#fff;font-size:14px;font-weight:780;padding:0 16px;cursor:pointer;white-space:nowrap}.site-search-form button:hover{background:#24594f}.article-body{background:transparent!important;border:0!important;box-shadow:none!important;padding-top:0;padding-bottom:0}.lead-answer{font-size:18px;line-height:1.72;color:#302820}.faq-list h2{margin-bottom:18px}.faq-categories{display:grid;gap:12px}.faq-category{background:#fff;border:1px solid var(--line);border-radius:8px;overflow:hidden}.faq-category summary{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:15px 18px;cursor:pointer;font-weight:780;color:#2f2922;background:#fbf7ef}.faq-category summary small{color:var(--muted);font-size:13px;font-weight:720;white-space:nowrap}.faq-grid{display:grid;gap:12px;border-top:1px solid var(--line);padding:16px 18px 18px;background:#fffdf9}.faq-item{display:grid;grid-template-columns:minmax(260px,.36fr) minmax(0,.64fr);gap:0;overflow:hidden;border:1px solid #e6dac8;border-radius:8px;background:#fff;box-shadow:0 6px 16px rgba(47,37,23,.04)}.faq-item h3{display:flex;align-items:center;margin:0;padding:18px 20px;background:#f5efe5;border-right:1px solid #e2d4c0;font-size:16px;line-height:1.38;color:#211b17}.faq-item p{margin:0;padding:18px 20px;color:var(--muted);max-width:none;border-left:4px solid rgba(40,107,97,.2);background:#fff}.site-footer{display:grid;grid-template-columns:minmax(260px,1.15fr) minmax(420px,.85fr);align-items:start;margin-top:44px;padding:34px clamp(18px,4vw,52px);background:#24201b;color:#fffaf0;gap:28px}.footer-about strong{display:block;font-size:18px;margin-bottom:10px}.footer-about p{margin:0;color:#d7cbbd;line-height:1.72;font-size:14px}.footer-nav{display:grid!important;grid-template-columns:repeat(3,minmax(110px,1fr));gap:24px!important;align-items:start!important}.footer-nav div{display:grid;gap:8px}.footer-nav span{color:#bfae98;font-size:12px;font-weight:780;text-transform:uppercase;letter-spacing:.06em}.footer-nav a{text-decoration:none;font-size:14px;color:#fffaf0}.footer-nav a:hover{text-decoration:underline}.report-hero,.seo-table{background:#fff;border:1px solid var(--line);border-radius:8px;box-shadow:var(--shadow)}.report-hero{padding:22px}.report-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:16px}.report-summary div{background:#fbf7ef;border:1px solid var(--line);border-radius:8px;padding:12px}.report-summary strong{display:block;font-size:24px}.report-summary span{color:var(--muted)}body:not(.page-home):not(.page-guides):not(.seo-report-page) .tool-page,body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-body,body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-search,body:not(.page-home):not(.page-guides):not(.seo-report-page) .content-section{max-width:980px;margin-left:auto;margin-right:auto}@media(max-width:980px){.pair-grid,.guide-grid,.fact-grid,.animal-grid,.step-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.article-shell{grid-template-columns:1fr}.article-sidebar{position:static}}@media(max-width:820px){body{font-size:15px}.site-header{align-items:flex-start;flex-direction:column}.nav{justify-content:flex-start;gap:14px}.nav a{font-size:14px}.hero-grid,.split{grid-template-columns:1fr}.tool-page{max-width:100%;padding:0 16px}.tool-page .tool-panel{max-width:100%;padding:18px}.calculator-form,.match-form,.site-search-form,.article-search{grid-template-columns:1fr}.fact-grid,.animal-grid,.step-grid,.guide-grid,.guide-grid.compact,.report-summary{grid-template-columns:1fr}.page-hero{padding-top:24px}.page-hero h1{font-size:31px}.intro{font-size:16px}.faq-category summary{align-items:flex-start;flex-direction:column;gap:4px}.faq-grid{padding:12px}.faq-item{grid-template-columns:1fr}.faq-item h3{border-right:0;border-bottom:1px solid #e2d4c0}.faq-item p{border-left:0;border-top:4px solid rgba(40,107,97,.16)}.site-footer{grid-template-columns:1fr}.footer-nav{grid-template-columns:1fr 1fr!important}}`;
}

function themeCss() {
  return `
html,body{overflow-x:hidden}
body{background:#ece5d6}
body::before{content:"\\767E\\5BB6\\59D3";position:fixed;right:-34px;top:92px;z-index:-1;color:rgba(228,211,174,.1);font-family:Georgia,serif;font-size:clamp(72px,11vw,146px);font-weight:900;line-height:1.04;writing-mode:vertical-rl;letter-spacing:.16em;pointer-events:none}
.site-header{background:rgba(30,33,31,.94);border-bottom-color:rgba(214,190,148,.22);box-shadow:0 12px 32px rgba(12,16,14,.22)}
.brand{color:#fff8ec}.nav a{color:#e5d8c2}.nav a:hover{color:#d9a04f}
.page-home .page-hero{display:none}.page-home main{padding-top:0}
.surname-hero{position:relative;display:grid;grid-template-columns:minmax(0,.92fr) minmax(360px,1.08fr);gap:58px;align-items:center;min-height:680px;padding:62px clamp(24px,7vw,96px) 76px;color:#fff8ec;overflow:hidden;background:linear-gradient(135deg,#1e211f 0%,#252721 58%,#3a2a20 100%)}
.surname-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 16% 18%,rgba(217,160,79,.22),transparent 28%),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(0deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:auto,44px 44px,44px 44px;pointer-events:none}
.surname-hero-copy{position:relative;z-index:1;max-width:680px}
.surname-hero-copy h2{margin:16px 0 16px;color:#fff8ec;font-family:Georgia,serif;font-size:clamp(42px,4.6vw,66px);line-height:1.04;letter-spacing:0}
.surname-hero-copy>p{max-width:620px;margin:0;color:#dfd1bd;font-size:18px;line-height:1.72}
.surname-hero .eyebrow{background:rgba(228,211,174,.1);border-color:rgba(228,211,174,.3);color:#d9b46f}
.surname-lookup-strip{display:grid;grid-template-columns:minmax(200px,1fr) minmax(180px,.62fr) auto;gap:10px;margin-top:28px;max-width:720px;padding:12px;border:1px solid rgba(228,211,174,.22);border-radius:8px;background:rgba(255,248,236,.08);backdrop-filter:blur(10px)}
.surname-lookup-strip label{display:grid;gap:6px;color:#eadfcf;font-size:13px;font-weight:720}
.surname-lookup-strip input,.surname-lookup-strip select{height:42px;width:100%;min-width:0;border:1px solid rgba(228,211,174,.26);border-radius:6px;background:#fffaf1;color:#211d18;padding:0 11px;font:inherit}
.surname-lookup-strip button{align-self:end;min-height:42px;border:0;border-radius:6px;background:#9a3b28;color:#fff8ec;font-weight:820;padding:0 18px;cursor:pointer}
.surname-hero .result-card{background:#fffaf1;color:#211d18;border-left-color:#d9a04f;max-width:720px}
.surname-photo-card{position:relative;z-index:1;margin:0;min-height:470px;border:1px solid rgba(214,190,148,.36);border-radius:10px;overflow:hidden;background:#161611;box-shadow:0 38px 90px rgba(0,0,0,.28)}
.surname-photo-card img{display:block;width:100%;height:100%;min-height:470px;object-fit:cover}
.surname-photo-card::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 46%,rgba(0,0,0,.48));pointer-events:none}
.surname-photo-card figcaption{position:absolute;right:22px;bottom:22px;z-index:1;display:grid;gap:4px;padding:15px 18px;border-radius:8px;background:rgba(140,38,31,.92);color:#fff8ec;box-shadow:0 18px 38px rgba(0,0,0,.24)}
.surname-photo-card strong{font-family:Georgia,serif;font-size:25px}.surname-photo-card small{color:#eed7c8}
.surname-stats{position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;max-width:1160px;margin:-42px auto 34px;padding:0 clamp(18px,4vw,52px)}
.surname-stats div{display:grid;gap:5px;min-height:90px;padding:18px;border:1px solid rgba(207,190,143,.58);border-radius:8px;background:rgba(255,253,247,.96);box-shadow:0 14px 32px rgba(31,29,24,.1)}
.surname-stats strong{font-family:Georgia,serif;font-size:22px;color:#1e211f}.surname-stats span{color:#62594e;font-size:14px}
.surname-section{max-width:1160px;margin:0 auto 34px;padding:34px clamp(18px,4vw,52px);background:rgba(255,253,247,.92);border:1px solid rgba(207,190,143,.58);border-radius:8px;box-shadow:0 16px 40px rgba(31,29,24,.08)}
.surname-section .animal-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;background:#d4c6af;border:1px solid #d4c6af}
.surname-section .animal-card{min-height:210px;border:0;border-radius:0;background:#fffdf8;box-shadow:none;grid-template-columns:1fr;grid-template-rows:auto auto auto 1fr;padding:22px 18px;text-align:center}
.surname-section .animal-seal{grid-column:auto;grid-row:auto;margin:0 auto 10px;width:auto;height:auto;border:0;background:transparent;color:#1e211f;box-shadow:none;font-size:52px}
.surname-section .animal-card strong,.surname-section .animal-card>span:not(.animal-order):not(.animal-seal),.surname-section .animal-card p{grid-column:auto;grid-row:auto;padding:0}
.surname-section .animal-order{right:10px;top:8px;color:#b8aa90}.surname-section .animal-card p{font-size:14px;line-height:1.5}
.origin-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.origin-grid a{display:grid;grid-template-rows:auto auto auto 1fr;gap:10px;min-height:260px;padding:14px;border:1px solid #d4c6af;border-radius:8px;background:#1e211f;color:#fff8ec;text-decoration:none;overflow:hidden}
.origin-grid img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:6px;border:1px solid rgba(255,248,236,.12)}
.origin-grid span{color:#d9a04f;font-weight:900;letter-spacing:.1em}.origin-grid strong{font-family:Georgia,serif;font-size:24px}.origin-grid p{margin:0;color:#dacdb7;font-size:14px}
.guide-card{background:linear-gradient(180deg,#fffdf8,#f2eadb)}.guide-card span{color:#7d251f}.content-section th{background:#ded2bd}.site-footer{background:#1f211f}
body:not(.page-home):not(.page-guides):not(.seo-report-page){background:#ece5d6}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .page-hero{max-width:1180px;padding-top:42px;padding-bottom:24px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .page-hero h1{color:#1e211f;text-shadow:none}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .page-hero .intro{max-width:820px;color:#5b5145;font-size:17px;line-height:1.68}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .page-hero .eyebrow{background:rgba(125,37,31,.08);border-color:rgba(125,37,31,.18);color:#7d251f}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-shell{max-width:1180px;gap:34px;margin-bottom:38px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main{display:grid;gap:24px;min-width:0}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main>.content-section{width:100%;max-width:none!important;margin:0!important;padding:28px 32px!important;border-radius:10px;background:rgba(255,253,247,.96)!important;border:1px solid rgba(207,190,143,.68)!important;box-shadow:0 16px 38px rgba(31,29,24,.08)!important}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main>.article-body{background:#fffdf8!important}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-body p{max-width:none;margin:0 0 15px;color:#3d342b}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-body p:last-child{margin-bottom:0}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .lead-answer{font-size:17px;line-height:1.78;color:#2b251f}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main>.split{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;gap:18px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .split>div,body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-card{background:#fffdf8;border-color:rgba(207,190,143,.68);color:#2b251f;box-shadow:0 14px 32px rgba(31,29,24,.08)}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .split>div{padding:24px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .fact-card span,body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-link-list span{color:#62594e}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-search{align-items:center}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-search h2{color:#241f1a}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-sidebar{gap:22px;top:104px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-card{padding:22px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-card h2{margin:8px 0 16px;color:#241f1a;font-size:23px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-link-list{gap:14px}
body:not(.page-home):not(.page-guides):not(.seo-report-page) .sidebar-link-list a{padding:0 0 14px;border-bottom-color:#e6dac8}
@media(max-width:980px){.surname-hero{grid-template-columns:1fr;min-height:auto;padding:48px 22px 70px}.surname-photo-card,.surname-photo-card img{min-height:380px}.surname-stats,.origin-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.surname-section .animal-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.surname-hero-copy h2{font-size:40px}.surname-lookup-strip{grid-template-columns:1fr}.surname-stats,.origin-grid,.surname-section .animal-grid{grid-template-columns:1fr}.surname-photo-card,.surname-photo-card img{min-height:300px}.surname-photo-card figcaption{right:14px;bottom:14px}body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-main>.content-section{padding:20px!important}body:not(.page-home):not(.page-guides):not(.seo-report-page) .article-shell{gap:22px}}
`;
}
