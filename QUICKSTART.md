# Quick Start Guide

## Installation & Setup (First Time)

```bash
# 1. Install dependencies
npm install

# 2. Set up the database
npm run db:reset --force
npm run db:seed

# Expected output: "✓ Seeded 28 products"
```

## Running the App

```bash
npm run dev
```

Then open **http://localhost:3000** in your browser.

## Demo Login

- **Email:** `demo@daikin.com`
- **Password:** `DaikinDemo2026!`

## Using the App: The 2-Minute Demo Story

1. **Product Selection (Dashboard)**
   - Search for "DH7" (Daikin) and "Rheem 18" (competitor)
   - Click to add to comparison
   - Click **"Compare Selected Products"**

2. **Comparison Dashboard**
   - See overall similarity % (e.g., 84%)
   - See competitive scores (e.g., Daikin 91, Competitor 82)
   - View key specs in the table below

3. **Specification Table**
   - Click the "Specifications" tab in the sidebar
   - See all 39+ attributes side-by-side
   - Filter by "By Category" or "Missing Data"

4. **AI Insights**
   - Click the "AI Insights" tab
   - Read auto-generated competitive analysis
   - Includes verified facts, analysis, and messages

5. **Graphical Comparison**
   - Click the "Graphical Analysis" tab
   - See bar chart comparing scores
   - See radar chart showing key metrics
   - See strength/weakness breakdown

6. **Sales BattleCard**
   - Click the "Sales BattleCard" tab
   - See Top Selling Points, Objections & Responses
   - Click **"Print battlecard"** to open print preview

**Total time: ~2 minutes** ✓

## Key Features Working

✅ **Real Data** — 28 products in SQLite (not mock JSON)
✅ **Real Comparisons** — Scoring algorithm calculates similarity & scores
✅ **Real UI** — All 6 sections functional, every button works
✅ **Real Charts** — recharts bar & radar charts rendering live data
✅ **Real AI** — Mock agent generates insights (can swap to Azure OpenAI)
✅ **Professional** — No downgrade from original design, only improvements

## Enabling Real Azure OpenAI (Optional)

To use actual GPT-5 instead of mock responses:

1. Edit `.env.local`:
   ```
   AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
   AZURE_OPENAI_API_KEY="your-key-here"
   AZURE_OPENAI_DEPLOYMENT="gpt-5"
   AI_MODE=live
   ```

2. Restart the dev server

3. AI Insights and Battlecard will now call real Azure OpenAI with tool-calling

## Troubleshooting

### Database issues
```bash
# Reset everything and reseed
npm run db:reset --force
npm run db:seed
```

### Port already in use
```bash
# Dev server defaults to :3000, change with:
npm run dev -- -- -p 3001
```

### TypeScript errors
```bash
# Verify types are correct
npm run typecheck
```

### Missing dependencies
```bash
# Reinstall everything
rm -rf node_modules
npm install
npm run db:reset --force
npm run db:seed
```

## Project Structure

- **Frontend**: `app/frontend/components/` — 6 React components
- **Backend**: `app/api/` — 5 API routes
- **Business Logic**: `lib/ai/agent.ts`, `lib/comparison/scoring.ts`
- **Database**: `prisma/schema.prisma`, `dev.db` (SQLite)
- **Config**: `.env.local` (see `.env.example`)

See `PROJECT_STRUCTURE.md` for detailed layout.

## What's Next?

1. **Test the demo** — Follow the 2-minute story above
2. **Optional: Add Azure credentials** — Enable real AI
3. **Optional: Deploy** — Choose Cloudflare, Netlify, or Vercel
4. **Optional: Extend data** — Re-run Python ingestion for more products

## Support

- **Docs**: Read `PROJECT_STRUCTURE.md` and `README.md`
- **Database**: `npx prisma studio` to browse SQLite
- **Logs**: Check browser console (F12) and terminal output
