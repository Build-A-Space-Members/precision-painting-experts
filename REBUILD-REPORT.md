# Precision Paint Experts — rebuild report

**Scope:** rebuild https://precisionpaintexperts.com as an SEO-first Node.js site. It keeps every URL and all of the
business's content and facts. Its look and feel (layout, typography, components) comes from
https://spraytexpainting.com, with all Spray Tex branding replaced by Precision Paint Experts' logo, contact details,
and North Central Florida locations.
**Date:** 2026-10-08 · **Branch:** `claude/upbeat-wozniak-2pbgfn`

Each item below is marked as **verified** (checked directly), an **assumption** (a judgment call), or
**unfinished** (needs action).

---

## 0. What I could access

| Item | Result |
|---|---|
| precisionpaintexperts.com | **Verified.** Fully crawled after network access was granted. 409 unique URLs in `/sitemap.xml` (referenced from `robots.txt`); all returned 200. |
| spraytexpainting.com | **Verified.** Rendered in Chromium on desktop and mobile: the homepage, `/residential-exterior-painting`, and `/texas/plano`. I took computed styles and screenshots. |
| Original quote/contact form | **Verified as broken on the live site.** It is a client-side Supabase component that renders an empty box ("Tell us about your project" with no fields). The rebuild replaces it with a first-party form (see §6). |
| www.precisionpaintexperts.com | Not reachable from this environment (proxy policy). I could not verify how the original handles `www`. |

## 1. Original → rebuilt URL mapping

Every original path is kept at the same location, with no trailing slash, as on the original. The full table of
409 rows is in **[docs/url-map.md](docs/url-map.md)**.

| Page group | Count | Status in rebuild |
|---|---|---|
| Core pages (home, services, specialty, FAQ, gallery, service areas, quote, about, contact, privacy, terms, blog, estimate results) | 13 | Indexable |
| Service pages (`/interior-painting`, `/garage-floor-epoxy-coating`, …) | 33 | Indexable |
| County hubs (`/locations/<county>`) | 5 | Indexable |
| City hubs (`/locations/<county>/<city>`) | 15 | Indexable |
| City × service pages (`/<city>-fl-<service>`, plus 2 extra Dunnellon pages) | 152 | Indexable |
| Blog articles | 27 | Indexable. Original dates, categories, and tags are kept. |
| "Compare painters" pages (`/florida-painters-*`) | 37 | Indexable |
| Tag / category archives (`/tag/*`, `/category/*`) | 127 | Live, but `noindex, follow` and left out of the sitemap. They are thin listing pages; 34 of them had no posts attached at all. |
| **Total** | **409** | 282 in the sitemap |

Redirects (301):
- `/services/<slug>` → `/<slug>`, which is the original site's own behavior.
- `/locations/<city>` → `/locations/<county>/<city>`. The original's structured data pointed at these URLs, but they returned 404.
- Trailing-slash URLs → the same URL without the slash.
- `.html` URLs → the clean URL.
- `www` → the apex domain (on Vercel, or with `CANONICAL_HOST` set on the Node server).

On the original, `/paint-trim-shutters` linked to `/tag/door-shutter-painting`, which returns 404. The rebuild drops
that link.

## 2. Page-level keyword map

The full table, with primary keyword, secondary keywords, and the questions each page answers for all 282 indexable
pages, is in **[docs/keyword-map.md](docs/keyword-map.md)**.

- Every indexable page has **one distinct primary keyword**; the script confirms there are no duplicates. Page types
  are split by intent so they don't compete with each other:
  - Main service pages target "*service* North Central Florida / Gainesville & Ocala".
  - City × service pages target "*service* *City* FL".
  - City hubs target "painter / painting contractor *City* FL".
  - `-painting-services` pages target "painting services *City* FL", an overview of all services.
  - Blog posts target informational queries.
  - Compare pages target "*competitor* vs / alternative".
- **These are proposed targets, not measured data.** No search volumes, rankings, or tool data were gathered. Validate
  them in Google Search Console after launch.

## 3. Design and asset inventory

