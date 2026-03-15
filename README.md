# Restaurant Order System

A mobile-responsive web application for a single restaurant that supports Pick-up and Delivery orders. Features two distinct portals: a **Customer Portal** for browsing menus and placing orders, and a **Restaurant Portal** for managing incoming orders in real-time.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma 7 ORM |
| Payments | Stripe (Payment Element + webhooks) |
| Real-Time | Server-Sent Events (SSE) |
| Server State | TanStack Query v5 |
| Client State | Zustand (cart persistence via localStorage) |
| UI | Tailwind CSS v4 + shadcn/ui + Framer Motion |
| Validation | Zod |
| Icons | Lucide React |

## Prerequisites

- **Node.js** v20+
- **npm** v9+
- **Stripe account** with test keys (for payment integration)
- No separate PostgreSQL installation needed — Prisma Dev Server handles it

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Update `.env` with your Stripe test keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys):
- `STRIPE_SECRET_KEY` — starts with `sk_test_`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — starts with `pk_test_`
- `STRIPE_WEBHOOK_SECRET` — starts with `whsec_` (from Stripe CLI or dashboard)

### 3. Start the local database

Prisma 7 includes a built-in development PostgreSQL server:

```bash
npx prisma dev --detach
```

This starts a local PostgreSQL instance and outputs connection URLs. The `.env` file needs two URLs from this output:

- **`DATABASE_URL`** — the TCP URL (e.g., `postgres://postgres:postgres@localhost:PORT/template1?sslmode=disable`)
- **`MIGRATE_DATABASE_URL`** — the proxy URL starting with `prisma+postgres://...`

Update your `.env` file with the URLs shown in the terminal output.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Seed the database

Populates the database with sample restaurant settings, menu categories, items, modifiers, and a promo code:

```bash
npx tsx prisma/seed.ts
```

### 6. Set up Stripe webhooks (for local development)

```bash
# In a separate terminal
npx stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret shown and add it as `STRIPE_WEBHOOK_SECRET` in your `.env`.

### 7. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

## Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma dev --detach` | Start local PostgreSQL server |
| `npx prisma dev ls` | List running Prisma dev servers |
| `npx prisma dev stop` | Stop the local PostgreSQL server |
| `npx prisma migrate dev` | Apply pending migrations |
| `npx prisma migrate dev --name <name>` | Create and apply a new migration |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma studio` | Open visual database browser |
| `npx tsx prisma/seed.ts` | Seed database with sample data |

## Application URLs

| URL | Description |
|---|---|
| `http://localhost:3000` | Customer Portal — Menu & ordering |
| `http://localhost:3000/checkout` | Customer Portal — Checkout with Stripe payment |
| `http://localhost:3000/order/[orderId]` | Customer Portal — Real-time order tracking |
| `http://localhost:3000/dashboard` | Restaurant Portal — Live order board with SSE |
| `http://localhost:3000/menu` | Restaurant Portal — Menu management |
| `http://localhost:3000/orders` | Restaurant Portal — Order history |
| `http://localhost:3000/settings` | Restaurant Portal — Settings & promo codes |

---

## User Guide

### Customer Portal

#### Browsing the Menu

1. Open **http://localhost:3000** to see the restaurant menu
2. The **hero section** at the top shows the restaurant name, open/closed status, and estimated wait times for pickup and delivery
3. Use the **sticky category tabs** below the hero to jump between menu sections (Appetizers, Main Course, Sides, Drinks, Desserts)
4. Each menu item shows its name, description, price, and dietary tags (Vegan, Vegetarian, Gluten-Free, Spicy, etc.)

#### Adding Items to Cart

1. **Click any menu item** to open the customization modal
2. If the item has modifiers (e.g., "Choose Size", "Add Extras"), select your options — required modifiers are marked
3. Adjust the **quantity** using the +/- buttons
4. Add optional **special instructions** (allergies, preferences)
5. Click **"Add to Order"** — the item is added and the cart drawer opens automatically

#### Managing Your Cart

1. Click the **"Cart"** button in the header to open the cart drawer at any time
2. Adjust item quantities with the +/- buttons
3. Remove items with the trash icon
4. The **subtotal** updates in real-time
5. Click **"Checkout"** to proceed

