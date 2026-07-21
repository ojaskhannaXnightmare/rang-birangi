# 🚀 RANG BIRANGI — Complete Production E-Commerce Platform

A fully functional, dark-luxury themed, single-vendor fashion e-commerce platform built end-to-end with Next.js 16, TypeScript, Tailwind CSS 4, Prisma ORM, and MongoDB driver.

## 📦 What's Inside

```
rang-birangi-source.zip
├── src/
│   ├── app/
│   │   ├── api/                    # 40+ API routes
│   │   │   ├── auth/              # login, register, me, logout
│   │   │   ├── products/          # list, [slug] detail
│   │   │   ├── categories/
│   │   │   ├── cart/              # GET, POST, PATCH, DELETE
│   │   │   ├── wishlist/
│   │   │   ├── orders/            # list, [id] with admin update
│   │   │   ├── checkout/          # atomic order creation + stock deduction
│   │   │   ├── reviews/
│   │   │   ├── addresses/
│   │   │   ├── banners/
│   │   │   ├── homepage/
│   │   │   ├── settings/
│   │   │   ├── health/            # DB + service status check
│   │   │   └── admin/             # admin-only routes
│   │   │       ├── dashboard/     # revenue, charts, stats
│   │   │       ├── products/      # CRUD with [id] updates
│   │   │       ├── orders/
│   │   │       ├── customers/
│   │   │       ├── reviews/       # approve/reject/reply
│   │   │       ├── banners/       # CRUD
│   │   │       ├── homepage/      # toggle/reorder sections
│   │   │       ├── settings/
│   │   │       ├── activity/      # audit logs
│   │   │       └── upload/        # image upload (sharp → webp)
│   │   ├── layout.tsx
│   │   ├── page.tsx               # main SPA with view switching
│   │   └── globals.css            # dark luxury theme
│   ├── components/
│   │   ├── store/                 # customer-facing
│   │   │   ├── navbar.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── storefront-home.tsx
│   │   │   ├── hero-carousel.tsx
│   │   │   ├── category-card.tsx
│   │   │   ├── product-card.tsx
│   │   │   ├── shop-view.tsx      # filters, sort, grid
│   │   │   ├── product-detail-view.tsx
│   │   │   ├── cart-drawer.tsx
│   │   │   ├── checkout-view.tsx  # 3-step (address/payment/review)
│   │   │   ├── order-success-view.tsx
│   │   │   ├── auth-modal.tsx
│   │   │   └── customer-dashboard.tsx
│   │   ├── admin/                 # enterprise admin panel
│   │   │   ├── admin-panel.tsx    # sidebar layout
│   │   │   ├── dashboard.tsx      # charts (recharts)
│   │   │   ├── products.tsx       # CRUD + bulk delete + image upload
│   │   │   ├── image-upload.tsx   # drag/drop multi-upload
│   │   │   ├── orders.tsx
│   │   │   ├── customers.tsx
│   │   │   ├── reviews.tsx
│   │   │   ├── homepage.tsx       # CMS builder
│   │   │   ├── settings.tsx
│   │   │   └── activity.tsx
│   │   └── ui/                    # shadcn/ui components
│   ├── lib/
│   │   ├── db.ts                  # Prisma client
│   │   ├── auth.ts                # session + password hashing
│   │   ├── helpers.ts             # formatters, DTOs
│   │   └── mongodb.ts             # MongoDB driver connection
│   ├── stores/                    # Zustand stores
│   │   ├── ui-store.ts            # view routing, modals
│   │   ├── auth-store.ts
│   │   ├── cart-store.ts
│   │   └── wishlist-store.ts
│   └── hooks/
│       ├── use-toast.ts
│       └── use-mobile.ts
├── prisma/
│   └── schema.prisma              # 17 models
├── scripts/
│   └── seed.ts                    # 4 categories, 16 products, 8 orders, etc.
├── public/
│   ├── logo.svg
│   ├── robots.txt
│   └── uploads/                   # uploaded product images
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json
├── eslint.config.mjs
├── Caddyfile
└── .env.example                   # MongoDB + all integrations
```

## 🎨 Brand

