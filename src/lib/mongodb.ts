/**
 * RANG BIRANGI - MongoDB Connection Utility
 *
 * Production-ready MongoDB Atlas connection.
 * Reads MONGODB_URI from environment variable.
 *
 * Usage:
 *   import { mongoDB, isMongoConfigured } from '@/lib/mongodb'
 *   if (isMongoConfigured()) {
 *     const db = await mongoDB()
 *     const products = db.collection('products')
 *   }
 *
 * Fallback: If MONGODB_URI is not set, the platform uses Prisma + SQLite.
 */
import { MongoClient, Db } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || ''
const MONGODB_DB = process.env.MONGODB_DB || 'RangBirangi'

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | null
  mongoConnPromise: Promise<MongoClient> | null
}

let cachedClient: MongoClient | null = globalForMongo.mongoClient
let cachedConnPromise: Promise<MongoClient> | null = globalForMongo.mongoConnPromise

export function isMongoConfigured(): boolean {
  return MONGODB_URI.length > 0 && MONGODB_URI.startsWith('mongodb')
}

export async function connectMongo(): Promise<MongoClient> {
  if (!isMongoConfigured()) {
    throw new Error('MONGODB_URI is not configured. Set it in your .env file.')
  }

  if (cachedClient) return cachedClient

  if (!cachedConnPromise) {
    const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    cachedConnPromise = client.connect().then((c) => {
      cachedClient = c
      globalForMongo.mongoClient = c
      return c
    })
  }

  return cachedConnPromise
}

export async function getMongoDB(): Promise<Db> {
  const client = await connectMongo()
  return client.db(MONGODB_DB)
}

/**
 * Get the MongoDB connection status for the /api/health endpoint.
 * Returns ok=true if MongoDB is configured AND reachable.
 */
export async function checkMongoConnection(): Promise<{
  configured: boolean
  connected: boolean
  dbName?: string
  error?: string
}> {
  if (!isMongoConfigured()) {
    return { configured: false, connected: false }
  }

  try {
    const client = await connectMongo()
    await client.db(MONGODB_DB).command({ ping: 1 })
    return { configured: true, connected: true, dbName: MONGODB_DB }
  } catch (e: any) {
    return { configured: true, connected: false, dbName: MONGODB_DB, error: e.message }
  }
}

/**
 * MongoDB data access layer — mirrors Prisma schema collections.
 * Use these helpers to perform CRUD on MongoDB collections.
 *
 * Collections:
 *   users, products, categories, orders, orderItems, payments, shipments,
 *   cart, cartItems, wishlist, wishlistItems, reviews, addresses,
 *   banners, homepageSections, settings, notifications, activityLogs
 */
export const COLLECTIONS = {
  USERS: 'users',
  ADDRESSES: 'addresses',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER_ITEMS: 'orderItems',
  PAYMENTS: 'payments',
  SHIPMENTS: 'shipments',
  CART: 'cart',
  CART_ITEMS: 'cartItems',
  WISHLIST: 'wishlist',
  WISHLIST_ITEMS: 'wishlistItems',
  REVIEWS: 'reviews',
  BANNERS: 'banners',
  HOMEPAGE_SECTIONS: 'homepageSections',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activityLogs',
} as const

/**
 * Ensure all required indexes exist on MongoDB collections.
 * Call this once on application startup.
 */
export async function ensureMongoIndexes(): Promise<void> {
  if (!isMongoConfigured()) return
  const db = await getMongoDB()

  await Promise.all([
    db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true }),
    db.collection(COLLECTIONS.USERS).createIndex({ phone: 1 }, { sparse: true }),
    db.collection(COLLECTIONS.PRODUCTS).createIndex({ slug: 1 }, { unique: true }),
    db.collection(COLLECTIONS.PRODUCTS).createIndex({ sku: 1 }, { unique: true }),
    db.collection(COLLECTIONS.PRODUCTS).createIndex({ categoryId: 1 }),
    db.collection(COLLECTIONS.PRODUCTS).createIndex({
      name: 'text', description: 'text', tags: 'text',
    }),
    db.collection(COLLECTIONS.CATEGORIES).createIndex({ slug: 1 }, { unique: true }),
    db.collection(COLLECTIONS.ORDERS).createIndex({ orderNumber: 1 }, { unique: true }),
    db.collection(COLLECTIONS.ORDERS).createIndex({ userId: 1 }),
    db.collection(COLLECTIONS.ORDERS).createIndex({ status: 1 }),
    db.collection(COLLECTIONS.CART).createIndex({ userId: 1 }, { unique: true }),
    db.collection(COLLECTIONS.WISHLIST).createIndex({ userId: 1 }, { unique: true }),
    db.collection(COLLECTIONS.REVIEWS).createIndex({ productId: 1, status: 1 }),
    db.collection(COLLECTIONS.SETTINGS).createIndex({ key: 1 }, { unique: true }),
    db.collection(COLLECTIONS.ACTIVITY_LOGS).createIndex({ createdAt: -1 }),
  ])
}
