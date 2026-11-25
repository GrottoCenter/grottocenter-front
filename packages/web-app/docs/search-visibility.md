# Search visibility

**The SPA is permanently `noindex` and `Disallow: /` (bar a few allowed hub
prefixes, see below).** Search visibility does
not come from this app. It comes from static HTML pages that the API generates
nightly from a SQL view enforcing every disclosure rule, and uploads to static
hosting. Tracking issue:
[GrottoCenter/grottocenter-api#1889](https://github.com/GrottoCenter/grottocenter-api/issues/1889).

The two files that keep the SPA out of search indexes are:

- `packages/web-app/index.html`: `<meta name="robots" content="noindex, nofollow" />`
- `packages/web-app/public/robots.txt`: `User-agent: *` / `Disallow: /`

`robots.txt` prevents crawling; the meta is a fallback for clients that fetch the
HTML anyway. The two do not stack: a compliant crawler blocked by `Disallow: /`
never downloads `index.html`, so it never sees the meta. Neither alone guarantees
a URL is never listed, since a disallowed URL can still appear without a snippet
when external sites link to it. Keep both; don't remove one as redundant.

If you were asked to "add SEO to the front-end", read the rest of this page
first. An earlier plan put the work in this repo and lost. Each rejected idea
sounds reasonable on its own, so the reasoning is recorded here.

## Rejected options

### Per-route `react-helmet` tags and SPA-computed robots directives

- **What it was:** a `react-helmet`-style `<head>` per route, with robots
  directives computed in React from an environment flag plus an activation date.
- **Why it fails:** only crawlers that execute JavaScript see the tags, and a
  directive that is absent from the served HTML is not enforced.
- **Instead:** statically generated pages
  ([grottocenter-api#1766](https://github.com/GrottoCenter/grottocenter-api/issues/1766)).

### Age and sensitivity checks in the browser

- **What it was:** deciding in React whether an entity may be exposed.
- **Why it fails:** client-side gates are advisory. Anyone can read the API calls
  from the bundle and skip the gate.
- **Instead:** the gates live in the `v_bot_page` SQL view
  ([grottocenter-api#1759](https://github.com/GrottoCenter/grottocenter-api/issues/1759)).

### `data-nosnippet` on sensitive fields

- **What it was:** wrapping sensitive values in `data-nosnippet` elements.
- **Why it fails:** it is Google-only, it suppresses snippets rather than
  indexing, and it is inert while the SPA is `Disallow`ed.
- **Instead:** sensitive fields are absent from the bot projection
  ([grottocenter-api#1765](https://github.com/GrottoCenter/grottocenter-api/issues/1765)).

### A build-time `robots.txt` or meta swap driven by a workflow variable

- **What it was:** a CI variable that swaps `public/robots.txt` or the robots
  meta when building for production.
- **Why it fails:** `build_and_deploy_job` in
  `.github/workflows/azure-static-web-apps-orange-rock-0d4f87503.yml` builds
  production and PR previews alike, so a build-time switch would make previews
  crawlable too.
- **Instead:** tracked static files (`index.html`, `public/robots.txt`) with a CI
  guard ([#1500](https://github.com/GrottoCenter/grottocenter-front/issues/1500)).

### An environment flag and an activation date

- **What it was:** robots behaviour driven by both an environment flag and a
  date after which indexing turns on.
- **Why it fails:** two switches give four states, and three of them are
  unintended.
- **Instead:** a single source of truth, the tracked files above.

### Recognising crawlers by their `User-Agent`

- **What it was:** detecting crawlers from the `User-Agent` header and serving
  them different HTML.
- **Why it fails:** the header is trivially forged, so anyone could claim to be a
  crawler and receive the crawler variant.
- **Instead:** Cloudflare's IP-verified bot list, serving only a faithful subset
  of what humans see
  ([grottocenter-api#1933](https://github.com/GrottoCenter/grottocenter-api/issues/1933)).

### Making the SPA itself the indexed page

- **What it was:** removing `noindex` and `Disallow` so crawlers index the SPA.
- **Why it fails:** crawlers index whatever the SPA renders to an anonymous
  visitor, and public endpoints return the coordinates of non-sensitive
  entrances. What stays hidden would then depend on discipline in every
  front-end change.
- **Instead:** generated pages built from a whitelist, given only to verified
  crawlers at the same address. There is no separate crawler `robots.txt`: the
  tracked `public/robots.txt` is the only one, and it is the same for everyone and
  every preview. It stays `Disallow: /` except for the few hub prefixes the
  generated pages are served at
  ([#1500](https://github.com/GrottoCenter/grottocenter-front/issues/1500)). Other
  clients get the `noindex` shell at those addresses, so don't widen the
  allow-list to make the SPA crawlable.

### Serving the bot pages live from the Sails API

- **What it was:** rendering the crawler pages on request in the API.
- **Why it fails:** about 500k crawler requests would land on one shared B2
  worker and a Burstable database, which would need rate limits, concurrency
  caps and capacity work. A CDN does not help, because each page is fetched
  about once.
- **Instead:** static files on static hosting
  ([grottocenter-api#1889](https://github.com/GrottoCenter/grottocenter-api/issues/1889)).

## Build facts

Assumptions from the Create React App era keep resurfacing, so:

- The build is **Vite 8**. `process.env.REACT_APP_*` does not exist in the
  bundle.
- Client variables are `VITE_`-prefixed and read through `import.meta.env`, for
  example `VITE_TURNSTILE_SITE_KEY` in `src/components/appli/SignUp.jsx`.
- Output goes to `packages/web-app/dist`. The gitignored `packages/web-app/build/`
  is a leftover from Create React App.
- Vite substitutes `%VITE_*%` tokens in `index.html` natively, but none is used.
