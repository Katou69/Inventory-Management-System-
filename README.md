This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Backend

A FastAPI backend lives in `backend/`. It currently implements only auth (login, refresh, logout, me) against a Supabase Postgres database via SQLAlchemy; other resources (inventory, orders, purchases, warehouses, zones) are scaffolded but not yet implemented.

1. Create a Supabase project and copy its Postgres connection string (Project Settings → Database).
2. `cd backend && cp .env.example .env` and fill in `DATABASE_URL` (and change `JWT_SECRET`).
3. Install deps and run migrations:
   ```bash
   uv sync
   uv run alembic upgrade head
   uv run python -m app.seed
   uv run uvicorn app.main:app --reload --port 8000
   ```
4. Run tests: `uv run pytest` (uses an in-memory SQLite DB, independent of the Supabase connection).

With the backend running, set `NEXT_PUBLIC_USE_MOCK_API=false` and `NEXT_PUBLIC_API_URL=http://localhost:8000` in the frontend's `.env.local` to use it instead of mock data.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
