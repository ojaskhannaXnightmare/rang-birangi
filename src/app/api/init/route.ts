/**
 * RANG BIRANGI - Init Endpoint
 * POST /api/init
 *
 * Ensures the database has the minimum required data:
 * - Admin user (admin@rangbirangi.com / RB_1122)
 * - 4 default categories (Bangles, Earrings, Sarees, Kurtis)
 * - Homepage sections (10 sections)
 * - Banners (3 banners)
 * - Settings (brand config)
 *
 * Idempotent — safe to call multiple times.
 * Call this once after deploying to Vercel to set up the database.
 *
 * No auth required (only creates data if it doesn't exist).
 */
import { NextResponse } from 'next/server'
import { COLLECTIONS, findOne, findMany, create, update } from '@/lib/firestore-db'
import crypto from 'crypto'

function hashPassword(s: string): string {
  return crypto.createHash('sha256').update(s + 'rangbirangi_salt').digest('hex')
}

const ADMIN_EMAIL = 'admin@rangbirangi.com'
const ADMIN_PASSWORD = 'RB_1122'

const DEFAULT_CATEGORIES = [
  {
    name: 'Handmade Bangles',
    slug: 'handmade-bangles',
    description: 'Handcrafted bangles made by Indian artisans using traditional techniques.',
    imageUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80',
    sortOrder: 1, isActive: true, iconName: null,
  },
  {
    name: 'Earrings',
    slug: 'earrings',
    description: 'Exquisite earrings for every occasion.',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    sortOrder: 2, isActive: true, iconName: null,
  },
  {
    name: 'Sarees',
    slug: 'sarees',
    description: 'Elegant handwoven sarees from across India.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
    sortOrder: 3, isActive: true, iconName: null,
  },
  {
    name: 'Kurtis',
    slug: 'kurtis',
    description: 'Comfortable and stylish kurtis for everyday wear.',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
    sortOrder: 4, isActive: true, iconName: null,
  },
]

const HOMEPAGE_SECTIONS = [
  { key: 'hero', title: 'Hero Banner', subtitle: 'Main carousel banners', sortOrder: 1, isEnabled: true },
  { key: 'categories', title: 'Shop by Category', subtitle: 'Browse our main categories', sortOrder: 2, isEnabled: true },
  { key: 'trending', title: 'Trending Now', subtitle: 'Most loved this week', sortOrder: 3, isEnabled: true },
  { key: 'new_arrivals', title: 'New Arrivals', subtitle: 'Fresh additions to our collection', sortOrder: 4, isEnabled: true },
  { key: 'flash_sale', title: 'Flash Sale', subtitle: 'Limited time offers', sortOrder: 5, isEnabled: true },
  { key: 'featured', title: 'Featured Products', subtitle: 'Curated picks', sortOrder: 6, isEnabled: true },
  { key: 'handmade', title: 'Handmade Collection', subtitle: 'Crafted by Indian artisans', sortOrder: 7, isEnabled: true },
  { key: 'best_sellers', title: 'Best Sellers', subtitle: 'Customer favorites', sortOrder: 8, isEnabled: true },
  { key: 'reviews', title: 'Customer Reviews', subtitle: 'What our customers say', sortOrder: 9, isEnabled: true },
  { key: 'newsletter', title: 'Newsletter', subtitle: 'Subscribe for updates', sortOrder: 10, isEnabled: true },
]

const BANNERS = [
  {
    title: 'Festive Collection 2024',
    subtitle: 'Handcrafted elegance for every celebration',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80',
    buttonText: 'Shop Now',
    linkUrl: 'category:sarees',
    position: 'HERO', sortOrder: 1, isActive: true,
  },
  {
    title: 'RANG BIRANGI Handmade Bangles',
    subtitle: 'Authentic Indian craftsmanship delivered to your door',
    imageUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1600&q=80',
    buttonText: 'Explore Bangles',
    linkUrl: 'category:handmade-bangles',
    position: 'HERO', sortOrder: 2, isActive: true,
  },
  {
    title: 'Flash Sale - Up to 40% Off',
    subtitle: 'Limited time offer on selected items',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600&q=80',
    buttonText: 'Grab Deals',
    linkUrl: 'section:flash_sale',
    position: 'MIDDLE', sortOrder: 1, isActive: true,
  },
]