**Design taken from spraytexpainting.com (verified with computed styles and screenshots)**
- **Typography:** Montserrat throughout. Hero H1 800 weight, uppercase on the homepage. H2 700 at about 36px. Body
  16/24.
- **Header:** transparent over the hero, logo on the left. On the right, a top row with a phone button and a Free
  Estimate button, and below it an uppercase nav with dropdowns. The header turns solid navy and sticks once you
  scroll. On mobile: logo, phone icon, and a hamburger menu.
- **Homepage, top to bottom:**
  - Full-bleed photo hero with a deep-blue gradient overlay, a kicker line, the uppercase H1, intro text, CTA and
    "Learn more →", then dark trust cards and a light-blue badge bar.
  - "Offering an extensive range…" grid of 3-column image-topped service cards with full-width blue "LEARN MORE
    ABOUT …" buttons.
  - Brown photo band, "A painting company that exceeds expectations", with a CTA and a 2×2 feature grid.
  - "How much will it cost to paint my house?" blue photo band.
  - Color-consultation dark band with three round icons.
  - Location cards.
  - Warranty block with a shield graphic.
  - Gray CTA band.
  - Card-style footer link columns.
- **Inner pages:** photo hero with the H1 on the left. The first two sections alternate text and photo, then the page
  runs as one column with a sticky sidebar CTA, followed by FAQ, related links, warranty, and CTA. Location pages get
  a "Contact information" box, as on the Plano page.
- **Colors:**

  | Role | Value | Source |
  |---|---|---|
  | Primary blue | `#003082` | Spray Tex |
  | Text | `#1f2937` | Spray Tex |
  | Card gray | `#f3f4f6` | Spray Tex |
  | Navy | `#0f1f38` | Precision brand |
  | CTA accent | `#f08a33` | Precision brand |

  **Assumption:** the CTA color uses Precision's orange instead of Spray Tex's red so it matches Precision's logo. It
  is one CSS variable (`--accent` in `public/css/site.css`) if you'd rather use red.

**Precision Paint Experts brand assets**
- **Logo:** the original site has no logo image, only a "P" badge plus the wordmark. I recreated it as an inline SVG
  (orange badge, navy "P") with "PRECISION PAINT / EXPERTS" set in the Spray Tex wordmark style. The favicon set
  (SVG, 32px, 180px, 512px) is generated from the same mark; the original site had no favicon.
- **Photos:** the original site has only 4 images. All four are reused, renamed descriptively, and given written
  alt text:
  - `florida-home-exterior-painting`
  - `stucco-wall-paint-roller`
  - `cabinet-refinishing-painter`
  - `commercial-storefront-painting`

  Each has WebP and JPEG versions at 480, 800, 1280 and 1920px, served with `srcset`, explicit width and height, and
  lazy loading below the fold.
- **Not reused from Spray Tex:** none of its photos, logos, review badges, testimonials, financing, YouTube, or
  awards.
  - Its Google review cards and BBB/HomeAdvisor badges became Precision's own verified trust points: 15+ years,
    licensed and insured, written warranty, own crews, Sherwin-Williams and Benjamin Moore, low-VOC.
  - Its testimonial wall was left out because Precision has published no reviews and none were invented.
- **Missing assets (unfinished):** there are no real project photos. The same 4 images repeat across 400+ pages, and
  the gallery has only 4 items. Adding 15–30 real job photos is the biggest visual improvement still available.

Side-by-side screenshots are in `docs/screenshots/`:
- `home-desktop-compare.jpg`
- `home-mobile-compare.jpg`
- `service-page-compare.jpg`
- `location-page-compare.jpg`

## 4. Content uniqueness review

**Method:** `scripts/similarity.js` (run with `npm run check:similarity`).
1. For each page it takes the main body only: hero intro, section headings, paragraphs, bullets, and FAQs. Header,
   nav, footer, sidebars, and CTA bands are excluded.
2. The text is lowercased, HTML and punctuation are removed, and it is split into overlapping **5-word shingles**.
3. It computes two numbers per page:
   - **Unique share:** the percentage of the page's shingles that appear on *no other page on the site*. Target
     ≥ 80%.
   - **Max pairwise Jaccard:** the highest similarity to any single other page.
