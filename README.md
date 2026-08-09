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
# optional: AUTH_SECRET=a-long-random-string
npm run db:push   # or: npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be prompted to sign in.

Default seeded user (change later): **username `josh` / password `Josh`**.

Set `AUTH_SECRET` in production so session cookies stay signed with a private key.

## Deploy free on Vercel

1. Push this repo to GitHub (or deploy from CLI).
2. Import the project at [vercel.com/new](https://vercel.com/new) (Hobby / free plan).
3. **Required:** add a Postgres connection string in Vercel → Project Settings → Environment Variables  
   (enable it for **Production** / **Preview**, and for both **Build** and **Runtime**):
   - **`DATABASE_URL`** (preferred), or Neon/Vercel’s `POSTGRES_URL` / `POSTGRES_PRISMA_URL`
   - Free options: [Prisma Postgres](https://www.prisma.io/postgres), [Neon](https://neon.tech) / Vercel Marketplace → Neon
4. **Recommended:** add **`AUTH_SECRET`** (any long random string) for signed login sessions.
5. Set **Build Command** to `npm run vercel-build` (or use the included `vercel.json`).
6. Deploy. When a DB URL is present, the build runs migrations + seed (including the `josh` user), then `next build`.

Without a Postgres URL the Next.js build still succeeds, but the live app cannot talk to a database until you add one and redeploy.

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
