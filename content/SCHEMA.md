# Page content files

Every indexable page has one JSON file in `content/pages/`. The file name is the URL path without the
leading slash, with `/` replaced by `_` (the homepage is `index.json`). `npm run build` renders each file
into the Spray-Tex-style layout in `src/templates/`.

```jsonc
{
  "path": "/interior-painting",            // exact URL path, no trailing slash
  "type": "service",                       // core | service | county | city | cityService | post | compare
  "title": "Interior Painting in Gainesville & Ocala, FL",   // <title>, 30–60 chars, unique
  "description": "…",                      // meta description, 120–158 chars, unique
  "h1": "…",                               // one H1, can differ from title
  "heroIntro": "…",                        // 1–2 plain-text sentences under the H1
  "navLabel": "Interior Painting",         // service pages only: short label for menus and cards
  "card": "…",                             // service pages only: card blurb, max 120 chars
  "keywords": {
    "primary": "interior painting gainesville fl",
    "secondary": ["…", "…"],               // 3–6 natural variations
    "questions": ["…", "…"]                // 2–4 searcher questions the page answers
  },
  "sections": [
    {
      "h2": "…",
      "body": ["paragraph html", "…"],     // each item is one paragraph; inline <strong>, <em>, <a href="/…"> only
      "bullets": ["…"]                     // optional list rendered after the paragraphs
    }
  ],
  "faqs": [{ "q": "…", "a": "…" }],        // 3–5, rendered as an accordion + FAQPage JSON-LD
  "related": ["/exterior-painting", "…"]   // 3–6 internal paths from content/PATHS.txt
}
```

Blog posts take their date, category, and tags from `src/data/posts-meta.json`. Tag and category archive
pages are generated automatically: they are `noindex, follow` and left out of the sitemap.

## Rules

- Use only facts listed in `content/FACTS.md`. Do not invent reviews, ratings, project counts, prices,
  awards, staff names, or history.
- Write all copy fresh. Do not reuse paragraphs or recurring stock sentences across pages.
- Internal links must point to paths listed in `content/PATHS.txt`.
