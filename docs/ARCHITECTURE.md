# Architecture

## System flow

`Excel/PDF source -> ingestion -> normalized product attributes + provenance -> comparison engine -> UI / advisor citations`.

The UI reads generated source-backed records for the self-contained demo. `scripts/ingest_sources.py` uses `openpyxl` for workbook cells and `pdfplumber` for the battlecard grid. It keeps raw values as supplied and records sheet/page provenance.

## Domain model

`prisma/schema.prisma` models brands, product families, products, attribute definitions, raw/normalized product values, source documents/locations, saved comparisons, and cited chat messages. Attribute definitions own comparison direction and tolerance; raw values remain auditable.

## Comparison engine

The scenario score is an explicit decision-support aid, not a technical truth. The scoring service receives weighted metrics, excludes unavailable values from coverage, and returns score plus data coverage. Qualitative refrigerant and initial-cost claims are deliberately not auto-winners.

## AI / RAG design

Production AI is server-only: a retrieval layer resolves products and source locations, deterministic tools fetch/compare/calculate, and the model produces a constrained explanation. Mock mode mirrors that contract with approved source-only responses. It returns an evidence summary rather than private chain-of-thought.

## Security and migration

Keep API keys only in runtime secrets, validate all requests with Zod in production route handlers, enforce rate limits, authenticate through Entra ID, authorize source access, and provide audit logs. SQLite is the demo default; Prisma’s relational model can target PostgreSQL with no application-model redesign.