4. With `--source`, it also compares each page to the original site's text.

This is an editorial measure, not a search-engine metric.

**Results** (final run, 282 indexable pages):

| Type | Pages | Min unique | Avg unique |
|---|---|---|---|
| City × service | 152 | 80.0% | 88.5% |
| Compare | 37 | 81.9% | 89.3% |
| Core | 13 | 82.1% | 91.4% |
| City hubs | 15 | 84.0% | 90.3% |
| Services | 33 | 86.2% | 93.8% |
| Counties | 5 | 86.9% | 88.5% |
| Blog posts | 27 | 92.2% | 95.9% |
| **All** | **282** | **80.0%** | **90.1%** |

- **All 282 pages meet the 80% target.** The highest similarity between any two pages is 5.1%
  (`/get-a-free-quote` ↔ `/estimate-results`).
- Overlap with the original site's wording averages 0.5% (maximum 7.9%), so the copy is rewritten, not copied.
- **How it got there:** after the first draft, 74 pages fell below 80%. The cause was verified facts (warranty,
  insurance, job durations) phrased identically on dozens of pages. Those sentences were reworded per page, keeping
  every number. The lowest pages are now just above the line: `/lake-city-fl-pressure-washing` is at 80.0%.
- Remaining shared wording is standard factual phrasing, such as county lists and product names.

## 5. SEO implementation and validation

`npm test` builds the site, then runs `scripts/seo-check.js` and the uniqueness review. The final run reported **no
errors**.

Verified across all 409 built pages:
- **Titles:** unique and 30–60 characters on indexable pages. Archive pages are labelled "(Tag)" or "(Category)".
- **Meta descriptions:** unique and 120–158 characters.
- **H1:** exactly one per page, with a logical H2/H3 order.
- **Canonical:** an absolute `https://precisionpaintexperts.com/<path>` URL on every page.
- **Robots:** `index, follow, max-image-preview:large`. Archives and the 404 page are `noindex, follow`.
- **Social metadata:** Open Graph and Twitter card tags on every page.
- **Structured data (JSON-LD, all valid):** every indexable page carries one `@graph` with:
  - `PaintingContractor`: name, phone, email, Newberry FL 32669 locality (no street address, since none is
    published), the five counties served, and hours.
  - `WebSite`, `WebPage`, and `BreadcrumbList`.
  - Per page type, where applicable:
    - `Service` on service, city, and city-service pages, with `areaServed` set to a City or AdministrativeArea and
      geo coordinates on city hubs.
    - `BlogPosting` on articles.
    - `FAQPage` where the page shows FAQs.
    - `AboutPage` and `ContactPage`.
  - There are **no ratings, reviews, or aggregateRating anywhere.**
- **Internal links:** zero broken. Zero orphans: every indexable page has at least 3 other pages linking to it.
  - Breadcrumbs on every inner page.
  - Each service page links to its 15 city versions.
  - Each city hub links to its 10 service pages and its neighboring towns.
  - Posts link to their services and cities.
  - Compare pages link to each other and from the About page.
- **Sitemap and robots:** `sitemap.xml` lists exactly the 282 indexable canonical URLs, with article dates as
  `lastmod`. `robots.txt` allows everything except `/api/` and points to the sitemap.
- **Staging controls:**
  - `npm run build:staging` adds `noindex` to every page and makes `robots.txt` disallow everything.
  - The server adds `X-Robots-Tag: noindex` when `SITE_ENV=staging`.
  - On Vercel, `*.vercel.app` hosts always get `X-Robots-Tag: noindex`.
  - The production build is verified to be indexable.
- **Status codes:** real 404 status with a helpful 404 page. Legacy URLs redirect with 301.
- **HTTPS and hostname:** handled by Vercel, or by setting `CANONICAL_HOST` on the Node server (forces HTTPS and the
  apex domain, and adds HSTS).
