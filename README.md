# Daikin Competitive Marketing Intelligence

AI-powered competitive marketing intelligence for Daikin Product Marketing, Competitive Intelligence, Brand Marketing, Channel Marketing, Sales Enablement, Product Management, and leadership. The demo turns the supplied FIT battlecard and hydronic competitor workbook into evidence-backed positioning, battlecard, messaging, and campaign-asset workflows.

## Screenshots

Add approved screenshots here after the competition demo capture.

## Technology

- Next.js App Router, React, TypeScript strict mode, and Tailwind foundation
- A normalized Prisma target schema for SQLite now and PostgreSQL later
- Python ingestion for Excel/PDF table extraction with provenance retention
- Client-side demo session plus a server-side-ready AI service boundary
- Mock AI mode by default; no key is exposed to the browser

## Run locally

```bash
corepack enable
pnpm install --no-frozen-lockfile
pnpm dev
```

Then open the local URL shown in the terminal (normally `http://localhost:3000`). The dev command intentionally uses a local Vite mode so it does not require Cloudflare’s development runtime. Use `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` for the validation suite.

## Demo account

- Email: `demo@daikin.com`
- Password: `DaikinDemo2026!`

The same values are configurable in `.env.example`. The current demo uses a safe local session abstraction; replace it with Microsoft Entra ID/enterprise SSO in production.

## Environment

Copy `.env.example` to `.env.local`. Keep `AI_MODE=mock` for the self-contained demo. To enable real AI later, add a server-side `OPENAI_API_KEY`, retain deterministic product/source tools as the retrieval layer, and never pass the key into client code.

## Data import

The source extractor expects the supplied files at their attachment locations and writes normalized, source-backed TypeScript records:

```bash
python3 scripts/ingest_sources.py
```

It reads the Excel `Comparison` sheet and the FIT battlecard grid, preserves raw source strings, and leaves blank/error cells unavailable. The generated report is at `docs/DATA_QUALITY.md`.

## Product behavior

- The Marketing Intelligence Dashboard surfaces differentiators, competitive risks, claims requiring validation, and campaign themes.
- Messaging Studio and Campaign Assets create source-aware drafts for positioning, dealer enablement, leadership, and campaigns.
- Comparison supports two to eight selections, an evidence table, print layout, and battlecard view.
- The AI Marketing Advisor labels verified facts, competitive analysis, marketing recommendations, suggested messages, validation items, and unavailable information.
- Saved Comparisons is intentionally browser-local for the competition demo; Prisma models define the durable production migration path.

## Quality commands

`pnpm run build` validates production compilation. `pnpm test` builds the app and asserts that core product-intelligence surfaces and 28 extracted records are shipped. The existing test harness is deliberately dependency-light.

## Production considerations

Use Prisma migrations and a protected database, replace the demo login with Entra SSO, run ingestion in a controlled worker, store source artifacts in durable storage, rate-limit server AI routes, add source versioning/review workflow, and validate claims before external use.
