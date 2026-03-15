# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mobile-responsive restaurant ordering web app with two portals:
- **Customer Portal** (`/`): Menu browsing, cart, checkout, real-time order tracking
- **Restaurant Portal** (`/dashboard`): Live Kanban order board, menu management, settings

Single restaurant ("The Kitchen"), supports Pick-up and Delivery orders. Dark & modern theme with emerald accents.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React Server Components, Turbopack)
- **Database**: PostgreSQL via Prisma 7 with `@prisma/adapter-pg`
- **State**: TanStack Query v5 (server state) + Zustand (cart/UI state)
- **UI**: Tailwind CSS v4 + shadcn/ui (base-ui based, no `asChild` — use `render` prop or plain `<Link>` for polymorphic rendering)
- **Payments**: Stripe (test mode) — PaymentIntent + Payment Element + webhook-based order creation
- **Deploy**: Vercel + Neon (planned)

## Commands

```bash
# Development
npx prisma dev --detach        # Start local PostgreSQL (Prisma dev server)
npx prisma migrate dev         # Run database migrations
npx tsx prisma/seed.ts         # Seed sample data
npm run dev                    # Start dev server (http://localhost:3000)
npm run build                  # Production build
npm run lint                   # ESLint

# Database
npx prisma studio              # Visual database browser
npx prisma generate            # Regenerate Prisma client after schema changes
```

## Architecture

### Prisma 7 Setup
- Schema at `prisma/schema.prisma` — `datasource` block has NO `url` field (Prisma 7 moved this to `prisma.config.ts`)
- `prisma.config.ts` uses `MIGRATE_DATABASE_URL` for migrations (prisma+postgres proxy URL) and falls back to `DATABASE_URL`
- Runtime client uses `@prisma/adapter-pg` with `PrismaPg({ connectionString })` — see `src/lib/prisma.ts`
- Generated client output: `src/generated/prisma/client.ts` — import from `@/generated/prisma/client`, NOT `@/generated/prisma`

### Route Groups
- `src/app/(customer)/` — Customer-facing pages (menu, checkout, order tracking, order confirming)
- `src/app/(restaurant)/` — Restaurant portal pages (dashboard, menu management, order history, settings)
- `src/app/api/` — Public API routes (menu, orders, checkout, SSE streams)
- `src/app/api/admin/` — Restaurant admin API routes (categories, menu-items, modifier-groups, promo-codes, settings)

### Key Patterns
- **Money in cents**: All monetary values stored as integers (cents). Calculations centralized in `src/lib/pricing.ts`.
- **Order item snapshots**: `OrderItem` stores `name`, `price`, and `modifiers` as snapshots at order time.
- **Cart persistence**: Zustand store in `src/stores/cart.ts` persists to localStorage with a version key.
- **Server-side price validation**: The checkout API (`src/app/api/checkout/route.ts`) recalculates all prices from DB — never trusts client-side amounts.
- **Singleton settings**: `RestaurantSettings` uses `id = "singleton"`.
- **Dynamic pages**: Customer menu page (`page.tsx`) uses `export const dynamic = "force-dynamic"` since it queries the database.
- **shadcn/ui v4**: Uses `@base-ui/react` — no `asChild` prop. For link buttons, use styled `<Link>` elements instead.

### Stripe Payment Flow
1. Customer fills form → clicks "Continue to Payment" → `POST /api/create-payment-intent` validates items & creates Stripe PaymentIntent
2. Stripe Payment Element renders (card, Apple Pay, Google Pay) with dark theme styling
3. On payment success, `POST /api/webhooks/stripe` receives `payment_intent.succeeded` event
4. Webhook creates the Order in DB (idempotent on `stripePaymentIntentId`)
5. Frontend polls `GET /api/orders/by-payment-intent/[id]` to find the created order, then redirects to tracking
6. For redirect-based flows (3D Secure), `/order/confirming` page handles the return URL
7. `POST /api/checkout` still exists as legacy direct order creation (no payment) — both paths emit SSE events

### Real-Time SSE System
- **Event emitter**: `src/lib/sse.ts` — in-process pub/sub singleton (single-server; replace with Redis for multi-server)
- **Events**: `order:new` (broadcast when order created) and `order:updated` (broadcast on status change)
- **Emitters**: Status update API, Stripe webhook, and legacy checkout route all call `orderEvents.emit()`
- **SSE endpoints**: `GET /api/sse/orders` (all events for dashboard) and `GET /api/sse/order/[orderId]` (filtered for customer tracking)
- **Client hooks**: `useOrderSSE` (dashboard — invalidates queries, triggers audio alert) and `useOrderStatus` (tracking — updates status in real time)
- **Fallback**: Polling continues at 30s (SSE connected) or 10s (disconnected); connection status shown via Live/Polling badge

### Admin API Structure
All admin routes live under `/api/admin/` and follow REST conventions:
- `GET/POST /api/admin/categories` + `PATCH/DELETE /api/admin/categories/[categoryId]`
- `GET/POST /api/admin/menu-items` + `PATCH/DELETE /api/admin/menu-items/[itemId]`
- `POST /api/admin/modifier-groups` + `PATCH/DELETE /api/admin/modifier-groups/[groupId]`
- `GET/PATCH /api/admin/settings` + `PUT /api/admin/settings/hours`
- `GET/POST /api/admin/promo-codes` + `PATCH/DELETE /api/admin/promo-codes/[promoId]`

Note: No authentication is enforced yet — all admin routes are open.

### Critical Files
- `prisma/schema.prisma` — Data model source of truth
- `src/app/api/create-payment-intent/route.ts` — PaymentIntent creation with server-side price validation
- `src/app/api/webhooks/stripe/route.ts` — Webhook handler, creates orders after payment confirmed
- `src/app/api/checkout/route.ts` — Legacy direct order creation (no payment)
- `src/lib/stripe.ts` — Stripe server client singleton
- `src/lib/sse.ts` — SSE event emitter singleton (in-process pub/sub)
- `src/lib/pricing.ts` — Centralized tax/fee/discount calculations
- `src/stores/cart.ts` — Cart state with localStorage persistence
- `src/hooks/use-order-sse.ts` — Dashboard SSE hook (new order alerts, query invalidation)
- `src/hooks/use-order-status.ts` — Customer tracking SSE hook (live status updates)
