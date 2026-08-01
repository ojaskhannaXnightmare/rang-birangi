/**
 * RANG BIRANGI - Firestore Seed Script
 *
 * Seeds: admin user, customer, categories, products, banners,
 * homepage sections, settings, reviews, sample orders
 *
 * Usage:
 *   bun run scripts/seed-firestore.ts
 *
 * Requires Firebase service account in .env:
 *   FIREBASE_PROJECT_ID=...
 *   FIREBASE_CLIENT_EMAIL=...
 *   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
 *   (or FIREBASE_SERVICE_ACCOUNT as full JSON)
 */
import 'dotenv/config'
import { getDb } from '../src/lib/firebase-admin'
import { COLLECTIONS, create, findOne } from '../src/lib/firestore-db'
import crypto from 'crypto'

const ADMIN_EMAIL = 'admin@rangbirangi.com'
const ADMIN_PASSWORD = 'admin123'

function hashPassword(s: string): string {
  return crypto.createHash('sha256').update(s + 'rangbirangi_salt').digest('hex')
}

async function upsertByField(collection: string, field: string, value: any, data: any) {
  const existing = await findOne<any>(collection, [{ field, op: '==', value }])
  if (existing) {
    const { update } = await import('../src/lib/firestore-db')
    return update(collection, existing.id, data)
  }
  return create(collection, data)
}

