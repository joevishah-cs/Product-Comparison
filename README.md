# Daikin Competitive Marketing Intelligence

A sales-enablement and competitive-intelligence workspace for Daikin. It imports three
supplied source documents — two specification sources and a customer-review export —
normalizes them with full provenance, and turns a product selection into a source-backed
comparison, review intelligence, and a homeowner-ready report.

The workflow the application is built around:

**Log in → search products → select 2–8 → choose a unit size where the source supports it
→ compare → read the verified Daikin edges and the improvement gaps → explain them
visually → generate a cited sales message → save the comparison.**

The comparison page now carries two clearly separated perspectives, toggled at the top:

- **Internal Technical View** — the analytical dashboard: positioning summary, scorecards,
  technical charts, **User Review Intelligence**, review analytical charts, the detailed
  feature table and marketing takeaways, in that order.
- **Homeowner View** — a warm, plain-language report built from the same selection:
  personalized cover → recommendation → priority fit → simple comparison → comfort
  benefits → what homeowners are saying → efficiency / quiet / warranty / smart-feature
  charts → important differences → FAQ → plain-English summary → final recommendation.
  It supports priority chips, per-section representative controls, **Present to
  Homeowner** (full-screen, one section at a time, tablet-friendly), print/PDF export,
  an email-ready version, and a **read-only share link** (`/report?...`) that renders
  without sign-in and contains no internal analysis.

---

## Running it

Node 22 is vendored into `.toolchain/` so the app runs without a system Node install.

```bash
export PATH="$PWD/.toolchain/node/bin:$PATH" && npm install && npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on port 5173 |
| `npm run build` | Type-check then produce a production build in `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | Strict TypeScript check, no emit |

### Demo credentials

```
demo@daikin.com
DaikinDemo2026!
```

The **Use competition demo** button on the sign-in page fills these in.

---

## Data: where every number comes from

28 products are imported from two documents, and nothing else is treated as evidence
anywhere in the application.

| Source | Products | Scope |
| --- | --- | --- |
| `Daikin FIT Battlecard.pdf` (page 1) | 22 | R-32 inverter ducted split heat pumps — 3 Daikin FIT models vs. 19 competitor models, 40 attributes |
| `Competitor comparison.xlsx` (sheet `Comparison`) | 6 | Air-to-water (hydronic) heat pumps — Daikin UPRA043DAVK vs. 5 competitor brands, 26 attributes |
| `DaikinFitReviews.xlsx` (sheet `Review Data`) | 1,682 reviews | Approved customer reviews for 9 Daikin FIT product IDs, Aug 2019 – Jun 2026 |

### Customer reviews

`source-documents/generate-review-records.py` regenerates `public/data/reviews.json`
(~1 MB, fetched lazily — never bundled). Rules:

- Review titles and text are **verbatim** — never rewritten, merged or summarized.
- Sentiment derives from the star rating the customer gave (4–5★ positive, 3★ neutral,
  1–2★ negative), not from wording.
- Themes and feedback subjects (equipment / installation / dealer / service / delivery)
  are deterministic keyword detection, labelled as detection metadata, and installation
  or contractor complaints are never attributed to the equipment.
- Comparison contexts match **exact-model only** (DH6VS 321, DH7VS 115, DH9VS 9) —
  sibling FIT models are never mixed into a compared product's figures. The match
  level is displayed everywhere a review figure appears; the export records no
  unit/tonnage, so exact-unit matching honestly reports as model-level. Competitors
  have no reviews in the source and show “No approved user-review data available”.
  Family-level browsing of the full export lives on the Reviews page.
- Sample size gates every conclusion: fewer than 10 matching reviews is never ranked,
  and a 4.89 from 9 reviews is never placed above a 4.84 from 115.
- Absent fields (sub-ratings, verified purchase, platform, helpful votes) are declared
  in the payload and never fabricated.

Extraction is reproducible: `src/data/source-records.ts` is generated from the two files
and keeps the verbatim source text alongside its page, sheet, cell, row and column.

### Rules the import enforces

- **Raw source text is preserved.** `raw` is always the verbatim cell; `display` is the
  readable form; `numeric` is the parsed value used for calculations.
- **A blank cell is never a "No".** It becomes `status: "unavailable"` and renders as
  **"Information unavailable"** with a tooltip explaining that the value was never
  recorded.
- **Formula-error cells are excluded.** Four `#VALUE!` cells (`I5:L5`) are flagged
  `formula_error` and never counted as data.
- **Refrigerants are not ranked.** The sources record which refrigerant a model uses and
  nothing more, so the application makes no efficiency or environmental claim between
  them.
- **Product families are never cross-compared.** Ducted split and air-to-water heat pumps
  are rated on different attributes; advantages are calculated strictly within an
  equipment type, and a mixed selection raises a warning.
- **Missing brands stay missing.** Five battlecard columns carry a model name with no
  brand line. Those products show "Information unavailable" for brand rather than an
  inferred one.
