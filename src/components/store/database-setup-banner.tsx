'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Copy, Check, Database, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

const SETUP_SQL = `-- RANG BIRANGI Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/jrjpnomlvthbhpqpwfio/sql/new

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT,
  house_no TEXT NOT NULL, building TEXT, street TEXT NOT NULL, area TEXT, landmark TEXT,
  city TEXT NOT NULL, state TEXT NOT NULL, pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, slug TEXT UNIQUE NOT NULL,
  description TEXT, image_url TEXT, icon_name TEXT,
  sort_order INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL, sku TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '', material TEXT, weight TEXT, care_instructions TEXT,
  category_id UUID, price NUMERIC(10,2) NOT NULL DEFAULT 0, compare_at_price NUMERIC(10,2),
  discount_percent NUMERIC(5,2) DEFAULT 0, stock INT DEFAULT 0, low_stock_threshold INT DEFAULT 5,
  images JSONB DEFAULT '[]', videos JSONB DEFAULT '[]', colors JSONB DEFAULT '[]', sizes JSONB DEFAULT '[]', tags JSONB DEFAULT '[]',
  rating NUMERIC(3,2) DEFAULT 0, review_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE, is_trending BOOLEAN DEFAULT FALSE, is_new_arrival BOOLEAN DEFAULT FALSE,
  is_flash_sale BOOLEAN DEFAULT FALSE, is_best_seller BOOLEAN DEFAULT FALSE, is_handmade BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT TRUE, seo_title TEXT, seo_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, user_id UUID REFERENCES users(id),
  address_snapshot JSONB, subtotal NUMERIC(10,2) DEFAULT 0, discount NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0, tax NUMERIC(10,2) DEFAULT 0, total NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'PENDING_PAYMENT', payment_method TEXT, payment_status TEXT DEFAULT 'PENDING',
  payment_ref TEXT, tracking_number TEXT, courier TEXT, notes TEXT, invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID, name TEXT, sku TEXT, price NUMERIC(10,2), quantity INT,
  color TEXT, size TEXT, image TEXT, total NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT, amount NUMERIC(10,2), status TEXT DEFAULT 'PENDING',
  txn_ref TEXT, upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  courier TEXT DEFAULT 'Delhivery', tracking_number TEXT, status TEXT DEFAULT 'INITIATED',
  estimated_delivery TIMESTAMPTZ, shipped_at TIMESTAMPTZ, delivered_at TIMESTAMPTZ, history JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES cart(id) ON DELETE CASCADE,
  product_id UUID, quantity INT DEFAULT 1, color TEXT, size TEXT, saved_for_later BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID REFERENCES wishlist(id) ON DELETE CASCADE,
  product_id UUID, created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  rating INT NOT NULL, title TEXT, comment TEXT, image_url TEXT,
  status TEXT DEFAULT 'PENDING', admin_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, subtitle TEXT, image_url TEXT, link_url TEXT, button_text TEXT,
  position TEXT DEFAULT 'HERO', sort_order INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE,
  start_at TIMESTAMPTZ, end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, title TEXT NOT NULL, subtitle TEXT, is_enabled BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0, config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT, message TEXT, type TEXT DEFAULT 'INFO', is_read BOOLEAN DEFAULT FALSE, link_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, action TEXT, entity TEXT, entity_id TEXT, metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, token TEXT UNIQUE, user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires BIGINT, created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('rangbirangi', 'rangbirangi', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies: allow public read, service role write
DROP POLICY IF EXISTS "Public read rangbirangi" ON storage.objects;
CREATE POLICY "Public read rangbirangi" ON storage.objects FOR SELECT USING (bucket_id = 'rangbirangi');
DROP POLICY IF EXISTS "Service role write rangbirangi" ON storage.objects;
CREATE POLICY "Service role write rangbirangi" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'rangbirangi');
DROP POLICY IF EXISTS "Service role delete rangbirangi" ON storage.objects;
CREATE POLICY "Service role delete rangbirangi" ON storage.objects FOR DELETE USING (bucket_id = 'rangbirangi');

-- Seed admin user (admin@rangbirangi.com / RB_1122)
INSERT INTO users (email, name, password_hash, role, phone, status)
VALUES ('admin@rangbirangi.com', 'RANG BIRANGI Admin', '26e0dfadec08a1a0893c620d8cdcffff1102f4e48de6cee1fb99e28e0909e75c', 'ADMIN', '9559974558', 'ACTIVE')
ON CONFLICT (email) DO NOTHING;

-- Seed categories
INSERT INTO categories (name, slug, description, image_url, sort_order, is_active) VALUES
('Handmade Bangles', 'handmade-bangles', 'Handcrafted bangles made by Indian artisans', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800', 1, true),
('Earrings', 'earrings', 'Exquisite earrings for every occasion', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', 2, true),
('Sarees', 'sarees', 'Elegant handwoven sarees from across India', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', 3, true),
('Kurtis', 'kurtis', 'Comfortable and stylish kurtis', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800', 4, true)
ON CONFLICT (slug) DO NOTHING;

-- Seed homepage sections
INSERT INTO homepage_sections (key, title, subtitle, sort_order, is_enabled) VALUES
('hero', 'Hero Banner', 'Main carousel', 1, true),
('categories', 'Shop by Category', 'Browse categories', 2, true),
('trending', 'Trending Now', 'Most loved', 3, true),
('new_arrivals', 'New Arrivals', 'Fresh additions', 4, true),
('flash_sale', 'Flash Sale', 'Limited offers', 5, true),
('featured', 'Featured Products', 'Curated picks', 6, true),
('handmade', 'Handmade Collection', 'Crafted by artisans', 7, true),
('best_sellers', 'Best Sellers', 'Customer favorites', 8, true),
('reviews', 'Customer Reviews', 'What customers say', 9, true),
('newsletter', 'Newsletter', 'Subscribe', 10, true)
ON CONFLICT (key) DO NOTHING;

-- Seed banners
INSERT INTO banners (title, subtitle, image_url, button_text, link_url, position, sort_order, is_active) VALUES
('Festive Collection 2024', 'Handcrafted elegance', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600', 'Shop Now', 'category:sarees', 'HERO', 1, true),
('RANG BIRANGI Bangles', 'Authentic craftsmanship', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1600', 'Explore', 'category:handmade-bangles', 'HERO', 2, true),
('Flash Sale 40% Off', 'Limited time', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600', 'Grab Deals', 'section:flash_sale', 'MIDDLE', 1, true)
ON CONFLICT (title) DO NOTHING;

-- Seed settings
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
('whatsapp_url', 'https://wa.me/919559974558')
ON CONFLICT (key) DO NOTHING;

-- DONE! `

