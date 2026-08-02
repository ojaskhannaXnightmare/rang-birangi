import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, create,
} from '@/lib/supabase-db'
import { hashPassword, verifyPassword, createSession } from '@/lib/auth'

const ADMIN_EMAIL = 'admin@rangbirangi.com'
const ADMIN_PASSWORD = 'RB_1122'
const ADMIN_NAME = 'RANG BIRANGI Admin'
const ADMIN_PHONE = '9559974558'

/**
 * Check if error is "table doesn't exist" and auto-setup database if so.
 * Returns true if database was set up (caller should retry the operation).
 */
async function autoSetupIfMissingTable(error: any): Promise<boolean> {
  const errMsg = (error?.message || '').toLowerCase()
  if (
    errMsg.includes('could not find the table') ||
    errMsg.includes('does not exist') ||
    errMsg.includes('schema cache') ||
    errMsg.includes('pgrst205') ||
    errMsg.includes('42p01')
  ) {
    console.log('Table not found — auto-setting up database...')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/pg/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!,
        },
        body: JSON.stringify({
          query: `
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
              full_name TEXT, phone TEXT, email TEXT,
              house_no TEXT, building TEXT, street TEXT, area TEXT, landmark TEXT,
              city TEXT, state TEXT, pincode TEXT,
              is_default BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS categories (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT UNIQUE, slug TEXT UNIQUE,
              description TEXT, image_url TEXT, icon_name TEXT,
              sort_order INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS products (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name TEXT, slug TEXT UNIQUE, sku TEXT UNIQUE,
              description TEXT DEFAULT '', material TEXT, weight TEXT, care_instructions TEXT,
              category_id UUID, price NUMERIC(10,2) DEFAULT 0, compare_at_price NUMERIC(10,2),
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
              order_number TEXT UNIQUE, user_id UUID REFERENCES users(id),
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
              rating INT, title TEXT, comment TEXT, image_url TEXT,
              status TEXT DEFAULT 'PENDING', admin_reply TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS banners (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              title TEXT, subtitle TEXT, image_url TEXT, link_url TEXT, button_text TEXT,
              position TEXT DEFAULT 'HERO', sort_order INT DEFAULT 0, is_active BOOLEAN DEFAULT TRUE,
              start_at TIMESTAMPTZ, end_at TIMESTAMPTZ,
              created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS homepage_sections (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              key TEXT UNIQUE, title TEXT, subtitle TEXT, is_enabled BOOLEAN DEFAULT TRUE,
              sort_order INT DEFAULT 0, config JSONB,
              created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE TABLE IF NOT EXISTS settings (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              key TEXT UNIQUE, value TEXT,
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
            INSERT INTO storage.buckets (id, name, public) VALUES ('rangbirangi', 'rangbirangi', true) ON CONFLICT (id) DO NOTHING;
            -- Seed admin
            INSERT INTO users (email, name, password_hash, role, phone, status)
            VALUES ('admin@rangbirangi.com', 'RANG BIRANGI Admin', '${hashPassword(ADMIN_PASSWORD)}', 'ADMIN', '9559974558', 'ACTIVE')
            ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = 'ADMIN', status = 'ACTIVE';
            -- Seed categories
            INSERT INTO categories (name, slug, description, image_url, sort_order, is_active) VALUES
            ('Handmade Bangles', 'handmade-bangles', 'Handcrafted bangles', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800', 1, true),
            ('Earrings', 'earrings', 'Exquisite earrings', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800', 2, true),
            ('Sarees', 'sarees', 'Elegant sarees', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800', 3, true),
            ('Kurtis', 'kurtis', 'Stylish kurtis', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800', 4, true)
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
            ('brand_name', 'RANG BIRANGI'), ('brand_tagline', 'Handcrafted Indian Elegance'),
            ('upi_id', '9559974558@ptaxis'), ('support_phone', '9559974558'),
            ('support_email', 'care@rangbirangi.com'), ('free_shipping_threshold', '999'),
            ('shipping_cost', '49'), ('cod_available', 'true'), ('currency', 'INR'),
            ('currency_symbol', '₹'), ('instagram_url', 'https://instagram.com/rangbirangi'),
            ('facebook_url', 'https://facebook.com/rangbirangi'), ('whatsapp_url', 'https://wa.me/919559974558')
            ON CONFLICT (key) DO NOTHING;
          `,
        }),
      })
      if (res.ok) {
        console.log('Database auto-setup complete!')
        // Wait a moment for schema cache to refresh
        await new Promise((r) => setTimeout(r, 1500))
        return true
      } else {
        console.error('Auto-setup failed:', await res.text())
      }
    } catch (setupErr: any) {
      console.error('Auto-setup error:', setupErr.message)
    }
  }
  return false
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name, phone } = await req.json()

    if (action === 'register') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
      }

      let existing: any = null
      try {
        existing = await findOne<any>(COLLECTIONS.USERS, [
          { field: 'email', op: '==', value: email },
        ])
      } catch (e: any) {
        if (await autoSetupIfMissingTable(e)) {
          // Retry after setup
          existing = await findOne<any>(COLLECTIONS.USERS, [
            { field: 'email', op: '==', value: email },
          ])
        } else {
          return NextResponse.json({ error: e.message }, { status: 500 })
        }
      }
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
      const user = await create<any>(COLLECTIONS.USERS, {
        email,
        passwordHash: hashPassword(password),
        name: name || null,
        phone: phone || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        avatarUrl: null,
      })
      await create(COLLECTIONS.CART, { userId: user.id, items: [] })
      await create(COLLECTIONS.WISHLIST, { userId: user.id, items: [] })
      await createSession(user.id)
      return NextResponse.json({
        id: user.id, email: user.email, name: user.name,
        role: user.role, phone: user.phone,
      })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
      }

      let user: any = null
      try {
        user = await findOne<any>(COLLECTIONS.USERS, [
          { field: 'email', op: '==', value: email },
        ])
      } catch (e: any) {
        if (await autoSetupIfMissingTable(e)) {
          // Retry after setup
          user = await findOne<any>(COLLECTIONS.USERS, [
            { field: 'email', op: '==', value: email },
          ])
        } else {
          return NextResponse.json({ error: e.message }, { status: 500 })
        }
      }

      // AUTO-CREATE ADMIN: If someone tries to login as admin@rangbirangi.com
      // and the user doesn't exist, auto-create it.
      if (!user && email === ADMIN_EMAIL) {
        try {
          user = await create<any>(COLLECTIONS.USERS, {
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            passwordHash: hashPassword(ADMIN_PASSWORD),
            role: 'ADMIN',
            phone: ADMIN_PHONE,
            status: 'ACTIVE',
            avatarUrl: null,
          })
          await create(COLLECTIONS.CART, { userId: user.id, items: [] })
          await create(COLLECTIONS.WISHLIST, { userId: user.id, items: [] })
          console.log('Admin user auto-created on first login attempt')
        } catch (e: any) {
          return NextResponse.json({ error: `Failed to create admin: ${e.message}` }, { status: 500 })
        }
      }

      if (!user) {
        return NextResponse.json({
          error: 'No account found with this email. Please register first.',
        }, { status: 401 })
      }

      if (!verifyPassword(password, user.passwordHash)) {
        // Special case: if admin email + RB_1122 password but hash doesn't match, force-update
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          const { update } = await import('@/lib/supabase-db')
          await update(COLLECTIONS.USERS, user.id, {
            passwordHash: hashPassword(ADMIN_PASSWORD),
            role: 'ADMIN',
            status: 'ACTIVE',
          })
          user = await findOne<any>(COLLECTIONS.USERS, [
            { field: 'email', op: '==', value: email },
          ])
          if (!user) {
            return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
          }
        } else {
          return NextResponse.json({
            error: 'Incorrect password. Please try again.',
          }, { status: 401 })
        }
      }

      if (user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
      }
      await createSession(user.id)
      return NextResponse.json({
        id: user.id, email: user.email, name: user.name,
        role: user.role, phone: user.phone,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    console.error('auth error', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