#### Placing an Order

1. On the checkout page, select your **order type**: Pickup or Delivery
2. Fill in your **contact information** (name, email, optional phone)
3. For delivery orders, enter your **delivery address**
4. Add any **special instructions** for the kitchen
5. Review your **order summary** including subtotal, tax (8%), and delivery fee ($3.99 for delivery orders)
6. Click **"Continue to Payment"** — the server validates your order and creates a Stripe PaymentIntent
7. Enter your **card details** using the Stripe Payment Element (also supports Apple Pay & Google Pay)
8. Click **"Pay"** — on success, you're redirected to the order tracking page

#### Tracking Your Order

After placing an order, you're redirected to the **order tracking page** which shows:
- A **status tracker** with 5 steps: Order Received > Confirmed > Preparing > Ready > Completed
- Your **order details** with itemized breakdown
- A **Live/Polling indicator** — status updates arrive instantly via SSE, with polling as a fallback

### Restaurant Portal

#### Live Order Board

1. Open **http://localhost:3000/dashboard** to see the order management dashboard
2. A **Live** badge indicates active SSE connection (falls back to polling if disconnected)
3. Orders are displayed in a **Kanban board** with 4 columns:
   - **New Orders** (yellow) — freshly placed orders awaiting acceptance
   - **Confirmed** (blue) — accepted orders
   - **Preparing** (orange) — orders being made in the kitchen
   - **Ready** (green) — orders ready for pickup or delivery
4. Each order card shows:
   - Order number and customer name
   - Order type badge (Pickup or Delivery)
   - Item list with quantities and prices
   - Elapsed time since the order was placed
   - Total amount
5. Click the **action button** on each card to advance it to the next status:
   - "Accept" moves New > Confirmed
   - "Start Preparing" moves Confirmed > Preparing
   - "Mark Ready" moves Preparing > Ready
   - "Complete" moves Ready > Completed (removes from board)
6. **New order alerts**: an audio chime plays and the header flashes when a new order arrives

#### Menu Management

1. Open **http://localhost:3000/menu** to manage your menu
2. **Categories**: Create, edit, delete, and toggle active/hidden — hidden categories don't appear on the customer menu
3. **Items**: Click a category to expand it, then create, edit, or archive items with name, description, price, and dietary tags
4. **Availability toggle**: Use the switch on any item to instantly mark it as unavailable ("86 this item")
5. **Modifiers**: Click "+Mod" on an item to add modifier groups (e.g., "Size" with options "Small", "Large +$3") with required/optional and max selection settings

#### Order History

Open **http://localhost:3000/orders** to see all past orders with status, order type, customer name, timestamps, and totals.

#### Settings

Open **http://localhost:3000/settings** to configure:

- **Quick toggles**: Open/Closed, Paused for Today, Delivery On/Off
- **General**: Restaurant name, phone, address, tax rate, pickup time estimates
- **Hours**: Per-day business hours with open/close times and closed toggle
- **Delivery**: Radius, delivery fee, minimum order, delivery time estimates
- **Promo Codes**: Create and manage discount codes with percentage or flat amount, minimum order, max uses, and expiry dates

#### Navigation

Use the top navigation bar (desktop) or bottom tab bar (mobile) to switch between:
- **Orders** — Live order board
- **Menu** — Menu management
- **History** — Past orders
- **Settings** — Restaurant settings & promo codes

---

## API Reference

### Public APIs

#### `GET /api/menu`

Returns all active menu categories with items and modifiers, plus restaurant settings.

**Response:** `{ categories: [...], restaurant: { name, isOpen, taxRate, ... } }`

#### `POST /api/create-payment-intent`

Validates order data, recalculates prices server-side, and creates a Stripe PaymentIntent.