const SETTINGS = [
  { key: 'brand_name', value: 'RANG BIRANGI' },
  { key: 'brand_tagline', value: 'Handcrafted Indian Elegance' },
  { key: 'upi_id', value: '9559974558@ptaxis' },
  { key: 'support_phone', value: '9559974558' },
  { key: 'support_email', value: 'care@rangbirangi.com' },
  { key: 'free_shipping_threshold', value: '999' },
  { key: 'shipping_cost', value: '49' },
  { key: 'cod_available', value: 'true' },
  { key: 'currency', value: 'INR' },
  { key: 'currency_symbol', value: '₹' },
  { key: 'instagram_url', value: 'https://instagram.com/rangbirangi' },
  { key: 'facebook_url', value: 'https://facebook.com/rangbirangi' },
  { key: 'whatsapp_url', value: 'https://wa.me/919559974558' },
]

export async function POST() {
  try {
    const results: any = { admin: false, categories: 0, sections: 0, banners: 0, settings: 0 }

    // 1. Ensure admin user
    const adminExists = await findOne<any>(COLLECTIONS.USERS, [
      { field: 'email', op: '==', value: ADMIN_EMAIL },
    ])
    if (!adminExists) {
      const admin = await create<any>(COLLECTIONS.USERS, {
        email: ADMIN_EMAIL,
        name: 'RANG BIRANGI Admin',
        passwordHash: hashPassword(ADMIN_PASSWORD),
        role: 'ADMIN',
        phone: '9559974558',
        status: 'ACTIVE',
        avatarUrl: null,
      })
      await create(COLLECTIONS.CART, { userId: admin.id, items: [] })
      await create(COLLECTIONS.WISHLIST, { userId: admin.id, items: [] })
      results.admin = true
    } else {
      // Ensure password is RB_1122 (in case it was changed)
      await update(COLLECTIONS.USERS, adminExists.id, {
        passwordHash: hashPassword(ADMIN_PASSWORD),
        role: 'ADMIN',
        status: 'ACTIVE',
      })
      results.admin = 'updated'
    }

    // 2. Ensure categories
    for (const cat of DEFAULT_CATEGORIES) {
      const existing = await findOne<any>(COLLECTIONS.CATEGORIES, [
        { field: 'slug', op: '==', value: cat.slug },
      ])
      if (!existing) {
        await create(COLLECTIONS.CATEGORIES, cat)
        results.categories++
      }
    }

    // 3. Ensure homepage sections
    for (const section of HOMEPAGE_SECTIONS) {
      const existing = await findOne<any>(COLLECTIONS.HOMEPAGE_SECTIONS, [
        { field: 'key', op: '==', value: section.key },
      ])
      if (!existing) {
        await create(COLLECTIONS.HOMEPAGE_SECTIONS, section)
        results.sections++
      }
    }

    // 4. Ensure banners
    for (const banner of BANNERS) {
      const existing = await findOne<any>(COLLECTIONS.BANNERS, [
        { field: 'title', op: '==', value: banner.title },
      ])
      if (!existing) {
        await create(COLLECTIONS.BANNERS, banner)
        results.banners++
      }
    }

    // 5. Ensure settings
    for (const setting of SETTINGS) {
      const existing = await findOne<any>(COLLECTIONS.SETTINGS, [
        { field: 'key', op: '==', value: setting.key },
      ])
      if (!existing) {
        await create(COLLECTIONS.SETTINGS, setting)
        results.settings++
      }
    }

    // Get final counts
    const allCategories = await findMany<any>(COLLECTIONS.CATEGORIES)
    const allProducts = await findMany<any>(COLLECTIONS.PRODUCTS)

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      created: results,
      counts: {
        categories: allCategories.length,
        products: allProducts.length,
      },
      adminCredentials: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    })
  } catch (e: any) {
    console.error('init error', e)
    return NextResponse.json({
      error: e.message,
      hint: 'Make sure FIREBASE_SERVICE_ACCOUNT env var is set.',
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/init',
    method: 'POST',
    description: 'Initialize database with admin user, categories, homepage sections, banners, and settings',
    usage: 'curl -X POST https://your-app.vercel.app/api/init',
    note: 'Idempotent — safe to call multiple times. Only creates data if it does not exist.',
  })
}
