# Project Structure

## Frontend (`app/frontend/`)

Contains all React components and client-side logic.

```
app/frontend/
├── components/
│   ├── ProductSelection.tsx     # Product search and selection UI
│   ├── ComparisonDashboard.tsx  # Main comparison dashboard with scores
│   ├── SpecificationTable.tsx   # Detailed attribute comparison table
│   ├── AIInsights.tsx           # AI-generated insights display
│   ├── BattleCard.tsx           # Sales battlecard generation
│   └── GraphicalComparison.tsx  # Charts and visualizations (recharts)
```

**Key Features:**
- Client-side (`"use client"`) components
- Fetch data from backend API routes
- Reactive state management with React hooks
- All user interactions and UI logic

## Backend (`app/api/`, `lib/`)

Contains all server-side logic, database queries, and API routes.

### API Routes (`app/api/`)

```
app/api/
├── products/
│   └── route.ts                 # GET /api/products - Fetch all products
├── compare/
│   └── route.ts                 # POST /api/compare - Compare products, scoring
├── ai/
│   ├── insights/
│   │   └── route.ts             # POST /api/ai/insights - Generate AI insights
│   └── battlecard/
│       └── route.ts             # POST /api/ai/battlecard - Generate battlecard
└── saved-comparisons/
    └── route.ts                 # GET/POST - Save/retrieve comparisons
```

**Route Handlers (Next.js):**
- All routes return JSON
- Server-only execution (keys never exposed to browser)
- Connect to SQLite via Prisma ORM
- Call Azure OpenAI agents for AI features

### Business Logic (`lib/`)

```
lib/
├── ai/
│   └── agent.ts                 # Azure OpenAI agent orchestrator
│       - Tool-calling loop
│       - Tool implementations (get_product_specs, compare_products, etc.)
│       - Mock fallback mode (AI_MODE=mock)
└── comparison/
    └── scoring.ts               # Competitive scoring algorithm
```

### Database (`prisma/`)

```
prisma/
├── schema.prisma                # Prisma ORM schema (SQLite)
├── seed.ts                       # Database seeding script
└── migrations/
    └── 20260728062325_init/     # Initial schema migration
```

## Data Flow

```
User Interaction (Frontend)
        ↓
Browser → Next.js API Route
        ↓
Server-side Logic (lib/ai/agent.ts, lib/comparison/scoring.ts)
        ↓
Prisma ORM → SQLite Database (dev.db)
        ↓
Azure OpenAI (if AI_MODE=live)
        ↓
JSON Response → Client
        ↓
React Components render data
```

## Key Separation

**Frontend Responsibility:**
- UI rendering
- User input handling
- API calls (fetch)
- Loading/error states

**Backend Responsibility:**
- Product/attribute data retrieval
- Scoring algorithms
- AI orchestration
- Source provenance tracking
- Security (credentials, rate limiting)

## Scripts

- `npm run dev` — Start dev server (frontend + backend)
- `npm run build` — Production build
- `npm run typecheck` — Type validation
- `npm run db:reset --force` — Reset SQLite
- `npm run db:seed` — Populate database from ingested data
- `python3 scripts/ingest_sources.py` — Extract data from Excel/PDF

## Environment Variables

Stored in `.env.local` (git-ignored):

```
DATABASE_URL="file:./dev.db"
AZURE_OPENAI_ENDPOINT=""
AZURE_OPENAI_API_KEY=""
AZURE_OPENAI_DEPLOYMENT="gpt-5"
AZURE_OPENAI_API_VERSION="2024-10-01-preview"
AI_MODE=mock                    # mock or live
DEMO_EMAIL=demo@daikin.com
DEMO_PASSWORD=DaikinDemo2026!
```

## Deployment Readiness

- ✅ SQLite local database (swap to PostgreSQL in production)
- ✅ Prisma migrations tracked
- ✅ API routes ready for serverless (Cloudflare, Netlify, Vercel)
- ✅ Azure OpenAI key isolation (server-only)
- ✅ Mock mode for demo/testing without real AI

## Testing the App

1. Install dependencies: `npm install`
2. Initialize database: `npm run db:reset && npm run db:seed`
3. Start dev server: `npm run dev`
4. Open http://localhost:3000
5. Login with demo credentials (demo@daikin.com / DaikinDemo2026!)
6. Select products → compare → view insights → see charts