export function DatabaseSetupBanner() {
  const [status, setStatus] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasRefreshed, setHasRefreshed] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let interval: any = null
    let isMounted = true

    // Check database status on load
    const checkStatus = async () => {
      try {
        const r = await fetch('/api/db-status')
        const d = await r.json()
        if (!isMounted) return
        setStatus(d)

        // If database is NOT ready, start polling (only when banner is visible)
        if (!d.ready && !interval) {
          interval = setInterval(async () => {
            try {
              const r2 = await fetch('/api/db-status')
              const d2 = await r2.json()
              if (!isMounted) return
              setStatus(d2)
              // When database becomes ready, refresh ONCE and stop polling
              if (d2.ready && !hasRefreshed) {
                clearInterval(interval)
                interval = null
                setHasRefreshed(true)
                toast({ title: 'Database ready!', description: 'All tables exist. Refreshing...' })
                setTimeout(() => window.location.reload(), 2000)
              }
            } catch {}
          }, 30000)
        }
      } catch {}
    }

    checkStatus()

    return () => {
      isMounted = false
      if (interval) clearInterval(interval)
    }
  }, [toast, hasRefreshed])

  // Don't show if database is ready, dismissed, or status not loaded yet
  if (!status || status.ready || dismissed) return null

  const copySQL = () => {
    navigator.clipboard.writeText(SETUP_SQL)
    setCopied(true)
    toast({ title: 'SQL copied!', description: 'Paste it in Supabase SQL Editor' })
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 inset-x-0 z-[60] bg-red-600/95 backdrop-blur border-b-2 border-red-400"
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-white flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base">
                Database Setup Required — Tables Missing
              </h3>
              <p className="text-xs sm:text-sm text-white/90 mt-1">
                {status.configured === false
                  ? 'Supabase env vars not set on Vercel. Add NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY.'
                  : `${status.missingTables?.length || 'All'} tables missing. Run the SQL schema in Supabase SQL Editor (1 min).`}
              </p>

              {status.configured !== false && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <a
                    href="https://supabase.com/dashboard/project/jrjpnomlvthbhpqpwfio/sql/new"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-red-600 hover:bg-white/90 text-xs font-medium"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open Supabase SQL Editor
                  </a>
                  <button
                    onClick={copySQL}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 text-xs font-medium border border-white/30"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied!' : 'Copy SQL'}
                  </button>
                  <button
                    onClick={() => {
                      fetch('/api/db-status')
                        .then((r) => r.json())
                        .then((d) => {
                          setStatus(d)
                          if (d.ready) {
                            toast({ title: 'Database ready!', description: 'Refreshing...' })
                            setTimeout(() => window.location.reload(), 1500)
                          } else {
                            toast({ title: 'Still missing tables', description: `${d.missingTables?.length || 0} tables missing`, variant: 'destructive' })
                          }
                        })
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 text-xs font-medium border border-white/30"
                  >
                    <Database className="h-3.5 w-3.5" /> Check Again
                  </button>
                </div>
              )}

              {status.configured === false && (
                <p className="text-xs text-white/80 mt-2">
                  Go to Vercel → Project → Settings → Environment Variables. Add the 3 Supabase variables.
                </p>
              )}
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
