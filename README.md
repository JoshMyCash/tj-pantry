# TJ Pantry

Personal Trader Joe’s tracker: import receipts (OCR + paste), enrich products from Open Food Facts, rate finds, build regular grocery lists by meal, estimate costs from receipt history, and manage store hours / restock / crowd notes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma 7 + **Postgres** (Prisma Postgres / Neon-compatible — works on Vercel free)
- Tesseract.js for client-side receipt OCR
- Open Food Facts search API for images / calories

## Local setup

```bash
npm install
# set DATABASE_URL in .env (Postgres connection string)
npm run db:push   # or: npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy free on Vercel

1. Push this repo to GitHub (or deploy from CLI).
2. Import the project at [vercel.com/new](https://vercel.com/new) (Hobby / free plan).
3. Add a Postgres connection string env var (enable it for **Build** and **Runtime**):
   - **`DATABASE_URL`** (preferred), or Neon/Vercel’s `POSTGRES_URL` / `POSTGRES_PRISMA_URL`
   - Free options: [Prisma Postgres](https://www.prisma.io/postgres), [Neon](https://neon.tech) / Vercel Marketplace → Neon
4. Set **Build Command** to `npm run vercel-build` (or use the included `vercel.json`).
5. Deploy. The build resolves the DB URL, runs migrations + seed, then `next build`.

If the build fails with a missing datasource URL, the env var is unset for the Build environment in Vercel.

### CLI deploy

```bash
npx vercel login
npx vercel link
npx vercel env add DATABASE_URL production
npx vercel --prod
```

## Features

- **Receipts** — photo OCR or paste text; parse line items; link/create products
- **Products** — rate, like/tried, archive / can’t find, breakfast–dinner assignment, OFF enrichment
- **Lists** — generate from favorites; group by meal; cost estimate from receipt averages
- **Stores** — hours, restocking times, crowd level logging
- **Costs** — trip totals, monthly spend, favorites-run estimate
