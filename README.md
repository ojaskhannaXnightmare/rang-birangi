# 🚀 RANG BIRANGI — Firebase + Next.js E-Commerce Platform

A production-ready, dark-luxury themed fashion e-commerce platform built with Next.js 16, TypeScript, Tailwind CSS 4, and **Firebase Firestore + Storage**.

## 🔥 What's Inside

- **Customer storefront**: Hero carousel, categories, trending, new arrivals, flash sale, featured, handmade, best sellers, reviews, newsletter
- **Product detail page** with image gallery, variants, add-to-cart, reviews
- **3-step checkout**: Address → UPI/COD payment → Order review
- **Customer dashboard**: Orders, wishlist, addresses, profile
- **Enterprise admin panel** (8 modules): Dashboard with charts, Products CRUD with image upload, Orders, Customers, Reviews, Homepage Builder, Activity Log, Settings
- **Firebase Firestore**: 17 collections, fully serverless, scales automatically
- **Firebase Storage**: Product image uploads (sharp-processed WEBP)
- **Auth**: Cookie-based sessions stored in Firestore, password hashing
- **Dark luxury theme**: #0F0F10 / #18181B / #7B1E3A / #D4AF37

## 🔑 Login Credentials

- **Admin:** `admin@rangbirangi.com` / `RB_1122`
- **Customer:** `customer@demo.com` / `demo123`

> 💡 **Admin Login**: Click the floating shield button in the bottom-right corner of the storefront.
> **Customer Login**: Click the account (user) icon in the navbar.

## 🛠️ Setup Instructions

### 1. Install dependencies

```bash
bun install
# or
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → your project (`studio-9037835683-4f648`)
2. **Enable Firestore Database** (Build → Firestore Database → Create database)
3. **Enable Storage** (Build → Storage → Get started)
4. **Generate service account key**:
   - Project Settings (gear icon) → Service Accounts tab
   - Click "Generate new private key" → download JSON file
5. Copy `.env.example` to `.env` and fill in:
   ```
   # Option A: Paste full JSON (recommended for Vercel)
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...full JSON...}'

   # Option B: Individual fields
   FIREBASE_PROJECT_ID="studio-9037835683-4f648"
   FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@studio-9037835683-4f648.iam.gserviceaccount.com"
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   FIREBASE_STORAGE_BUCKET="studio-9037835683-4f648.firebasestorage.app"
   ```

The public Firebase config (API key, auth domain, etc.) is already set in `.env.example`.

### 3. Seed the database

```bash
bun run seed
# This creates: admin user, customer, 4 categories, 16 products, 3 banners,
# 10 homepage sections, 13 settings, 6 reviews, 8 sample orders, activity logs
```

### 4. Run dev server

```bash
bun run dev
```

Visit `http://localhost:3000`

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: RANG BIRANGI Firebase e-commerce"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rang-birangi.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Framework preset: **Next.js** (auto-detected)
4. Build command: `bun run build` (auto-detected)
5. Install command: `bun install` (auto-detected)

### Step 3: Add Environment Variables

In Vercel project settings → Environment Variables, add ALL of these:

**Required (server-side):**
| Variable | Value |
|----------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Full JSON from service account key file (single line) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyDuigrE3vFubr4riRU2BfRWFvGg36_FDYo` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `studio-9037835683-4f648.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `studio-9037835683-4f648` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `studio-9037835683-4f648.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `776679789908` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:776679789908:web:3d3c0ac7daa28d0fc264c1` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `G-8RR9YYNYKM` |
| `FIREBASE_PROJECT_ID` | `studio-9037835683-4f648` |
| `FIREBASE_STORAGE_BUCKET` | `studio-9037835683-4f648.firebasestorage.app` |

**Optional (for production integrations):**
| Variable | Purpose |
|----------|---------|
| `JWT_SECRET` | Session signing secret (32+ chars) |
| `PAYMENT_CONFIG` | Razorpay/Paytm JSON config |
| `EMAIL_CONFIG` | SMTP JSON for transactional emails |
| `DELHIVERY_CONFIG` | Delhivery shipping API config |

### Step 4: Deploy

Click "Deploy" — Vercel will:
1. Run `bun install`
2. Run `bun run build`
3. Deploy serverless functions
4. Give you a `*.vercel.app` URL

### Step 5: Seed production database

After deployment, run the seed script against your production Firestore:

```bash
# Set the same env vars locally, then:
bun run seed
```

Or use Firebase Console to manually add the admin user and a few products.

## 📊 Firebase Firestore Collections (17)

| Collection | Purpose |
|-----------|---------|
| `users` | Customer + admin accounts |
| `addresses` | Saved shipping addresses |
| `products` | Product catalog (16 fields) |
| `categories` | 4 main categories |
| `orders` | Customer orders |
| `orderItems` | Line items per order |
| `payments` | Payment records (UPI/COD) |
| `shipments` | Delhivery tracking |
| `cart` | One per user |
| `cartItems` | Cart line items |
| `wishlist` | One per user |
| `wishlistItems` | Wishlist entries |
| `reviews` | Product reviews with approve/reject |
| `banners` | Hero + middle banners |
| `homepageSections` | CMS-controlled sections |
| `settings` | Key-value brand config |
| `activityLogs` | Admin audit trail |
| `sessions` | Cookie-based auth sessions |

## 📤 Image Upload