- **Name:** RANG BIRANGI
- **Tagline:** Handcrafted Indian Elegance
- **Categories:** Handmade Bangles, Earrings, Sarees, Kurtis
- **Theme:** Dark luxury
  - Background: `#0F0F10`
  - Cards: `#18181B`
  - Primary (deep maroon): `#7B1E3A`
  - Luxury Gold: `#D4AF37`
  - Text: `#FFFFFF`
  - Muted: `#A1A1AA`
  - Borders: `#27272A`

## 🔑 Login Credentials

- **Admin:** `admin@rangbirangi.com` / `admin123`
- **Customer:** `customer@demo.com` / `demo123`

(No demo buttons in UI — credentials must be typed manually.)

## 🛠️ Setup Instructions

### 1. Install dependencies

```bash
bun install
# or
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
- **For SQLite (default, no setup needed):** Keep `DATABASE_URL="file:./db/custom.db"` as-is
- **For MongoDB Atlas (production):** Set `MONGODB_URI="mongodb+srv://..."` and `MONGODB_DB="RangBirangi"`

### 3. Initialize database

```bash
# Push schema to SQLite
bun run db:push

# Seed sample data (4 categories, 16 products, 8 orders, reviews, banners)
bun run scripts/seed.ts
```

### 4. Run dev server

```bash
bun run dev
# or
npm run dev
```

Visit `http://localhost:3000`

### 5. Production build

```bash
bun run build
bun run start
```

## 🗄️ Database Options

### Option A: SQLite (default, zero-config)
- Used automatically if `MONGODB_URI` is not set
- Stored at `db/custom.db`
- Perfect for local development and testing

