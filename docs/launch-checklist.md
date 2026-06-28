# Chinese Surname Guide Launch Checklist

## 1. Local Build

```bash
npm run build
npm run audit
npm run test:tools
```

Required result:

- Build exits with code 0.
- Audit reports no missing internal links.
- Tool tests pass.
- `/admin/seo-report/` shows `Fix = 0`.

## 2. Core Page Tests

| Page | Test |
|---|---|
| `/` | Home loads and lookup tool renders |
| `/surname-lookup/` | Search Li, Wong, Chen |
| `/common-chinese-surnames/` | Table renders |
| `/chinese-surname-meaning/` | Meaning guide renders |
| `/chinese-surname-origin/` | Origin guide renders |
| `/hundred-family-surnames/` | Baijiaxing guide renders |
| `/guides/` | Search and filters work |

## 3. Indexing Checks

- Sitemap exists at `/sitemap.xml`.
- Robots exists at `/robots.txt`.
- `llms.txt` exists at `/llms.txt`.
- Important pages are linked internally.

## 4. GSC / GA

- Put the new Google verification HTML file in `public/`.
- Set `GA_MEASUREMENT_ID=G-XXXXXXXXXX` in Cloudflare Pages environment variables.
- Rebuild and redeploy.

## 5. Security Checks

```bash
rg -n "api_key|apikey|secret|token|password|stripe|paypal|dataforseo|openai|ahrefs|semrush|GA_MEASUREMENT_ID" .
```

No secrets should be committed.
