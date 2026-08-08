# TJ Pantry

Personal Trader Joe’s tracker: import receipts (OCR + paste), enrich products from Open Food Facts, rate finds, build regular grocery lists by meal, estimate costs from receipt history, and manage store hours / restock / crowd notes.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Prisma 7 + SQLite (`better-sqlite3`)
- Tesseract.js for client-side receipt OCR
- Open Food Facts search API for images / calories

## Setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Receipts** — photo OCR or paste text; parse line items; link/create products
- **Products** — rate, like/tried, archive / can’t find, breakfast–dinner assignment, OFF enrichment
- **Lists** — generate from favorites; group by meal; cost estimate from receipt averages
- **Stores** — hours, restocking times, crowd level logging
- **Costs** — trip totals, monthly spend, favorites-run estimate
