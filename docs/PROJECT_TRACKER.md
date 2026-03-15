# Project Tracker

## Current Status: Phase 2 Complete — Phase 3 (Analytics + Enhancements) Next

**Started**: 2026-03-14
**Phase 1 completed**: 2026-03-14
**Phase 2 completed**: 2026-03-15

---

## Phase 1 — Core MVP [COMPLETED]

### Week 1: Foundation [COMPLETED]

- [x] Initialize Next.js 16 project with TypeScript, Tailwind v4, Turbopack
- [x] Install and configure shadcn/ui (dark theme, base-ui based)
- [x] Set up Prisma 7 + PostgreSQL with `@prisma/adapter-pg`
- [x] Define full database schema (13 models: Category, MenuItem, ModifierGroup, Modifier, Order, OrderItem, OrderStatusHistory, RestaurantSettings, BusinessHours, PromoCode, OrderSequence)
- [x] Run initial migration
- [x] Create seed script with sample restaurant, 5 categories, 15 menu items, modifiers, promo code
- [x] Set up dark & modern theme with emerald green accents
- [x] Configure TanStack Query provider
- [x] Configure Sonner toast notifications
- [x] Create `.env.example` for onboarding
- [x] Set up project structure (route groups, components, hooks, lib, stores, types)

### Week 2: Customer Menu + Cart [COMPLETED]

- [x] Menu API route (`GET /api/menu`) — returns categories, items, modifiers, restaurant settings
- [x] Menu page as Server Component with `force-dynamic`
- [x] Menu hero section with restaurant status, pickup/delivery estimates, animated entrance
- [x] Sticky category navigation with IntersectionObserver scroll tracking
- [x] Menu item cards with dietary tag badges, pricing, hover effects (Framer Motion)
- [x] Item customization modal — modifier selection, quantity controls, special instructions
- [x] Zustand cart store with localStorage persistence (versioned)
- [x] Cart drawer (Sheet) — quantity controls, item removal, subtotal, checkout link
- [x] Customer header with cart button and item count badge

### Week 3: Checkout + Order Creation [COMPLETED]

- [x] Checkout page — order type toggle (Pickup/Delivery), contact form, delivery address input
- [x] Order summary with itemized breakdown, tax calculation, delivery fee
- [x] Checkout API route (`POST /api/checkout`) with Zod validation
- [x] Server-side price recalculation (never trusts client amounts)
- [x] Restaurant open/closed check before accepting orders
- [x] Menu item availability verification against database
- [x] Delivery minimum order validation
- [x] Sequential order number generation (PostgreSQL sequence)
- [x] Atomic order creation with Prisma transactions (Order + OrderItems + StatusHistory)
- [x] Order detail API route (`GET /api/orders/[orderId]`)
- [x] Order tracking page with status stepper (5 steps with icons)
- [x] Auto-refresh order status every 5 seconds (polling)

### Week 4: Restaurant Dashboard [COMPLETED]

- [x] Restaurant portal layout with top nav (desktop) and bottom tab bar (mobile)
- [x] Live order board — Kanban columns (New, Confirmed, Preparing, Ready)
- [x] Order cards with customer name, order type badge, items, elapsed time, total
- [x] One-click status advancement buttons (Accept, Start Preparing, Mark Ready, Complete)
- [x] Status update API route (`PATCH /api/orders/[orderId]/status`) with Zod validation
- [x] Status history tracking with timestamps (acceptedAt, preparedAt, completedAt)
- [x] Optimistic UI updates with TanStack Query (instant feedback, rollback on error)
- [x] Auto-refresh dashboard every 10 seconds (polling)

### Stripe Integration [COMPLETED]

- [x] Install and configure Stripe (test mode)
- [x] Create PaymentIntent on checkout (`POST /api/create-payment-intent` → Stripe)
- [x] Add Stripe Payment Element to checkout page (card, Apple Pay, Google Pay)
- [x] Stripe webhook handler (`POST /api/webhooks/stripe`) with signature verification
- [x] Move order creation to webhook (only create after payment confirmed)
- [x] Idempotency check on `stripePaymentIntentId` to prevent double orders
- [x] Handle payment failures gracefully on the client
- [x] 3D Secure redirect handling via `/order/confirming` page

---

## Phase 2 — Real-Time + Polish [COMPLETED]

### Week 5: Real-Time Updates [COMPLETED]