### Option B: MongoDB Atlas (production)
1. Create free cluster at https://cloud.mongodb.com
2. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/RangBirangi`
3. Set in `.env`:
   ```
   MONGODB_URI="mongodb+srv://..."
   MONGODB_DB="RangBirangi"
   ```
4. Restart — `/api/health` will show "MongoDB Atlas · RangBirangi"

The `src/lib/mongodb.ts` utility provides:
- `connectMongo()` — cached connection
- `getMongoDB()` — get Db instance
- `checkMongoConnection()` — health check
- `ensureMongoIndexes()` — creates all required indexes
- `COLLECTIONS` — 17 collection names matching Prisma schema

## 📤 Image Upload

- **API:** `POST /api/admin/upload` (multipart/form-data, admin-only)
- **Storage:** `/public/uploads/{timestamp}-{random}.webp`
- **Processing:** `sharp` resizes to max 1200×1200, converts to WEBP (quality 82)
- **Allowed:** PNG, JPG, WEBP, GIF (max 10MB each)
- **Delete:** `DELETE /api/admin/upload?filename=xxx`

To use Cloudinary instead, replace the upload logic in `src/app/api/admin/upload/route.ts` with:
```ts
import { v2 as cloudinary } from 'cloudinary'
cloudinary.config(JSON.parse(process.env.CLOUDINARY_CONFIG!))
const result = await cloudinary.uploader.upload(file, { folder: 'rangbirangi/products' })
```

## 🏢 Admin Panel Features

| Module | Features |
|--------|----------|
| **Dashboard** | Revenue/orders/customers/AOV stats, 7-day sales chart, category performance, order status pie, low-stock alerts, best sellers, recent orders, recent activity, DB health banner |
| **Products** | Full CRUD, search, category filter, bulk delete, publish toggle, image upload (drag/drop), all product flags |
| **Orders** | Search/filter, detail view, status workflow (9 statuses), tracking number, shipment info |
| **Customers** | Grid view with order count, total spent, last order |
| **Reviews** | Approve/Reject/Reply workflow |
| **Homepage Builder** | Toggle sections on/off, reorder, inline title edit — instantly reflects on storefront |
| **Activity Log** | All admin actions tracked |
| **Settings** | Brand info, payment, shipping, social links |

## 🛒 Customer Features

- Dynamic CMS-controlled homepage (hero, categories, trending, new arrivals, flash sale, featured, handmade, best sellers, reviews, newsletter)
- Product listing with filters (search, price, colors) and sort (newest, popular, price, rating)
- Product detail with image gallery, color/size variants, quantity, related products, reviews
- Cart drawer with free-shipping progress, save-for-later
- 3-step checkout: address → UPI/COD payment → review (atomic stock deduction)
- Order success page with tracking timeline
- Customer dashboard: orders, wishlist, addresses (CRUD), profile

## 🔐 Security

- Cookie-based sessions (7-day, httpOnly, stored in DB)
- Password hashing (SHA-256 + salt)
- Role-based access (CUSTOMER / ADMIN)
- Server-side payment verification (UTR required for UPI)
- Atomic transactions for order + stock
- Admin routes protected with `requireAdmin()`
- File upload validation (type + size)
- Path traversal prevention on upload delete

## 📊 Database Schema (17 models)

`User`, `Address`, `Category`, `Product`, `Cart`, `CartItem`, `Wishlist`, `WishlistItem`, `Review`, `Order`, `OrderItem`, `Payment`, `Shipment`, `Banner`, `HomepageSection`, `Setting`, `Notification`, `ActivityLog`

See `prisma/schema.prisma` for full schema.

## 🎨 Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Database:** Prisma ORM (SQLite) + MongoDB driver
- **State:** Zustand (client) + TanStack Query (server)
- **Image Processing:** Sharp
- **Forms:** React Hook Form + Zod

## 🚀 Deployment

### Vercel (recommended)
1. Push to GitHub
2. Import in Vercel
3. Add env vars from `.env.example`
4. Deploy

### With MongoDB Atlas
1. Create cluster at cloud.mongodb.com
2. Whitelist `0.0.0.0/0` (or Vercel IPs)
3. Set `MONGODB_URI` in Vercel env vars
4. Run `bun run scripts/seed.ts` once to seed data

## 📝 API Endpoints

### Public
- `GET /api/products` — list with filters
- `GET /api/products/[slug]` — product detail
- `GET /api/categories`
- `GET /api/banners`
- `GET /api/homepage`
- `GET /api/settings`
- `GET /api/reviews`
- `GET /api/health`

### Auth
- `POST /api/auth` — login/register
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Customer (requires login)
- `GET/POST/PATCH/DELETE /api/cart`
- `GET/POST/DELETE /api/wishlist`
- `GET /api/orders?mine=1`
- `GET /api/orders/[id]`
- `POST /api/checkout`
- `GET/POST/PATCH/DELETE /api/addresses`
- `POST /api/reviews`

### Admin (requires ADMIN role)
- `GET /api/admin/dashboard`
- `GET/POST /api/admin/products`
- `PATCH/DELETE /api/admin/products/[id]`
- `GET /api/orders` — all orders
- `PATCH /api/orders/[id]` — update status
- `GET /api/admin/customers`
- `GET/PATCH /api/admin/reviews`
- `GET/POST/PATCH/DELETE /api/admin/banners`
- `GET/PATCH /api/admin/homepage`
- `GET/PATCH /api/admin/settings`
- `GET /api/admin/activity`
- `POST/DELETE /api/admin/upload`

## 📜 Scripts

```bash
bun run dev          # Dev server on port 3000
bun run build        # Production build
bun run start        # Start production server
bun run lint         # ESLint
bun run db:push      # Push schema to SQLite
bun run db:generate  # Regenerate Prisma client
bun run db:migrate   # Create migration
bun run db:reset     # Reset database
bun run scripts/seed.ts  # Seed sample data
```

## 🎯 Production Checklist

Before going live:
- [ ] Replace SHA-256 password hashing with bcrypt/argon2
- [ ] Replace demo session system with NextAuth.js + JWT
- [ ] Set up MongoDB Atlas and configure `MONGODB_URI`
- [ ] Integrate Razorpay/Paytm payment gateway (replace UPI UTR verification)
- [ ] Set up Cloudinary for image uploads (replace local storage)
- [ ] Integrate Delhivery API for shipping
- [ ] Configure SMTP for emails (order confirmation, shipping, etc.)
- [ ] Set up Vercel deployment
- [ ] Add rate limiting middleware
- [ ] Set up error monitoring (Sentry)
- [ ] Configure CDN for static assets
- [ ] Set up backup strategy for MongoDB

## 📞 Support

- **Brand:** RANG BIRANGI
- **Email:** care@rangbirangi.com
- **Phone:** +91 95599 74558
- **UPI:** 9559974558@ptaxis

---

© 2024 RANG BIRANGI. All rights reserved. Handcrafted with ♥ in India.