- **Source colour marks are presentation evidence only.** The battlecard's own green/red
  shading is preserved as a small dot with its legend text, clearly separated from the
  "Verified Daikin edge" badges this application calculates from numeric values.

### How advantages are calculated

`src/features/compare/engine.ts` produces three lists from the current selection:

- **Verified Daikin edges** — a Daikin value beats *every* selected competitor that has a
  recorded value, on SEER2, EER2, HSPF2, COP@5°F, sound level, warranty term, capacity,
  line length, elevation, leaving-water temperature, or on a listed capability
  (charge verification, slow loss-of-charge alerting, cloud diagnostics, Quality Install
  profiles, 115V air-handler compatibility).
- **Improvement gaps** — a selected competitor leads the strongest selected Daikin
  product, with a suggested sales or product action. Daikin is never forced to win.
- **Validation required** — an attribute where at least one side has no recorded value,
  so no comparison is made in either direction.

---

## Product images

`src/data/product-images.ts` is a manifest mapping catalog product ids to real
manufacturer photographs in `public/products/photos/`, each entry recording its credit
and origin. Products with a photograph (currently the three Daikin FIT models and the
Bosch IDS Premium) show it with attribution; every other product falls back to a
brand-neutral chassis illustration labelled **Representative image** — a wrong
competitor photo next to a specification would be worse than none. Drop a new photo in
the folder and add one manifest entry to light it up everywhere.

---

## Supabase

The app runs fully without Supabase: authentication, saved comparisons, review signals,
analyst notes, media clips, briefs and chat history all persist to a namespaced
`localStorage` collection whose record shapes match the SQL tables exactly.

To switch to Supabase, copy `.env.example` to `.env` and fill in:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

No code changes are needed — `src/lib/store.ts` writes to Supabase whenever both values
are present. Only the public anon key ever reaches the browser.

```bash
supabase db push                       # applies supabase/migrations/0001_init.sql
supabase secrets set ANTHROPIC_API_KEY=...   # server-side only
supabase functions deploy ai-advisor
```

`supabase/migrations/0001_init.sql` creates the normalized schema — profiles, brands,
product families, products, product images, attribute definitions, product attribute
values, source documents, source locations, saved comparisons, saved comparison products,
review signals, analyst notes, media clips, generated briefs, chat sessions, chat messages
and citations — with row-level security scoping every workspace record to its owner.

---

## AI Competitive Advisor

The floating advisor is **closed by default** and opens only when the user clicks the
floating button or the header's **Ask AI**. Nothing else opens it — not sign-in, not
navigation, not a selection change.

Answers are split into labelled sections: `VERIFIED PRODUCT FACT`,
`CALCULATED COMPARISON`, `AI ANALYTICAL INSIGHT`, `SUGGESTED MARKETING MESSAGE`,
`CLAIM REQUIRING VALIDATION` and `INFORMATION UNAVAILABLE`. Every factual line carries its
citation.

With no AI key configured the advisor answers deterministically from the source records
via `src/features/ai/answers.ts`. With a key set on the Edge Function, that same
deterministic answer is sent as the factual floor and the model may reorganise it and add
an analytical section — it cannot contradict it or introduce facts outside the records.
**The provider key lives only in Edge Function secrets and never reaches the browser.**

---

## Layout of the code

```
src/
  data/            source-records.ts (generated) · catalog.ts (normalization) · types · plain-language
  lib/             utils · supabase client · persistence layer
  components/
    ui/            button · badge · input · dialog · select · checkbox · tooltip · toast
    layout/        AppShell · Sidebar · Header · SecondaryNav
    charts/        ChartCard · AttributeBarChart · SpecialCharts · palette
    common/        ProductVisual · Provenance
  features/
    auth/          AuthProvider · LoginPage
    selection/     SelectionProvider · ProductSearch · SelectedProducts
    catalog/       search index and matching
    dashboard/     comparison builder
    explorer/      all 28 products with filters, sort, grid/list
    compare/       engine · PositioningSummary · ComparisonCharts · FeatureTable · MarketingTakeaways
    reviews/ analyst/ press/ briefs/ saved/ ai/
supabase/
  migrations/0001_init.sql
  functions/ai-advisor/index.ts
```

---

## Accessibility and print

Semantic headings and landmarks, ARIA labels on every icon-only control, visible focus
rings, 44px minimum touch targets, keyboard navigation throughout (including the search
combobox and the advisor), `prefers-reduced-motion` support, and status never carried by
colour alone — every chart labels its values and marks Daikin rows with a star.

**Print** and **Export to PDF** apply a landscape print stylesheet that hides navigation
and chrome, releases the comparison table's scroll container so the full table prints, and
avoids breaking cards across pages.

---

## Known environment limitation

Clipboard writes (the **Copy** buttons) could not be exercised under browser automation,
because the automated window never takes OS focus and both `navigator.clipboard` and the
`document.execCommand` fallback require a focused document. The implementation uses the
standard async-clipboard-with-`execCommand`-fallback pattern and surfaces a clear warning
toast when the browser denies access. Worth a manual click-through.
