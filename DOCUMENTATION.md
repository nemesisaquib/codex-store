# CODEX Store — Full Documentation
> Design & Development by Aquib

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Database](#4-database)
5. [Backend — API Routes](#5-backend--api-routes)
6. [Frontend — Store Pages](#6-frontend--store-pages)
7. [Frontend — Admin Panel](#7-frontend--admin-panel)
8. [Authentication](#8-authentication)
9. [Image Guidelines](#9-image-guidelines)
10. [Performance Optimizations](#10-performance-optimizations)
11. [Environment & Deployment](#11-environment--deployment)
12. [Common Tasks (How-To)](#12-common-tasks-how-to)

---

## 1. Project Overview

CODEX is a full-stack eCommerce platform for a global fashion brand. Built with Next.js 15 App Router, it includes:

- **Customer store** — browsing, cart, checkout, account
- **Admin panel** — products, orders, customers, inventory, analytics, CRM, SEO, settings
- **SQLite database** — persistent, no external DB required
- **Real auth** — customer sessions + admin sessions (separate httpOnly cookies)
- **Email** — Nodemailer SMTP for transactional + campaign emails

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@codex.com | admin123 |
| Demo Customer | jane.doe@example.com | (any — create new account) |

### Dev Server
```bash
cd codex-store
npm install
npm run dev        # → http://localhost:3004
```

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite via better-sqlite3 |
| Auth | SHA-256 hash + httpOnly session cookies |
| Email | Nodemailer (SMTP) |
| Icons | Lucide React |
| Fonts | next/font/google (Playfair Display, DM Sans, JetBrains Mono) |
| UI Components | shadcn/ui + Radix UI |

---

## 3. Project Structure

```
codex-store/
├── app/
│   ├── layout.tsx                  # Root layout — fonts, metadata, viewport
│   ├── globals.css                 # Global styles, CSS tokens
│   ├── (store)/                    # Customer-facing store (has Navbar/Footer)
│   │   ├── page.tsx                # Homepage — hero slider, featured products
│   │   ├── category/[slug]/        # Category listing with filters
│   │   ├── product/[slug]/         # Product detail page (PDP)
│   │   ├── sale/                   # Sale page
│   │   ├── new-arrivals/           # New arrivals
│   │   ├── search/                 # Search results
│   │   ├── cart/                   # Cart (redirects to aside)
│   │   ├── checkout/               # 3-step checkout form
│   │   │   └── success/            # Order confirmation
│   │   └── account/                # Customer account (requires login)
│   │       ├── page.tsx            # Dashboard — stats, recent orders
│   │       ├── orders/             # Order history + detail
│   │       ├── wishlist/           # Saved products
│   │       ├── addresses/          # Saved addresses
│   │       └── settings/           # Profile + password
│   ├── auth/                       # Customer auth pages
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── admin/                      # Admin panel (protected by middleware)
│   │   ├── login/                  # Admin login
│   │   ├── layout.tsx              # Sidebar + topbar with notifications
│   │   ├── page.tsx                # Dashboard — KPIs, charts
│   │   ├── products/               # Product CRUD
│   │   ├── orders/                 # Order management
│   │   ├── customers/              # Customer CRM
│   │   ├── inventory/              # Stock levels
│   │   ├── promotions/             # Promo codes
│   │   ├── analytics/              # Charts + metrics
│   │   ├── seo/                    # SEO manager
│   │   ├── crm/                    # Segments + email campaigns
│   │   └── settings/               # SMTP, general, advanced settings
│   └── api/                        # All API routes (see §5)
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx              # Sticky nav + cart aside trigger
│   │   └── Footer.tsx              # Footer with newsletter
│   └── store/
│       ├── ProductCard.tsx         # Product card + Quick Add + Quick View
│       ├── QuickView.tsx           # Quick view modal
│       ├── CartAside.tsx           # Sliding cart sidebar
│       ├── HeroBanner.tsx          # Auto-rotating hero slider
│       ├── FeaturedProducts.tsx    # Server component — fetches from API
│       └── NewArrivalsCarousel.tsx # Client carousel
├── lib/
│   ├── db.ts                       # SQLite setup, schema, seed data
│   ├── email.ts                    # Nodemailer SMTP + branded template
│   └── seo.ts                      # Metadata helpers (getPageMetadata)
├── middleware.ts                   # Protects /admin/* routes
├── next.config.ts                  # Image optimization, headers, caching
└── data/
    └── codex.db                    # SQLite database file (auto-created)
```

---

## 4. Database

Database auto-creates at `data/codex.db` on first run.

### Tables

| Table | Purpose |
|-------|---------|
| `products` | Product catalog (name, price, stock, images, SEO) |
| `orders` | Customer orders (items JSON, shipping, status) |
| `customers` | Registered customers (email, name, tier, auth) |
| `sessions` | Customer login sessions (token, expiry) |
| `cart` | Persistent cart per customer (items JSON) |
| `wishlist` | Customer → product links |
| `addresses` | Saved shipping addresses |
| `reviews` | Product reviews (pending/approved) |
| `newsletter` | Newsletter subscribers |
| `promotions` | Promo codes (percentage or fixed $ discount) |
| `seo_pages` | Per-page SEO (title, description, OG tags) |
| `settings` | All admin settings (key-value + group) |
| `admin_users` | Admin accounts (email, password hash, role) |
| `activity_log` | Admin action audit trail |

### How DB Initializes
```
getDb() called → opens SQLite file →
  initSchema() creates all tables →
  migrate() adds missing columns to existing tables →
  seed() inserts default data if tables are empty
```

### Accessing DB in Code
```typescript
import { getDb } from "@/lib/db";

const db = getDb();
const products = db.prepare("SELECT * FROM products WHERE status='active'").all();
const product = db.prepare("SELECT * FROM products WHERE slug=?").get(slug);
db.prepare("UPDATE products SET stock=? WHERE id=?").run(newStock, id);
```

The `getDb()` call returns a singleton — same connection reused across requests (WAL mode).

---

## 5. Backend — API Routes

All routes are under `app/api/`. They use SQLite directly via `getDb()`.

### Products
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/products` | List products. Params: `q`, `category`, `sale`, `is_new`, `sort`, `limit` |
| POST | `/api/products` | Create product |
| GET | `/api/products/[slug]` | Get single product by slug or order number |
| PATCH | `/api/products/[slug]` | Update product |
| DELETE | `/api/products/[slug]` | Soft-delete (sets status=deleted) |

### Orders
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/orders` | List orders. Params: `status`, `email`, `limit` |
| POST | `/api/orders` | Create order (from checkout) |
| GET | `/api/orders/[id]` | Get order detail by ID or order number |
| PATCH | `/api/orders/[id]` | Update status, tracking number |

### Customers
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/customers` | List customers. Params: `search`, `tier` |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/[id]` | Get customer + order history |
| PATCH | `/api/customers/[id]` | Update tier, status, notes |

### Auth — Admin
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/admin` | Login — sets `admin_session` cookie |
| DELETE | `/api/auth/admin` | Logout — clears cookie |
| GET | `/api/auth/admin` | Get current session |

### Auth — Customer
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/customer` | `action: "login"` or `"register"` |
| GET | `/api/auth/customer` | Get current session |
| DELETE | `/api/auth/customer` | Logout |

### Cart
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/cart` | Get current customer's cart items |
| POST | `/api/cart` | Save full cart (replaces existing) |
| DELETE | `/api/cart` | Clear cart (after checkout) |

### Wishlist
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/wishlist` | Get wishlist with full product data |
| POST | `/api/wishlist` | Add product (`{ productId }`) |
| DELETE | `/api/wishlist` | Remove product (`{ productId }`) |

### Addresses
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/addresses` | Get customer's saved addresses |
| POST | `/api/addresses` | Create address |
| PATCH | `/api/addresses/[id]` | Update address |
| DELETE | `/api/addresses/[id]` | Delete address |

### Profile
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/customer/profile` | Get customer profile |
| PATCH | `/api/customer/profile` | Update name, phone, country, password |

### Promotions
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/promotions` | List all. `?code=SUMMER10` to validate single |
| POST | `/api/promotions` | Create promo code |
| PATCH | `/api/promotions/[id]` | Toggle active, update |
| DELETE | `/api/promotions/[id]` | Delete |

### Settings
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/settings` | All settings grouped + flat |
| POST | `/api/settings` | Bulk save `{ key: value, ... }` |

### Email
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/email/test` | Check if SMTP is configured |
| POST | `/api/email/test` | Send test email `{ to }` |
| POST | `/api/email/send` | Bulk send `{ recipients, subject, body }` |

### Admin-Only
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/stats` | Dashboard KPIs from DB |
| GET | `/api/admin/notifications` | Orders, low stock, new customers, newsletter |
| GET | `/api/admin/crm` | Customer segments + newsletter subs |
| GET | `/api/inventory` | Products with stock + low-stock alerts |
| POST | `/api/inventory` | Bulk update stock |
| GET | `/api/seo` | SEO pages + products |
| POST | `/api/seo` | Update page or product SEO |
| GET | `/api/reviews` | Product reviews (`?productId=`) |
| POST | `/api/reviews` | Submit review (requires customer session) |

---

## 6. Frontend — Store Pages

### Homepage (`/`)
- **Hero slider** — 5 slides, auto-rotates every 5.5s, prev/next controls
- **Category strip** — Women / Men / Kids / Accessories
- **Featured products** — server component, fetches from `/api/products`
- **New arrivals carousel** — client carousel, `?sort=newest`
- **Brand story section**
- **Newsletter signup** — POSTs to `/api/newsletter`

### Product Listing (`/category/[slug]`)
- Sidebar filters (category, price range, sort)
- Grid/list toggle
- Infinite scroll ready
- Each card has Quick Add + Quick View

### Product Detail (`/product/[slug]`)
- 4-image carousel
- Size selector (XS–XXL)
- Color swatches
- Add to bag (opens cart aside)
- Add to wishlist
- Reviews section
- Related products

### Cart Aside
- Opens when clicking bag icon in navbar
- Slides from right (w-96 on desktop, full-width mobile)
- Real-time qty update → auto-saves to DB after 500ms
- Promo code validation (checks `/api/promotions?code=`)
- Free shipping threshold progress bar
- Checkout button → `/checkout`

### Checkout (`/checkout`)
**Step 1 — Shipping Address**
- First/last name, email, address, city, state, zip, country
- Pre-fills with logged-in customer data

**Step 2 — Shipping Method**
- Standard (FREE) / Express ($12.95) / Overnight ($24.95)

**Step 3 — Payment**
- Card number, expiry, CVV (UI only — no real payment processor)
- Place Order → `POST /api/orders` → clears cart → redirects to `/checkout/success?order=COD-XXXX`

### Checkout Success (`/checkout/success`)
- Reads `?order=` param → fetches real order from DB
- Shows order number, item list, total, shipping method
- Status timeline (confirmed → processing → shipped → delivered)

### Customer Account (`/account/*`)

All account pages check customer session via `/api/auth/customer`.

| Page | Data Source |
|------|------------|
| Dashboard | `/api/orders?email=` |
| Orders | `/api/orders?email=` |
| Order Detail | `/api/orders/[orderNumber]` |
| Wishlist | `/api/wishlist` |
| Addresses | `/api/addresses` |
| Settings | `/api/customer/profile` |

---

## 7. Frontend — Admin Panel

All admin routes are under `/admin/`. Protected by `middleware.ts` — redirects to `/admin/login` if no valid session cookie.

### Dashboard (`/admin`)
- 4 KPI cards: revenue, orders, customers, low stock
- Revenue bar chart (last 30 days)
- Order status donut chart
- Top products table with images
- All data from `/api/admin/stats`

### Notifications (Bell icon)
- Polls `/api/admin/notifications` every 30 seconds
- Shows: new orders, low/out-of-stock products, new customers, newsletter signups
- Color-coded by type
- Unread badge count
- Mark all read

### Products (`/admin/products`)
- Table with image preview, price, stock, status
- **Add/Edit modal** with:
  - Product name, brand, description
  - Image URL + **image guidelines panel** (see §9)
  - Category, status, price, compare price
  - Stock, badge, color swatch
- Soft delete (sets `status=deleted`)

### Orders (`/admin/orders`)
- Full order list with search + status filter
- Inline status dropdown (pending → confirmed → processing → shipped → delivered)
- Slide-over detail modal with tracking number field

### Customers (`/admin/customers`)
- Searchable table with tier filter
- Detail modal: tier change (new/regular/VIP), order history, notes

### Inventory (`/admin/inventory`)
- Stock level editor for all products
- Low stock (≤10) and out-of-stock (0) alerts highlighted
- Bulk save

### Promotions (`/admin/promotions`)
- Create promo codes (percentage % or fixed $)
- Set min order, max uses, valid dates
- Toggle active/inactive
- Copy code to clipboard
- Usage bar

### Analytics (`/admin/analytics`)
- Revenue trend
- Order status breakdown
- Category breakdown
- Device/traffic pie
- Top products by revenue

### SEO Manager (`/admin/seo`)
- **Pages tab** — edit title, description, OG tags per page
  - Live char counters (title: 60, desc: 160 recommended)
  - Changes reflect immediately in actual HTML `<meta>` tags
- **Products tab** — per-product SEO score, meta title/description

### CRM (`/admin/crm`)
- Customer segments: VIP, New, At-Risk
- Newsletter subscriber list
- Email campaign composer (send to segment via `/api/email/send`)

### Settings (`/admin/settings`)
| Group | Settings |
|-------|---------|
| General | Store name, currency, support email, timezone |
| Shipping | Free shipping threshold, default rates |
| Email/SMTP | Host, port, user, password, from name, from email, SSL |
| SEO | Meta defaults, robots, sitemap |
| Integrations | Analytics IDs |
| Advanced | Maintenance mode, debug, cache TTL |

**SMTP Test Panel** — after saving SMTP settings, enter recipient email and click "Send Test" to verify delivery.

---

## 8. Authentication

### Admin Auth Flow
```
POST /api/auth/admin { email, password }
→ Checks admin_users table (SHA-256 hash)
→ Sets httpOnly cookie: admin_session=<uuid>
→ middleware.ts reads cookie on every /admin/* request
→ Invalid/missing → redirect /admin/login
→ DELETE /api/auth/admin → clears cookie
```

### Customer Auth Flow
```
POST /api/auth/customer { action: "register", email, password, firstName, lastName }
→ Hashes password with SHA-256
→ Inserts into customers table
→ Creates session token (UUID) in sessions table (30-day expiry)
→ Sets httpOnly cookie: customer_session=<token>

POST /api/auth/customer { action: "login", email, password }
→ Looks up customer by email
→ Compares SHA-256(password) == stored hash
→ Creates new session token
→ Sets cookie

GET /api/auth/customer
→ Reads customer_session cookie
→ Joins sessions → customers
→ Returns { customer: { id, email, first_name, last_name } } or { customer: null }
```

---

## 9. Image Guidelines

### Recommended Formats (in order of preference)

| Format | Size Reduction | Browser Support | Use For |
|--------|---------------|-----------------|---------|
| **AVIF** | Up to 70% vs JPEG | Chrome, Firefox, Safari 16+ | Best: modern browsers |
| **WebP** | Up to 40% vs JPEG | All modern browsers | Good: universal support |
| **JPEG** | Baseline | Universal | Avoid for product cards |
| **PNG** | — | Universal | Only for images needing transparency |

### Dimensions

| Use Case | Width × Height | Aspect Ratio | Max File Size |
|----------|---------------|--------------|---------------|
| Product card | 800 × 1000 px | 4:5 portrait | 200 KB |
| Product hero (PDP) | 1200 × 1500 px | 4:5 portrait | 400 KB |
| Category banner | 1920 × 600 px | 16:5 landscape | 300 KB |
| Hero slide | 1920 × 1080 px | 16:9 | 500 KB |
| Brand/about | 1200 × 800 px | 3:2 | 300 KB |

### Free Tools for Admins

| Tool | Use | URL |
|------|-----|-----|
| **Squoosh** | Compress + convert to WebP/AVIF (browser) | squoosh.app |
| **Cloudinary** | Free CDN + auto-optimize + resize | cloudinary.com |
| **ImageKit** | Free CDN with URL transforms | imagekit.io |
| **TinyPNG** | Simple compression | tinypng.com |

### Cloudinary URL Transform Example
```
https://res.cloudinary.com/your-cloud/image/upload/w_800,h_1000,c_fill,f_auto,q_auto/product-name.jpg
```
- `w_800,h_1000` — resize
- `c_fill` — crop to fill
- `f_auto` — auto-select AVIF/WebP/JPEG
- `q_auto` — auto quality

### File Naming (SEO Tip)
```
✅ black-oversized-linen-blazer-front.webp
✅ womens-silk-midi-dress-burgundy.avif
❌ IMG_20240312_154312.jpg
❌ product-copy(2).jpeg
```

---

## 10. Performance Optimizations

### What's Implemented

#### Build-Level
- **Tree-shaking** — `optimizePackageImports` for lucide-react, Radix UI
- **Console removal** — `removeConsole` in production builds
- **Font optimization** — `next/font/google` with `display: swap`, preload only critical weights
- **Image formats** — AVIF → WebP fallback via `next/image`

#### Caching Headers
- Static assets (`/_next/static/*`) — `immutable, max-age=1 year`
- Optimized images — `max-age=30 days + stale-while-revalidate`
- API routes — `no-store` (always fresh)

#### Runtime
- **CSS containment** — `.product-card { contain: layout paint }` — browser skips reflow for cards
- **Lazy images** — `loading="lazy"` on product images below fold
- **Touch optimization** — `touch-action: manipulation` removes 300ms tap delay on mobile
- **Reduced motion** — `scroll-behavior: smooth` only when no motion preference
- **Debounced cart save** — 500ms debounce prevents excessive API calls
- **Singleton DB** — one SQLite connection, WAL mode, reused across requests

#### Component Level
- **React.memo** on QuickView — prevents re-renders
- **will-change: transform** on cart aside and modals
- **Lazy font** — JetBrains Mono loads after critical fonts (not preloaded)

### Performance Targets (Lighthouse)

| Metric | Target | Mobile | Desktop |
|--------|--------|--------|---------|
| LCP | < 2.5s | ✓ (no external images) | ✓ |
| FID/INP | < 100ms | ✓ | ✓ |
| CLS | < 0.1 | ✓ (aspect ratio set) | ✓ |
| TTFB | < 600ms | ✓ (SQLite, fast) | ✓ |

---

## 11. Environment & Deployment

### Dev
```bash
npm run dev      # Turbopack, hot reload, port 3004
```

### Build (Production)
```bash
npm run build    # Compile + optimize
npm start        # Run production server
```

### Database
No configuration needed. SQLite file auto-creates at `data/codex.db`.

For production, point `DB_PATH` environment variable to persistent storage (not ephemeral filesystem).

### Environment Variables (Optional)
```env
# Optional overrides
DB_PATH=/data/codex.db         # Custom DB path
NODE_ENV=production            # Enables console removal
NEXT_PUBLIC_SITE_URL=https://codex.com
```

### SMTP Email Setup (in Admin)
1. Go to `/admin/settings` → **Email/SMTP** tab
2. Enter your SMTP credentials (Gmail, SendGrid, Resend, etc.)
3. Click **Save Settings**
4. Enter a test email → click **Send Test**
5. Check inbox

**Gmail App Password** (recommended):
- Google Account → Security → 2-Step Verification → App Passwords
- Create "Mail" app password → use that as `smtp_pass`
- Host: `smtp.gmail.com`, Port: `587`, SSL: off (STARTTLS)

---

## 12. Common Tasks (How-To)

### Add a Product
1. Admin → Products → **Add Product**
2. Fill name, brand, category, price
3. Paste a WebP image URL (see §9 for tools)
4. Set stock, status = Active
5. Save

### Create a Promo Code
1. Admin → Promotions → **Create Code**
2. Enter code (e.g. `SUMMER20`), type (%), value (20), min order, dates
3. Toggle active → copy code → share

### Change an Order Status
1. Admin → Orders → find order → dropdown → select new status
2. For shipped: enter tracking number in the slide-over

### Edit SEO for a Page
1. Admin → SEO → Pages tab → find page → edit title/description
2. Changes reflect live in HTML `<meta>` tags immediately

### Send Email Campaign
1. Admin → CRM → select segment (VIP, New, At-Risk) or Newsletter
2. Compose subject + body
3. Send — uses SMTP config from Settings

### Reset Admin Password
```sql
-- Run in SQLite browser or via Node script
UPDATE admin_users SET password = '<sha256-of-new-password>' WHERE email='admin@codex.com';
```

SHA-256 hash:
```bash
node -e "const c=require('crypto');console.log(c.createHash('sha256').update('newpassword').digest('hex'))"
```

### Add New Admin Settings Group
1. In `lib/db.ts` — add keys to `seedSettings()` with `group_name`
2. In `app/admin/settings/page.tsx` — add to `GROUPS` array and `FIELD_LABELS`
3. New group appears automatically in Settings sidebar

### Debug API Response
All API routes return JSON. Test in browser or curl:
```bash
curl http://localhost:3004/api/products?limit=5
curl http://localhost:3004/api/admin/stats
curl http://localhost:3004/api/settings
```

---

*CODEX Store — Built with Next.js 15 · SQLite · Tailwind CSS v4*  
*Design & Development by Aquib ©2026*