- [x] In-process event emitter (`src/lib/sse.ts`) for SSE pub/sub
- [x] SSE endpoint for restaurant dashboard (`GET /api/sse/orders`)
- [x] SSE endpoint for customer order tracking (`GET /api/sse/order/[orderId]`)
- [x] `useOrderSSE` hook — restaurant receives instant new order notifications
- [x] `useOrderStatus` hook — customer sees live status changes
- [x] Polling demoted to fallback (30s when SSE connected, 10s when disconnected)
- [x] Audio alert on new order (Web Audio API, two-tone chime)
- [x] Visual flash/animation on new order
- [x] "Connection lost — reconnecting" banner on SSE disconnect
- [x] Live/Polling status badge on both portals

### Week 6: Menu Management [COMPLETED]

- [x] Admin API routes for categories (`/api/admin/categories`)
- [x] Admin API routes for menu items (`/api/admin/menu-items`)
- [x] Admin API routes for modifier groups (`/api/admin/modifier-groups`)
- [x] Category CRUD (create, edit, delete, toggle active/hidden)
- [x] Menu item CRUD (create, edit with category/tags/price/description, archive)
- [x] Modifier group builder UI (add groups, add options, set required/min/max)
- [x] Item availability toggle ("86 this item") — optimistic updates
- [x] Collapsible category view with item counts

### Week 7: Settings + Promo Codes + Order History [COMPLETED]

- [x] Settings API routes (`/api/admin/settings`, `/api/admin/settings/hours`)
- [x] Promo code API routes (`/api/admin/promo-codes`)
- [x] Settings page with tabbed UI (General, Hours, Delivery, Promo Codes)
- [x] Quick toggles: Open/Closed, Paused Today, Delivery On/Off
- [x] Business hours editor (per-day open/close times, closed toggle)
- [x] Delivery settings (enable/disable, radius, fee, minimum order)
- [x] Estimated prep time settings (pickup + delivery)
- [x] Tax rate configuration
- [x] Promo code CRUD (create with type/value/min/max/expiry, toggle active, delete)
- [x] Order history page (all orders with status badges, type, timestamps, totals)

---

## Phase 3 — Analytics + Enhancements [NOT STARTED]

### Week 8: Analytics Dashboard

- [ ] Revenue chart by day/week/month (Recharts)
- [ ] Top-selling items ranking
- [ ] Average order value
- [ ] Peak hours heatmap
- [ ] Date range picker
- [ ] Export to CSV

### Week 9: Advanced Features

- [ ] Manual order creation (phone orders) in restaurant portal
- [ ] Kitchen ticket printing (thermal-printer-friendly CSS `@media print`)
- [ ] Delivery radius visualization on map in settings
- [ ] Customer saved addresses
- [ ] Web push notifications for restaurant (backup to audio alerts)

### Week 10: Performance + Polish

- [ ] Lighthouse audit (target: Performance >= 90, Accessibility >= 95)
- [ ] Image optimization pass
- [ ] Menu page SEO optimization
- [ ] Mobile testing on iOS Safari and Android Chrome
- [ ] Uptime monitoring setup

---

## Completed Milestones

| Date | Milestone |
|---|---|
| 2026-03-14 | Project initialized — Next.js 16, Prisma 7, shadcn/ui, dark theme |
| 2026-03-14 | Database schema designed and migrated (13 models) |
| 2026-03-14 | Sample data seeded (5 categories, 15 items, modifiers, promo code) |
| 2026-03-14 | Customer portal built — menu browsing, cart, checkout, order tracking |
| 2026-03-14 | Restaurant dashboard built — Kanban order board with status management |
| 2026-03-14 | Full API layer built — menu, checkout, orders, status updates |
| 2026-03-14 | End-to-end order flow verified (place order → dashboard → status updates) |
| 2026-03-15 | Stripe integration — PaymentIntent, Payment Element, webhook order creation |
| 2026-03-15 | Real-time SSE — live order updates for dashboard and customer tracking |
| 2026-03-15 | Menu management — category/item/modifier CRUD with availability toggles |
| 2026-03-15 | Settings — general config, business hours, delivery, promo codes |
| 2026-03-15 | Order history page — full order list with filtering |
| 2026-03-15 | Phase 2 complete — all restaurant portal pages fully functional |

---

## Known Issues / Technical Debt

- [ ] No authentication — both portals are currently open (Clerk integration planned)
- [ ] No image uploads — all menu items have `null` imageUrl (Cloudinary planned)
- [ ] No promo code validation at checkout (CRUD exists but not wired to checkout flow)
- [ ] No delivery zone validation (address accepted without radius check)
- [ ] No email confirmation on order placement (Resend planned)
- [ ] No drag-to-reorder for categories/items (`@dnd-kit/core` planned)
- [ ] No bulk price update for menu items
- [ ] No re-order from history
- [ ] `prisma dev` server port is dynamic — `.env` needs manual URL update after restart
- [ ] SSE uses in-process emitter — needs Redis pub/sub for multi-server deployments
