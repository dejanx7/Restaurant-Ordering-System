# Restaurant Order System

A mobile-responsive web application for a single restaurant that supports Pick-up and Delivery orders. Features two distinct portals: a **Customer Portal** for browsing menus and placing orders, and a **Restaurant Portal** for managing incoming orders in real-time.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma 7 ORM |
| Server State | TanStack Query v5 |
| Client State | Zustand (cart persistence via localStorage) |
| UI | Tailwind CSS v4 + shadcn/ui + Framer Motion |
| Validation | Zod |
| Payments | Stripe (planned) |
| Icons | Lucide React |

## Prerequisites

- **Node.js** v20+
- **npm** v9+
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

### 6. Start the development server

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
| `http://localhost:3000/checkout` | Customer Portal — Checkout page |
| `http://localhost:3000/order/[orderId]` | Customer Portal — Order tracking |
| `http://localhost:3000/dashboard` | Restaurant Portal — Live order board |
| `http://localhost:3000/menu` | Restaurant Portal — Menu management (placeholder) |
| `http://localhost:3000/orders` | Restaurant Portal — Order history (placeholder) |
| `http://localhost:3000/settings` | Restaurant Portal — Settings (placeholder) |

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
6. Click **"Place Order"** to submit

#### Tracking Your Order

After placing an order, you're redirected to the **order tracking page** which shows:
- A **status tracker** with 5 steps: Order Received > Confirmed > Preparing > Ready > Completed
- Your **order details** with itemized breakdown
- The page **auto-refreshes every 5 seconds** to show status updates from the restaurant

### Restaurant Portal

#### Live Order Board

1. Open **http://localhost:3000/dashboard** to see the order management dashboard
2. Orders are displayed in a **Kanban board** with 4 columns:
   - **New Orders** (yellow) — freshly placed orders awaiting acceptance
   - **Confirmed** (blue) — accepted orders
   - **Preparing** (orange) — orders being made in the kitchen
   - **Ready** (green) — orders ready for pickup or delivery
3. Each order card shows:
   - Order number and customer name
   - Order type badge (Pickup or Delivery)
   - Item list with quantities and prices
   - Elapsed time since the order was placed
   - Total amount
4. Click the **action button** on each card to advance it to the next status:
   - "Accept" moves New > Confirmed
   - "Start Preparing" moves Confirmed > Preparing
   - "Mark Ready" moves Preparing > Ready
   - "Complete" moves Ready > Completed (removes from board)
5. The board **auto-refreshes every 10 seconds** to show new incoming orders

#### Navigation

Use the top navigation bar (desktop) or bottom tab bar (mobile) to switch between:
- **Orders** — Live order board
- **Menu** — Menu management (coming soon)
- **History** — Past orders (coming soon)
- **Settings** — Restaurant settings (coming soon)

---

## API Reference

### Menu

#### `GET /api/menu`

Returns all active menu categories with items and modifiers, plus restaurant settings.

**Response:** `{ categories: [...], restaurant: { name, isOpen, taxRate, ... } }`

### Orders

#### `POST /api/checkout`

Creates a new order. Validates items against the database, recalculates all prices server-side, and checks restaurant open status.

**Request body:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "555-0123",
  "orderType": "PICKUP",
  "deliveryAddress": null,
  "specialInstructions": "No onions please",
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

**Response:** `{ orderId, orderNumber, totalAmount }`

#### `GET /api/orders?active=true`

Returns orders filtered by status. With `active=true`, returns only orders with status PENDING, CONFIRMED, PREPARING, or READY.

#### `GET /api/orders/[orderId]`

Returns full details for a single order including items, totals, and status.

#### `PATCH /api/orders/[orderId]/status`

Updates an order's status. Creates a history entry and sets relevant timestamps (acceptedAt, preparedAt, completedAt).

**Request body:**
```json
{
  "status": "CONFIRMED"
}
```

**Valid statuses:** `PENDING`, `CONFIRMED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`

---

## Database Schema

### Core Models

| Model | Purpose |
|---|---|
| `Category` | Menu categories (Appetizers, Mains, etc.) with sort order |
| `MenuItem` | Individual menu items with price (in cents), description, dietary tags, availability |
| `ModifierGroup` | Groups of options for an item (e.g., "Choose Size") with min/max selection |
| `Modifier` | Individual options within a group (e.g., "Large" with +$3.00) |
| `Order` | Customer orders with contact info, type, status, and financial totals |
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

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                          # Root layout (dark theme, QueryProvider, Toaster)
│   ├── (customer)/                         # Customer portal route group
│   │   ├── layout.tsx                      # Header + cart drawer
│   │   ├── page.tsx                        # Menu page (Server Component)
│   │   ├── checkout/page.tsx               # Checkout form
│   │   └── order/[orderId]/page.tsx        # Order tracking
│   ├── (restaurant)/                       # Restaurant portal route group
│   │   ├── layout.tsx                      # Sidebar/bottom nav
│   │   ├── dashboard/page.tsx              # Live order board
│   │   ├── menu/page.tsx                   # Menu management (placeholder)
│   │   ├── orders/page.tsx                 # Order history (placeholder)
│   │   └── settings/page.tsx               # Settings (placeholder)
│   └── api/
│       ├── menu/route.ts                   # GET menu + restaurant settings
│       ├── checkout/route.ts               # POST create order
│       └── orders/
│           ├── route.ts                    # GET list orders
│           └── [orderId]/
│               ├── route.ts               # GET order detail
│               └── status/route.ts         # PATCH update status
├── components/
│   ├── customer/                           # Customer portal components
│   │   ├── customer-header.tsx             # Header with cart button
│   │   ├── menu-hero.tsx                   # Hero banner with restaurant info
│   │   ├── category-nav.tsx                # Sticky category tabs
│   │   ├── menu-section.tsx                # Category section with items
│   │   ├── menu-item-card.tsx              # Individual item card
│   │   ├── menu-page-client.tsx            # Client wrapper for menu page
│   │   ├── item-customization-modal.tsx    # Modifier selection dialog
│   │   └── cart-drawer.tsx                 # Slide-out cart
│   ├── restaurant/                         # Restaurant portal components
│   │   ├── order-board.tsx                 # Kanban board layout
│   │   └── order-card.tsx                  # Individual order card
│   ├── providers/
│   │   └── query-provider.tsx              # TanStack Query provider
│   └── ui/                                # shadcn/ui components
├── hooks/
│   └── use-cart-drawer.ts                  # Cart drawer open/close state
├── lib/
│   ├── prisma.ts                           # Prisma client singleton
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