**Request body:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "555-0123",
  "orderType": "PICKUP",
  "items": [
    {
      "menuItemId": "item_id",
      "name": "Crispy Spring Rolls",
      "price": 899,
      "quantity": 2,
      "modifiers": [{ "name": "Extra Sauce", "priceAdj": 50 }]
    }
  ]
}
```

**Response:** `{ clientSecret, paymentIntentId, totalAmount }`

#### `POST /api/webhooks/stripe`

Stripe webhook handler. On `payment_intent.succeeded`, creates the order in the database (idempotent on `stripePaymentIntentId`) and broadcasts an SSE event to the restaurant dashboard.

#### `POST /api/checkout`

Legacy direct order creation without payment. Same validation as `create-payment-intent` but creates the order immediately.

#### `GET /api/orders?active=true`

Returns orders filtered by status. With `active=true`, returns only orders with status PENDING, CONFIRMED, PREPARING, or READY.

#### `GET /api/orders/[orderId]`

Returns full details for a single order including items, totals, and status.

#### `PATCH /api/orders/[orderId]/status`

Updates an order's status. Creates a history entry, sets relevant timestamps, and broadcasts an SSE event.

**Request body:**
```json
{
  "status": "CONFIRMED"
}
```

**Valid statuses:** `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`

#### `GET /api/orders/by-payment-intent/[paymentIntentId]`

Looks up an order by its Stripe PaymentIntent ID. Used by the frontend after payment to find the created order.

### SSE Endpoints

#### `GET /api/sse/orders`

Server-Sent Events stream for the restaurant dashboard. Emits `order:new` and `order:updated` events for all orders.

#### `GET /api/sse/order/[orderId]`

Server-Sent Events stream filtered to a single order. Used by the customer tracking page.

### Admin APIs

All admin routes are under `/api/admin/` — no authentication enforced yet.

| Endpoint | Methods | Purpose |
|---|---|---|
| `/api/admin/categories` | GET, POST, PATCH | List, create, reorder categories |
| `/api/admin/categories/[id]` | PATCH, DELETE | Update or delete a category |
| `/api/admin/menu-items` | GET, POST | List and create menu items |
| `/api/admin/menu-items/[id]` | PATCH, DELETE | Update or archive a menu item |
| `/api/admin/modifier-groups` | POST | Create a modifier group with options |
| `/api/admin/modifier-groups/[id]` | PATCH, DELETE | Update or delete a modifier group |
| `/api/admin/settings` | GET, PATCH | Read and update restaurant settings |
| `/api/admin/settings/hours` | PUT | Replace all business hours |
| `/api/admin/promo-codes` | GET, POST | List and create promo codes |
| `/api/admin/promo-codes/[id]` | PATCH, DELETE | Update or delete a promo code |

---

## Database Schema

### Core Models

| Model | Purpose |
|---|---|
| `Category` | Menu categories (Appetizers, Mains, etc.) with sort order |
| `MenuItem` | Individual menu items with price (in cents), description, dietary tags, availability |
| `ModifierGroup` | Groups of options for an item (e.g., "Choose Size") with min/max selection |
| `Modifier` | Individual options within a group (e.g., "Large" with +$3.00) |
| `Order` | Customer orders with contact info, type, status, Stripe PaymentIntent ID, and financial totals |
| `OrderItem` | Snapshot of items at order time (name, price, modifiers frozen) |
| `OrderStatusHistory` | Audit trail of status changes with timestamps |
| `RestaurantSettings` | Singleton config: hours, delivery settings, tax rate |
| `BusinessHours` | Per-day operating hours |
| `PromoCode` | Discount codes with type, value, limits, and expiry |
| `OrderSequence` | Auto-incrementing sequence for human-readable order numbers |

### Key Design Decisions

- **All monetary values are stored as integers (cents)** to avoid floating-point precision errors
- **Order items are snapshots** — changing a menu item's price doesn't affect past orders
- **Server-side price validation** — the checkout API recalculates all totals from the database, never trusting client-submitted prices
- **Order numbers** use a PostgreSQL auto-increment sequence (via `OrderSequence`) to avoid race conditions
- **Payment-first order creation** — orders are only created in the database after Stripe confirms payment, preventing unpaid orders
- **Idempotent webhook processing** — duplicate `payment_intent.succeeded` events are safely ignored via unique `stripePaymentIntentId`

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout (dark theme, QueryProvider, Toaster)
│   ├── (customer)/                         # Customer portal route group
│   │   ├── layout.tsx                      # Header + cart drawer
│   │   ├── page.tsx                        # Menu page (Server Component)
│   │   ├── checkout/page.tsx               # Two-step checkout (details → Stripe payment)
│   │   └── order/
│   │       ├── [orderId]/page.tsx          # Real-time order tracking (SSE)
│   │       └── confirming/page.tsx         # 3D Secure redirect handler
│   ├── (restaurant)/                       # Restaurant portal route group
│   │   ├── layout.tsx                      # Top nav + mobile bottom tabs
│   │   ├── dashboard/page.tsx              # Live order board (SSE + audio alerts)
│   │   ├── menu/page.tsx                   # Menu management (categories, items, modifiers)
│   │   ├── orders/page.tsx                 # Order history
│   │   └── settings/page.tsx              # Settings, hours, delivery, promo codes
│   └── api/
│       ├── menu/route.ts                   # GET menu + restaurant settings
│       ├── checkout/route.ts               # POST legacy order creation (no payment)
│       ├── create-payment-intent/route.ts  # POST create Stripe PaymentIntent
│       ├── webhooks/stripe/route.ts        # POST Stripe webhook handler
│       ├── orders/
│       │   ├── route.ts                    # GET list orders
│       │   ├── [orderId]/
│       │   │   ├── route.ts               # GET order detail
│       │   │   └── status/route.ts         # PATCH update status + SSE broadcast
│       │   └── by-payment-intent/
│       │       └── [paymentIntentId]/route.ts  # GET order by PaymentIntent
│       ├── sse/
│       │   ├── orders/route.ts             # SSE stream for dashboard
│       │   └── order/[orderId]/route.ts    # SSE stream for order tracking
│       └── admin/
│           ├── categories/                 # Category CRUD
│           ├── menu-items/                 # Menu item CRUD
│           ├── modifier-groups/            # Modifier group CRUD
│           ├── settings/                   # Restaurant settings + hours
│           └── promo-codes/                # Promo code CRUD
├── components/
│   ├── customer/                           # Customer portal components
│   │   ├── customer-header.tsx
│   │   ├── menu-hero.tsx
│   │   ├── category-nav.tsx
│   │   ├── menu-section.tsx
│   │   ├── menu-item-card.tsx
│   │   ├── menu-page-client.tsx
│   │   ├── item-customization-modal.tsx
│   │   ├── cart-drawer.tsx
│   │   └── stripe-payment-form.tsx         # Stripe Payment Element wrapper
│   ├── restaurant/
│   │   ├── order-board.tsx                 # Kanban board layout
│   │   └── order-card.tsx                  # Individual order card
│   ├── providers/
│   │   └── query-provider.tsx
│   └── ui/                                # shadcn/ui components
├── hooks/
│   ├── use-cart-drawer.ts                  # Cart drawer open/close state
│   ├── use-order-sse.ts                    # Dashboard SSE (new order alerts, query invalidation)
│   └── use-order-status.ts                 # Customer tracking SSE (live status updates)
├── lib/
│   ├── prisma.ts                           # Prisma client singleton
│   ├── stripe.ts                           # Stripe server client singleton
│   ├── sse.ts                              # SSE event emitter (in-process pub/sub)
│   ├── pricing.ts                          # Monetary calculations (cents)
│   ├── order-number.ts                     # Sequential order number generator
│   └── utils.ts                            # cn() utility
├── stores/
│   └── cart.ts                             # Zustand cart store
└── types/
    └── index.ts                            # Shared TypeScript interfaces
```

---

## Seed Data

The seed script (`prisma/seed.ts`) creates:

- **Restaurant**: "The Kitchen" with 8% tax rate, $3.99 delivery fee, $15 delivery minimum
- **Business hours**: 11am-10pm daily, closed Mondays
- **5 categories**: Appetizers, Main Course, Sides, Drinks, Desserts
- **15 menu items** with descriptions, prices, and dietary tags
- **Modifiers** on select items: burger size/extras, pizza size, wing sauce, coffee milk choice
- **Promo code**: `WELCOME10` — 10% off orders over $20

---

## Design

- **Theme**: Dark & modern with emerald green accents
- **Dark mode**: Enabled by default (`<html class="dark">`)
- **Mobile-first**: Responsive layout with bottom navigation on the restaurant portal
- **Animations**: Framer Motion for menu card interactions and hero section
- **Glass-morphism**: Translucent header/nav bars with backdrop blur
- **Stripe theming**: Payment Element styled to match the dark theme with emerald accents