- **Performance:** measured in local Chromium with no throttling, so treat these as indicative, not field data.

  | Page | LCP | CLS | Transfer size |
  |---|---|---|---|
  | Homepage, mobile | 0.47 s | 0.058 | 150 KB |
  | Homepage, desktop | — | — | 519 KB |
  | Service page | ~0.4 s | ≤ 0.01 | 95–162 KB |

  - The hero image is preloaded with `fetchpriority=high`.
  - CSS and JS are fingerprinted and cached for a year.
  - About 6 KB of JS in total; all content is server-rendered HTML.
- **Accessibility:**
  - Skip link, landmarks (`header`, `nav`, `main`, `footer`), and visible focus rings.
  - Every form field has a `<label>`. Icon buttons have `aria-label`. The mobile menu toggle sets `aria-expanded`
    and closes with Escape.
  - FAQs use native `<details>`. Decorative images have empty alt text.
  - No horizontal scroll at 390px. Checked on home, service, city, post, and quote pages.

## 6. Functionality

- **Estimate form** (on `/get-a-free-quote` and `/contact-us`):
  - Fields: name, phone, email, city, service, details, plus a honeypot spam trap.
  - Validated in the browser and again on the server, with a per-IP rate limit on the Node server.
  - Posts to `/api/estimate`. The Express route and the Vercel function share `src/lib/estimate.js`.
  - Works without JavaScript too: the server answers with a 303 redirect.
  - Valid requests are delivered to **`FORM_WEBHOOK_URL`** as JSON. **Verified end to end** with a local webhook
    receiver.
  - **If `FORM_WEBHOOK_URL` is not set, the form does not pretend to send.** It tells the visitor to call
    (386) 854-7139.
- **AI-agent readiness (WebMCP):** `public/js/agent-tools.js` registers six read-only tools in browsers that support
  WebMCP:
  - `search_services`, `get_service_details`, `check_service_area` (city, county, or ZIP), `search_articles`,
    `get_contact_options`, and `open_page`.
  - `open_page` only opens pages on this site.
  - They read `dist/agent/catalog.<hash>.json`, which is built from the same content as the pages.
  - The estimate form is also a declarative tool (`request_estimate`). An agent can fill it in, but the visitor
    presses Send themselves.

  `npm run test:webmcp` ran 29 checks; **all passed**. WebMCP is still an early Chrome preview, so the practical
  benefit today is mostly the accessibility work.

## 7. Unresolved issues and things that need you

1. **Vercel deployment (unfinished).** `vercel.json` and `api/estimate.js` are ready, but the Vercel project could not
   be created. The Vercel GitHub app is not installed on `Build-A-Space-Members/precision-painting-experts`, and no
   Vercel CLI login exists in this environment. Install the app at https://github.com/apps/vercel/installations/new
   and the project can then be created, deployed, and given the domain.
2. **DNS.** After the domain is added in Vercel, point `@` and `www` at the records Vercel shows: typically an A record
   for the apex and a CNAME to a `vercel-dns.com` host for `www`. **This replaces the current live site.**
3. **`FORM_WEBHOOK_URL` (credential needed).** Create a Zapier or Make webhook (or a CRM or email endpoint) and set it
   in Vercel's environment variables. Until then the form tells visitors to call.
4. **Real project photos (unfinished).** See §3.
5. **Facts to confirm with the client.** These are on the live site's own pages and were kept, but they are not in
   the core fact list:
   - Cabinet doors are sprayed in a dust-free booth.
   - Soft-close hinges on request.
   - Eco-safe detergents and runoff control for washing.
   - Typical office work hours of 6 PM to 6 AM.
   - Kitchen out of service about 4–6 working days for cabinets.
   - Progress photos for HOA boards.
   - Two-day epoxy installs.
6. **Legal pages.** The Privacy Policy and Terms were rewritten in plain English (effective October 8, 2026). They are
   not legal advice; have them reviewed.
7. **Compare pages.** These 37 pages name other local companies. They were rewritten to state nothing about those
   companies beyond their names. Decide whether to keep them indexable; some businesses object to name-targeted
   pages.
8. **After launch.** Submit `sitemap.xml` in Google Search Console, check the Coverage report for the 127 noindexed
   archives, and confirm the Google Business Profile matches the site: Precision Paint Experts, (386) 854-7139,
   Newberry, FL.