- **API**: `POST /api/admin/upload` (multipart/form-data, admin-only)
- **Storage**: Firebase Storage at `rangbirangi/{timestamp}-{random}.webp`
- **Processing**: `sharp` resizes to max 1200×1200, converts to WEBP (quality 82)
- **Public URL**: `https://storage.googleapis.com/{bucket}/rangbirangi/{filename}.webp`
- **Allowed**: PNG, JPG, WEBP, GIF (max 10MB each)
- **Fallback**: If Firebase Storage fails, saves locally to `/public/uploads/` (dev only — won't persist on Vercel)

## 🏢 Admin Panel Features

| Module | Features |
|--------|----------|
| **Dashboard** | Revenue/orders stats, 7-day sales chart, category performance, status pie, low-stock alerts, best sellers, recent activity, **Firebase health banner** |
| **Products** | Full CRUD, drag/drop image upload, search, category filter, bulk delete, publish toggle, all flags |
| **Orders** | Search/filter, detail view, 9-status workflow, tracking number |
| **Customers** | Grid view with order count, total spent |
| **Reviews** | Approve/Reject/Reply workflow |
| **Homepage Builder** | Toggle sections, reorder, inline edit — instantly reflects on storefront |
| **Activity Log** | All admin actions tracked |
| **Settings** | Brand info, payment, shipping, social links |

## 🔐 Security

- Cookie-based sessions (7-day, httpOnly, stored in Firestore `sessions` collection)
- Password hashing (SHA-256 + salt)
- Role-based access (CUSTOMER / ADMIN)
- Admin routes protected with `requireAdmin()`
- Server-side payment verification (UTR required for UPI)
- File upload validation (type + size)
- Firebase Security Rules recommended (see below)

## 🛡️ Firebase Security Rules (recommended)

Add these to Firestore Rules (Firebase Console → Firestore → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for published products, categories, banners, homepage, settings
    match /products/{id} {
      allow read: if resource.data.isPublished == true;
      allow write: if false; // Only Admin SDK (server)
    }
    match /categories/{id} {
      allow read: if resource.data.isActive == true;
      allow write: if false;
    }
    match /banners/{id} { allow read: if resource.data.isActive == true; allow write: if false; }
    match /homepageSections/{id} { allow read: if true; allow write: if false; }
    match /settings/{id} { allow read: if true; allow write: if false; }
    match /reviews/{id} { allow read: if resource.data.status == 'APPROVED'; allow write: if false; }

    // Everything else: no public access (server-only via Admin SDK)
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Storage Rules (Firebase Console → Storage → Rules):

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /rangbirangi/{allPaths=**} {
      allow read: if true;  // Public read for product images
      allow write: if false; // Only Admin SDK
    }
  }
}
```

## 📝 API Endpoints

### Public
- `GET /api/products` — list with filters
- `GET /api/products/[slug]` — product detail
- `GET /api/categories`
- `GET /api/banners`
- `GET /api/homepage`
- `GET /api/settings`
- `GET /api/reviews`
- `GET /api/health` — Firebase connection status

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
- `POST/DELETE /api/admin/upload` — image upload to Firebase Storage

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Database**: Firebase Firestore (serverless, auto-scaling)
- **Storage**: Firebase Storage (for product images)
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Image Processing**: Sharp
- **State**: Zustand (client) + TanStack Query (server)
- **Auth**: Custom cookie-based sessions stored in Firestore

## 📜 Scripts

```bash
bun run dev      # Dev server on port 3000
bun run build    # Production build
bun run start    # Start production server
bun run lint     # ESLint
bun run seed     # Seed Firestore with sample data
```

## 🎯 Production Checklist

Before going live:
- [ ] Replace SHA-256 password hashing with bcrypt/argon2
- [ ] Integrate Razorpay/Paytm payment gateway (replace UPI UTR verification)
- [ ] Configure SMTP for emails (order confirmation, shipping, etc.)
- [ ] Integrate Delhivery API for shipping
- [ ] Add Firebase Security Rules (see above)
- [ ] Set up rate limiting middleware
- [ ] Add error monitoring (Sentry)
- [ ] Configure custom domain in Vercel
- [ ] Set up backup strategy for Firestore

## 📞 Support

- **Brand:** RANG BIRANGI
- **Email:** care@rangbirangi.com
- **Phone:** +91 95599 74558
- **UPI:** 9559974558@ptaxis

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                    # 40+ API routes (Firebase-backed)
│   │   ├── auth/              # login, register, me, logout
│   │   ├── products/          # list, [slug] detail
│   │   ├── categories/
│   │   ├── cart/              # GET, POST, PATCH, DELETE
│   │   ├── wishlist/
│   │   ├── orders/            # list, [id] with admin update
│   │   ├── checkout/          # atomic order creation
│   │   ├── reviews/
│   │   ├── addresses/
│   │   ├── banners/
│   │   ├── homepage/
│   │   ├── settings/
│   │   ├── health/            # Firebase status check
│   │   └── admin/             # admin-only routes
│   │       ├── dashboard/
│   │       ├── products/
│   │       ├── orders/
│   │       ├── customers/
│   │       ├── reviews/
│   │       ├── banners/
│   │       ├── homepage/
│   │       ├── settings/
│   │       ├── activity/
│   │       └── upload/        # Firebase Storage image upload
│   ├── layout.tsx
│   ├── page.tsx               # main SPA with view switching
│   └── globals.css            # dark luxury theme
├── components/
│   ├── store/                 # customer-facing components
│   ├── admin/                 # enterprise admin panel
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── firebase-admin.ts      # Firebase Admin SDK init
│   ├── firestore-db.ts        # Data access layer (17 collections)
│   ├── auth.ts                # Cookie sessions in Firestore
│   ├── helpers.ts             # Formatters, DTOs, serializers
│   └── utils.ts
├── stores/                    # Zustand stores
└── hooks/

scripts/
└── seed-firestore.ts          # Firestore seeder

public/uploads/                # Local fallback for image uploads
```

---

© 2024 RANG BIRANGI. All rights reserved. Handcrafted with ♥ in India.