async function main() {
  console.log('🌱 Seeding RANG BIRANGI Firestore database...')

  // 1. Admin user
  const admin = await upsertByField(COLLECTIONS.USERS, 'email', ADMIN_EMAIL, {
    email: ADMIN_EMAIL,
    name: 'RANG BIRANGI Admin',
    passwordHash: hashPassword(ADMIN_PASSWORD),
    role: 'ADMIN',
    phone: '9559974558',
    status: 'ACTIVE',
    avatarUrl: null,
  }) as any
  console.log(`  ✓ Admin: ${admin.email} / ${ADMIN_PASSWORD}`)

  // Demo customer
  const customer = await upsertByField(COLLECTIONS.USERS, 'email', 'customer@demo.com', {
    email: 'customer@demo.com',
    name: 'Demo Customer',
    passwordHash: hashPassword('demo123'),
    role: 'CUSTOMER',
    phone: '9000000000',
    status: 'ACTIVE',
    avatarUrl: null,
  }) as any
  console.log(`  ✓ Customer: ${customer.email} / demo123`)

  // Cart + wishlist for both users
  await upsertByField(COLLECTIONS.CART, 'userId', admin.id, { userId: admin.id, items: [] })
  await upsertByField(COLLECTIONS.CART, 'userId', customer.id, { userId: customer.id, items: [] })
  await upsertByField(COLLECTIONS.WISHLIST, 'userId', admin.id, { userId: admin.id, items: [] })
  await upsertByField(COLLECTIONS.WISHLIST, 'userId', customer.id, { userId: customer.id, items: [] })

  // 2. Categories
  const categories = [
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
  const categoryDocs: any[] = []
  for (const c of categories) {
    categoryDocs.push(await upsertByField(COLLECTIONS.CATEGORIES, 'slug', c.slug, c) as any)
  }
  console.log(`  ✓ ${categoryDocs.length} categories`)
  const [banglesCat, earringsCat, sareesCat, kurtisCat] = categoryDocs

  // 3. Products
  const productsData = [
    {
      name: 'Rajasthani Lac Bangles Set', slug: 'rajasthani-lac-bangles-set', sku: 'RB-BAN-001',
      description: 'A stunning set of 8 handcrafted Rajasthani lac bangles adorned with mirror work and intricate detailing. Each bangle is made by skilled artisans of Jaipur using traditional techniques passed down generations. Perfect for festivals, weddings, and cultural celebrations.',
      material: 'Lac (Natural Resin), Glass Mirrors', weight: '180 g',
      careInstructions: 'Keep away from water and perfume. Store in a dry place.',
      categoryId: banglesCat.id, price: 1299, compareAtPrice: 1999, stock: 45,
      images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'],
      colors: ['Red', 'Maroon', 'Gold', 'Green'], sizes: ['2.4', '2.6', '2.8'],
      tags: ['wedding', 'festive', 'traditional', 'handcrafted'],
      isFeatured: true, isTrending: true, isBestSeller: true, isHandmade: true, isFlashSale: true,
      discountPercent: 35,
    },
    {
      name: 'Hyderabadi Pearl Bangles', slug: 'hyderabadi-pearl-bangles', sku: 'RB-BAN-002',
      description: 'Elegant Hyderabadi pearl bangles with delicate gold-plated work. These timeless pieces feature natural freshwater pearls set on a copper base with antique gold finish.',
      material: 'Copper, Gold Plating, Freshwater Pearls', weight: '95 g',
      careInstructions: 'Wipe with soft cloth. Avoid contact with chemicals.',
      categoryId: banglesCat.id, price: 2499, compareAtPrice: 3499, stock: 28,
      images: ['https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80'],
      colors: ['Gold', 'White'], sizes: ['2.4', '2.6', '2.8'],
      tags: ['pearl', 'elegant', 'luxury', 'bridal'],
      isFeatured: true, isBestSeller: true, isHandmade: true,
      discountPercent: 28,
    },
    {
      name: 'Glass Kada Bangles Pair', slug: 'glass-kada-bangles-pair', sku: 'RB-BAN-003',
      description: 'A pair of premium glass kada bangles with intricate meenakari work. These wide bangles feature traditional Indian enamel art with floral motifs in vibrant colors.',
      material: 'Glass, Meenakari Enamel', weight: '220 g',
      careInstructions: 'Handle with care. Avoid dropping on hard surfaces.',
      categoryId: banglesCat.id, price: 1899, compareAtPrice: 2599, stock: 32,
      images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'],
      colors: ['Blue', 'Green', 'Pink'], sizes: ['2.4', '2.6', '2.8'],
      tags: ['kada', 'meenakari', 'statement', 'handcrafted'],
      isNewArrival: true, isHandmade: true,
      discountPercent: 27,
    },
    {
      name: 'Antique Silver Bangles Stack', slug: 'antique-silver-bangles-stack', sku: 'RB-BAN-004',
      description: 'A stack of 12 antique-finish silver-tone bangles with traditional tribal motifs. These bangles draw inspiration from Kutch tribal jewelry with oxidized silver finish.',
      material: 'Brass, Oxidized Silver Finish', weight: '260 g',
      careInstructions: 'Store in airtight bag to prevent tarnishing.',
      categoryId: banglesCat.id, price: 1599, compareAtPrice: 2199, stock: 50,
      images: ['https://images.unsplash.com/photo-1599643477864-50b6e7e1eee8?w=800&q=80'],
      colors: ['Silver'], sizes: ['2.4', '2.6', '2.8'],
      tags: ['tribal', 'boho', 'oxidized', 'silver'],
      isTrending: true, isHandmade: true,
      discountPercent: 27,
    },
    {
      name: 'Kundan Polki Earrings', slug: 'kundan-polki-earrings', sku: 'RB-EAR-001',
      description: 'Majestic Kundan Polki earrings with uncut diamond simulants set in gold-plated brass. These chandbali style earrings feature intricate kundan work with pearl drops.',
      material: 'Brass, Gold Plating, Kundan, Glass Stones', weight: '45 g',
      careInstructions: 'Store in jewelry box. Avoid water contact.',
      categoryId: earringsCat.id, price: 2199, compareAtPrice: 3199, stock: 38,
      images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'],
      colors: ['Gold', 'Multi'], sizes: ['One Size'],
      tags: ['bridal', 'kundan', 'chandbali', 'luxury'],
      isFeatured: true, isBestSeller: true, isFlashSale: true,
      discountPercent: 31,
    },
    {
      name: 'Jhumka Gold Pearl Earrings', slug: 'jhumka-gold-pearl-earrings', sku: 'RB-EAR-002',
      description: 'Classic South Indian temple-style jhumka earrings with gold finish and pearl beads. These traditional bell-shaped jhumkas feature intricate carvings.',
      material: 'Silver, Gold Plating, Pearls', weight: '28 g',
      careInstructions: 'Avoid contact with perfume and water.',
      categoryId: earringsCat.id, price: 1499, compareAtPrice: 2199, stock: 60,
      images: ['https://images.unsplash.com/photo-1635764998894-3e26b8e2e2b8?w=800&q=80'],
      colors: ['Gold', 'White'], sizes: ['One Size'],
      tags: ['jhumka', 'temple', 'south-indian', 'traditional'],
      isTrending: true, isBestSeller: true,
      discountPercent: 32,
    },
    {
      name: 'Meenakari Hoop Earrings', slug: 'meenakari-hoop-earrings', sku: 'RB-EAR-003',
      description: 'Vibrant Meenakari hoop earrings with multicolor enamel work. These lightweight hoops feature traditional Rajasthani enamel art with floral patterns.',
      material: 'Brass, Meenakari Enamel', weight: '18 g',
      careInstructions: 'Wipe clean with dry cloth.',
      categoryId: earringsCat.id, price: 899, compareAtPrice: 1299, stock: 75,
      images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'],
      colors: ['Multi', 'Blue', 'Green'], sizes: ['One Size'],
      tags: ['hoops', 'meenakari', 'colorful', 'everyday'],
      isNewArrival: true, isHandmade: true,
      discountPercent: 31,
    },
    {
      name: 'Studded Diamond Earrings', slug: 'studded-diamond-earrings', sku: 'RB-EAR-004',
      description: 'Elegant everyday diamond-studded earrings in sterling silver. These minimalist studs feature brilliant-cut cubic zirconia stones that sparkle like real diamonds.',
      material: '925 Sterling Silver, Cubic Zirconia', weight: '4 g',
      careInstructions: 'Clean with soft cloth. Store separately.',
      categoryId: earringsCat.id, price: 1199, compareAtPrice: 1799, stock: 90,
      images: ['https://images.unsplash.com/photo-1635764998894-3e26b8e2e2b8?w=800&q=80'],
      colors: ['Silver', 'White'], sizes: ['One Size'],
      tags: ['minimal', 'everyday', 'office', 'diamond'],
      isFeatured: true,
      discountPercent: 33,
    },
    {
      name: 'Kanjivaram Silk Saree', slug: 'kanjivaram-silk-saree', sku: 'RB-SAR-001',
      description: 'Pure Kanjivaram silk saree with traditional zari border and temple motifs. Handwoven by master weavers of Kanchipuram, this saree features a rich pallu with peacock designs and gold zari work.',
      material: 'Pure Mulberry Silk, Gold Zari', weight: '750 g',
      careInstructions: 'Dry clean only. Store in muslin cloth.',
      categoryId: sareesCat.id, price: 12999, compareAtPrice: 18999, stock: 12,
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80'],
      colors: ['Red', 'Maroon', 'Green', 'Blue'], sizes: ['Free Size'],
      tags: ['bridal', 'silk', 'kanjivaram', 'heirloom'],
      isFeatured: true, isBestSeller: true, isHandmade: true,
      discountPercent: 32,
    },
    {
      name: 'Banarasi Brocade Saree', slug: 'banarasi-brocade-saree', sku: 'RB-SAR-002',
      description: 'Luxurious Banarasi brocade saree with intricate gold and silver zari work. Handwoven in Varanasi by traditional weavers, this saree features the classic jaal pattern with floral motifs all over.',
      material: 'Pure Silk, Gold Zari', weight: '680 g',
      careInstructions: 'Dry clean only. Avoid folding along zari.',
      categoryId: sareesCat.id, price: 8999, compareAtPrice: 12999, stock: 18,
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80'],
      colors: ['Maroon', 'Pink', 'Purple'], sizes: ['Free Size'],
      tags: ['banarasi', 'wedding', 'festive', 'zari'],
      isTrending: true, isHandmade: true,
      discountPercent: 31,
    },
    {
      name: 'Cotton Handloom Saree', slug: 'cotton-handloom-saree', sku: 'RB-SAR-003',
      description: 'Lightweight cotton handloom saree with traditional ikat patterns. Woven by artisans of Andhra Pradesh, this saree features geometric ikat designs on the body and a contrast pallu.',
      material: 'Handloom Cotton', weight: '450 g',
      careInstructions: 'Gentle hand wash. Do not bleach.',
      categoryId: sareesCat.id, price: 2499, compareAtPrice: 3499, stock: 40,
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80'],
      colors: ['Blue', 'Green', 'Orange', 'Yellow'], sizes: ['Free Size'],
      tags: ['cotton', 'everyday', 'ikat', 'handloom'],
      isNewArrival: true, isHandmade: true, isBestSeller: true,
      discountPercent: 29,
    },
    {
      name: 'Chiffon Designer Saree', slug: 'chiffon-designer-saree', sku: 'RB-SAR-004',
      description: 'Flowing chiffon designer saree with sequin embellishments and contrast border. This lightweight saree drapes beautifully and is perfect for parties and evening events.',
      material: 'Premium Chiffon, Sequins', weight: '380 g',
      careInstructions: 'Dry clean or gentle hand wash.',
      categoryId: sareesCat.id, price: 3999, compareAtPrice: 5999, stock: 25,
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80'],
      colors: ['Black', 'Wine', 'Navy'], sizes: ['Free Size'],
      tags: ['party', 'chiffon', 'sequins', 'designer'],
      isFlashSale: true,
      discountPercent: 33,
    },
    {
      name: 'Anarkali Cotton Kurti', slug: 'anarkali-cotton-kurti', sku: 'RB-KUR-001',
      description: 'Elegant Anarkali-style cotton kurti with intricate block print and mirror work on yoke. This flared kurti features a fitted bodice with traditional Rajasthani block prints and gathers below the waist.',
      material: '100% Cotton', weight: '320 g',
      careInstructions: 'Machine wash gentle. Do not bleach.',
      categoryId: kurtisCat.id, price: 999, compareAtPrice: 1499, stock: 80,
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80'],
      colors: ['Blue', 'Maroon', 'Green', 'Yellow'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      tags: ['anarkali', 'cotton', 'block-print', 'everyday'],
      isFeatured: true, isBestSeller: true, isNewArrival: true,
      discountPercent: 33,
    },
    {
      name: 'Embroidered Rayon Kurti', slug: 'embroidered-rayon-kurti', sku: 'RB-KUR-002',
      description: 'Stylish rayon kurti with beautiful thread embroidery on neckline and sleeves. This straight-cut kurti features floral thread work in contrast colors, side slits for comfort, and a flattering fit.',
      material: 'Premium Rayon', weight: '280 g',
      careInstructions: 'Hand wash recommended. Dry in shade.',
      categoryId: kurtisCat.id, price: 799, compareAtPrice: 1199, stock: 100,
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80'],
      colors: ['Pink', 'Blue', 'Green', 'White'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      tags: ['embroidered', 'rayon', 'straight', 'everyday'],
      isTrending: true,
      discountPercent: 33,
    },
    {
      name: 'Silk Straight Kurti', slug: 'silk-straight-kurti', sku: 'RB-KUR-003',
      description: 'Premium silk blend straight kurti with zari border and elegant prints. This sophisticated kurti features a silk-blend fabric with a rich sheen, traditional zari border on sleeves and hem.',
      material: 'Silk Blend', weight: '350 g',
      careInstructions: 'Dry clean recommended.',
      categoryId: kurtisCat.id, price: 1499, compareAtPrice: 2299, stock: 55,
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80'],
      colors: ['Maroon', 'Royal Blue', 'Green'], sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      tags: ['silk', 'festive', 'zari', 'elegant'],
      isFeatured: true, isHandmade: true,
      discountPercent: 35,
    },
    {
      name: 'Long A-Line Kurti', slug: 'long-a-line-kurti', sku: 'RB-KUR-004',
      description: 'Calf-length A-line kurti with digital floral prints and side slits. This contemporary kurti features vibrant digital prints, an A-line silhouette that flatters all body types, and comfortable side slits.',
      material: 'Viscose Blend', weight: '300 g',
      careInstructions: 'Machine wash cold. Tumble dry low.',
      categoryId: kurtisCat.id, price: 899, compareAtPrice: 1399, stock: 70,
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80'],
      colors: ['Multi', 'Blue', 'Pink'], sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
      tags: ['a-line', 'digital-print', 'everyday', 'long'],
      isNewArrival: true,
      discountPercent: 36,
    },
  ]
  for (const p of productsData) {
    await upsertByField(COLLECTIONS.PRODUCTS, 'slug', p.slug, {
      ...p, rating: 0, reviewCount: 0, lowStockThreshold: 5, isPublished: true,
      seoTitle: null, seoDescription: null, videos: [],
    })
  }
  console.log(`  ✓ ${productsData.length} products`)

  // 4. Banners
  const bannersData = [
    {
      title: 'Festive Collection 2024', subtitle: 'Handcrafted elegance for every celebration',
      imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1600&q=80',
      buttonText: 'Shop Now', linkUrl: 'category:sarees',
      position: 'HERO', sortOrder: 1, isActive: true,
    },
    {
      title: 'RANG BIRANGI Handmade Bangles', subtitle: 'Authentic Indian craftsmanship delivered to your door',
      imageUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1600&q=80',
      buttonText: 'Explore Bangles', linkUrl: 'category:handmade-bangles',
      position: 'HERO', sortOrder: 2, isActive: true,
    },
    {
      title: 'Flash Sale - Up to 40% Off', subtitle: 'Limited time offer on selected items',
      imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1600&q=80',
      buttonText: 'Grab Deals', linkUrl: 'section:flash_sale',
      position: 'MIDDLE', sortOrder: 1, isActive: true,
    },
  ]
  for (const b of bannersData) {
    await upsertByField(COLLECTIONS.BANNERS, 'title', b.title, b)
  }
  console.log(`  ✓ ${bannersData.length} banners`)

  // 5. Homepage sections
  const sections = [
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
  for (const s of sections) {
    await upsertByField(COLLECTIONS.HOMEPAGE_SECTIONS, 'key', s.key, s)
  }
  console.log(`  ✓ ${sections.length} homepage sections`)

  // 6. Settings
  const settingsData = [
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
  for (const s of settingsData) {
    await upsertByField(COLLECTIONS.SETTINGS, 'key', s.key, s)
  }
  console.log(`  ✓ ${settingsData.length} settings`)

  // 7. Sample reviews
  const sampleProducts = await findManyLocal(COLLECTIONS.PRODUCTS, [], { limit: 6 })
  const sampleReviews = [
    { rating: 5, title: 'Beautiful craftsmanship!', comment: 'The bangles exceeded my expectations. The colors are even more vibrant in person. Highly recommend RANG BIRANGI!' },
    { rating: 5, title: 'Perfect for wedding', comment: 'Bought these for my sister\'s wedding. Everyone loved them. Quality is excellent.' },
    { rating: 4, title: 'Good value', comment: 'Nice product for the price. Delivery was quick. Will buy again.' },
    { rating: 5, title: 'Authentic handmade', comment: 'You can feel the authenticity. Real handmade quality, not mass-produced.' },
    { rating: 5, title: 'Stunning!', comment: 'Absolutely love it. The pictures don\'t do justice. Must buy.' },
    { rating: 4, title: 'Satisfied customer', comment: 'Good quality and beautiful design. Slightly expensive but worth it.' },
  ]
  for (let i = 0; i < sampleProducts.length && i < sampleReviews.length; i++) {
    const product = sampleProducts[i]
    const review = sampleReviews[i]
    await create(COLLECTIONS.REVIEWS, {
      userId: customer.id, productId: product.id,
      rating: review.rating, title: review.title, comment: review.comment,
      status: 'APPROVED', adminReply: null, imageUrl: null,
    })
  }
  console.log(`  ✓ ${sampleReviews.length} sample reviews`)

  // 8. Sample orders for admin dashboard
  const allProducts = await findManyLocal(COLLECTIONS.PRODUCTS, [], { limit: 10 })
  for (let i = 0; i < 8; i++) {
    const product = allProducts[i % allProducts.length]
    const qty = (i % 3) + 1
    const subtotal = product.price * qty
    const shipping = subtotal > 999 ? 0 : 49
    const total = subtotal + shipping
    const status = ['DELIVERED', 'DELIVERED', 'SHIPPED', 'CONFIRMED', 'PENDING_PAYMENT', 'CANCELLED', 'DELIVERED', 'OUT_FOR_DELIVERY'][i]
    const paymentStatus = status === 'DELIVERED' || status === 'SHIPPED' ? 'PAID' : (status === 'CANCELLED' ? 'FAILED' : 'PENDING')

    const order = await create(COLLECTIONS.ORDERS, {
      orderNumber: `RB${Date.now().toString().slice(-6)}${i}`,
      userId: customer.id,
      addressSnapshot: {
        fullName: 'Demo Customer', phone: '9000000000',
        houseNo: '12', street: 'MG Road', area: 'Indiranagar',
        city: 'Bengaluru', state: 'Karnataka', pincode: '560038',
      },
      subtotal, discount: 0, shippingCost: shipping, tax: 0, total,
      status, paymentMethod: i % 2 === 0 ? 'UPI' : 'COD',
      paymentStatus, paymentRef: null, trackingNumber: null, courier: null,
      notes: null, invoiceNumber: `INV-${Date.now()}-${i}`,
      createdAt: new Date(Date.now() - i * 86400000 * 2),
    })

    await create(COLLECTIONS.ORDER_ITEMS, {
      orderId: order.id, productId: product.id,
      name: product.name, sku: product.sku, price: product.price,
      quantity: qty, color: null, size: null,
      image: (product.images && product.images[0]) || null,
      total: subtotal,
    })

    if (status !== 'PENDING_PAYMENT' && status !== 'CANCELLED') {
      await create(COLLECTIONS.PAYMENTS, {
        orderId: order.id, method: i % 2 === 0 ? 'UPI' : 'COD',
        amount: total, status: paymentStatus,
        txnRef: null, upiId: i % 2 === 0 ? '9559974558@ptaxis' : null,
      })
    }
  }
  console.log(`  ✓ 8 sample orders`)

  // 9. Activity logs
  for (const action of ['ADMIN_LOGIN', 'PRODUCT_CREATED', 'ORDER_UPDATED', 'HOMEPAGE_UPDATED']) {
    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: admin.id, action, entity: action.split('_')[0].toLowerCase(),
      entityId: null, metadata: {},
    })
  }
  console.log(`  ✓ activity logs`)

  console.log('\n✅ RANG BIRANGI Firestore database seeded successfully!')
  console.log('\n📋 Login Credentials:')
  console.log(`   Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  console.log(`   Customer: customer@demo.com / demo123`)
}

// Local findMany wrapper to avoid name collision
async function findManyLocal(collection: string, where: any[], opts: any) {
  const { findMany } = await import('../src/lib/firestore-db')
  return findMany(collection, { where: where.length > 0 ? where : undefined, ...opts })
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    // Don't disconnect Firebase - it's a long-lived connection
    process.exit(0)
  })
