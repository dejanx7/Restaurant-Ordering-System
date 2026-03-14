# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mobile-responsive restaurant ordering web app with two portals:
- **Customer Portal** (`/`): Menu browsing, cart, checkout (Stripe), real-time order tracking via SSE
- **Restaurant Portal** (`/dashboard`): Live Kanban order board, menu management, settings, analytics

Single restaurant, supports Pick-up and Delivery orders.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Auth**: Clerk (customer accounts + restaurant staff roles)
- **Real-time**: Server-Sent Events (SSE)
- **State**: TanStack Query v5 (server state) + Zustand (cart/UI state)
- **UI**: Tailwind CSS + shadcn/ui + Framer Motion
- **Payments**: Stripe (Payment Element + Webhooks)
- **Images**: Cloudinary
- **Email**: Resend + React Email
- **Deploy**: Vercel

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx prisma migrate dev    # Run database migrations
npx prisma studio         # Visual database browser
npx prisma db seed        # Seed sample data
```

## Architecture

### Route Groups
- `src/app/(customer)/` — Customer-facing pages (menu, checkout, order tracking, account)
- `src/app/(restaurant)/` — Restaurant portal pages (dashboard, menu management, settings)
- `src/app/api/` — API routes (menu, orders, checkout, SSE streams, Stripe webhooks)

### Key Patterns
- **Money in cents**: All monetary values stored as integers (cents) in DB and computed in `src/lib/pricing.ts`. Never use floats for money.
- **Order item snapshots**: `OrderItem` stores `name`, `price`, and `modifiers` as snapshots at order time — menu changes don't alter historical orders.
- **Cart persistence**: Zustand store in `src/stores/cart.ts` persists to localStorage with a version key for schema migration.
- **SSE broadcasting**: `src/app/api/sse/orders/route.ts` maintains an in-memory connection map. New orders broadcast from the Stripe webhook handler.
- **Payment flow**: Never create Order records on client payment confirmation. Only the Stripe webhook (`src/app/api/webhooks/stripe/route.ts`) creates orders after verifying the signature.
- **Singleton settings**: `RestaurantSettings` model uses `id = "singleton"` — always one row.

### Critical Files
- `prisma/schema.prisma` — Data model source of truth
- `src/app/api/webhooks/stripe/route.ts` — Order creation + SSE broadcast (highest-risk file)
- `src/lib/pricing.ts` — Centralized tax/fee/discount calculations (shared client + server)
- `src/stores/cart.ts` — Cart state with localStorage persistence
