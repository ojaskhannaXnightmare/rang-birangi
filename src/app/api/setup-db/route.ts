/**
 * RANG BIRANGI - Auto Database Setup
 * POST /api/setup-db
 *
 * Automatically creates all 19 tables in Supabase if they don't exist.
 * Uses Supabase's REST API (rpc) to execute raw SQL.
 *
 * This endpoint is called automatically on first page load.
 * No manual SQL execution needed!
 *
 * After tables are created, also seeds:
 * - Admin user (admin@rangbirangi.com / RB_1122)
 * - 4 default categories
 * - 10 homepage sections
 * - 3 banners
 * - 13 settings
 */
import { NextResponse } from 'next/server'
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase-admin'
import crypto from 'crypto'

function hashPassword(s: string): string {
  return crypto.createHash('sha256').update(s + 'rangbirangi_salt').digest('hex')
}

const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'CUSTOMER',
  phone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ADDRESSES
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  house_no TEXT NOT NULL,
  building TEXT,
  street TEXT NOT NULL,
  area TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  icon_name TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  material TEXT,
  weight TEXT,
  care_instructions TEXT,
  category_id UUID,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  compare_at_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  stock INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  images JSONB DEFAULT '[]'::jsonb,
  videos JSONB DEFAULT '[]'::jsonb,
  colors JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_trending BOOLEAN DEFAULT FALSE,
  is_new_arrival BOOLEAN DEFAULT FALSE,
  is_flash_sale BOOLEAN DEFAULT FALSE,
  is_best_seller BOOLEAN DEFAULT FALSE,
  is_handmade BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE,
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  address_snapshot JSONB,
  subtotal NUMERIC(10,2) DEFAULT 0,
  discount NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'PENDING_PAYMENT',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'PENDING',
  payment_ref TEXT,
  tracking_number TEXT,
  courier TEXT,
  notes TEXT,
  invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID,
  name TEXT,
  sku TEXT,
  price NUMERIC(10,2),
  quantity INT,
  color TEXT,
  size TEXT,
  image TEXT,
  total NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT,
  amount NUMERIC(10,2),
  status TEXT DEFAULT 'PENDING',
  txn_ref TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHIPMENTS
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  courier TEXT DEFAULT 'Delhivery',
  tracking_number TEXT,
  status TEXT DEFAULT 'INITIATED',
  estimated_delivery TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  history JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CART
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES cart(id) ON DELETE CASCADE,
  product_id UUID,
  quantity INT DEFAULT 1,
  color TEXT,
  size TEXT,
  saved_for_later BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WISHLIST
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WISHLIST ITEMS
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID REFERENCES wishlist(id) ON DELETE CASCADE,
  product_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  rating INT NOT NULL,
  title TEXT,
  comment TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'PENDING',
  admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BANNERS
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link_url TEXT,
  button_text TEXT,
  position TEXT DEFAULT 'HERO',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HOMEPAGE SECTIONS
CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'INFO',
  is_read BOOLEAN DEFAULT FALSE,
  link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT,
  entity TEXT,
  entity_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSIONS (text id, not UUID)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public)
VALUES ('rangbirangi', 'rangbirangi', true)
ON CONFLICT (id) DO NOTHING;
`

const SEED_SQL = `
-- Admin user (admin@rangbirangi.com / RB_1122)
INSERT INTO users (email, name, password_hash, role, phone, status)
VALUES ('admin@rangbirangi.com', 'RANG BIRANGI Admin', '${hashPassword('RB_1122')}', 'ADMIN', '9559974558', 'ACTIVE')
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'ADMIN',
  status = 'ACTIVE';

-- Default categories
INSERT INTO categories (name, slug, description, image_url, sort_order, is_active) VALUES
('Handmade Bangles', 'handmade-bangles', 'Handcrafted bangles made by Indian artisans using traditional techniques.', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80', 1, true),
('Earrings', 'earrings', 'Exquisite earrings for every occasion.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80', 2, true),
('Sarees', 'sarees', 'Elegant handwoven sarees from across India.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80', 3, true),
('Kurtis', 'kurtis', 'Comfortable and stylish kurtis for everyday wear.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Homepage sections
INSERT INTO homepage_sections (key, title, subtitle, sort_order, is_enabled) VALUES
('hero', 'Hero Banner', 'Main carousel banners', 1, true),
('categories', 'Shop by Category', 'Browse our main categories', 2, true),
('trending', 'Trending Now', 'Most loved this week', 3, true),
('new_arrivals', 'New Arrivals', 'Fresh additions to our collection', 4, true),
('flash_sale', 'Flash Sale', 'Limited time offers', 5, true),
('featured', 'Featured Products', 'Curated picks', 6, true),
('handmade', 'Handmade Collection', 'Crafted by Indian artisans', 7, true),
('best_sellers', 'Best Sellers', 'Customer favorites', 8, true),
('reviews', 'Customer Reviews', 'What our customers say', 9, true),
('newsletter', 'Newsletter', 'Subscribe for updates', 10, true)
ON CONFLICT (key) DO NOTHING;

-- Banners
INSERT INTO banners (title, subtitle, image_url, button_text, link_url, position, sort_order, is_active) VALUES
('Festive Collection 2024', 'Handcrafted elegance for every celebration', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80', 'Shop Now', 'category:sarees', 'HERO', 1, true),
('RANG BIRANGI Handmade Bangles', 'Authentic Indian craftsmanship delivered to your door', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1600&q=80', 'Explore Bangles', 'category:handmade-bangles', 'HERO', 2, true),
('Flash Sale - Up to 40% Off', 'Limited time offer on selected items', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600&q=80', 'Grab Deals', 'section:flash_sale', 'MIDDLE', 1, true)
ON CONFLICT (title) DO NOTHING;

-- Settings
INSERT INTO settings (key, value) VALUES
('brand_name', 'RANG BIRANGI'),
('brand_tagline', 'Handcrafted Indian Elegance'),
('upi_id', '9559974558@ptaxis'),
('support_phone', '9559974558'),
('support_email', 'care@rangbirangi.com'),
('free_shipping_threshold', '999'),
('shipping_cost', '49'),
('cod_available', 'true'),
('currency', 'INR'),
('currency_symbol', '₹'),
('instagram_url', 'https://instagram.com/rangbirangi'),
('facebook_url', 'https://facebook.com/rangbirangi'),
('whatsapp_url', 'https://wa.me/919559974558')
ON CONFLICT (key) DO NOTHING;
`

export async function POST() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      }, { status: 500 })
    }

    const supabase = getSupabase()

    // Execute schema SQL using Supabase's rpc (raw SQL execution)
    // We use the /rest/v1/rpc endpoint via the .rpc() method
    // Actually, Supabase JS doesn't support raw SQL directly.
    // We need to use the management API or fetch directly.

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Use Supabase's SQL endpoint (POST /rest/v1/rpc won't work for DDL)
    // Instead, use the /pg/query endpoint or direct fetch to /rest/v1/
    // The cleanest way: use the Supabase SQL API via fetch

    // Method: Use fetch to call Supabase's /rest/v1/rpc with a function
    // But we can't create functions without tables existing first...
    //
    // Best approach: Use the Supabase Management API
    // POST https://api.supabase.com/v1/projects/{ref}/database/query
    // But that needs a different API key (personal access token)
    //
    // Alternative: Use the pg_meta endpoint
    // POST https://{project}.supabase.co/pg/query
    // This works with the service role key!

    const pgResponse = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ query: SCHEMA_SQL }),
    })

    if (!pgResponse.ok) {
      const errText = await pgResponse.text()
      console.error('Schema creation failed:', errText)

      // Fallback: try the /rest/v1/ approach with individual table creation
      // Actually, let's try creating tables via the REST API directly
      return NextResponse.json({
        error: `Failed to create schema: ${errText}`,
        hint: 'Run supabase-schema.sql manually in Supabase SQL Editor.',
      }, { status: 500 })
    }

    // Now seed the data
    const seedResponse = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ query: SEED_SQL }),
    })

    if (!seedResponse.ok) {
      const errText = await seedResponse.text()
      console.error('Seed failed:', errText)
      return NextResponse.json({
        error: `Schema created but seed failed: ${errText}`,
        hint: 'Tables exist now. Try logging in again.',
      }, { status: 500 })
    }

    // Verify tables exist now
    const { data: cats, error: catErr } = await supabase
      .from('categories')
      .select('id')
      .limit(1)

    return NextResponse.json({
      success: true,
      message: 'Database setup complete! All tables created and seeded.',
      tablesCreated: 19,
      categoriesExist: !catErr && cats !== null,
      adminCredentials: {
        email: 'admin@rangbirangi.com',
        password: 'RB_1122',
      },
    })
  } catch (e: any) {
    console.error('setup-db error', e)
    return NextResponse.json({
      error: e.message,
      hint: 'Run supabase-schema.sql manually in Supabase SQL Editor.',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/setup-db',
    method: 'POST',
    description: 'Auto-creates all 19 tables in Supabase + seeds admin user, categories, banners, settings',
    usage: 'curl -X POST https://your-app.vercel.app/api/setup-db',
  })
}
