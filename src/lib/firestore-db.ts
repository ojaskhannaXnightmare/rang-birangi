/**
 * RANG BIRANGI - Firestore Data Access Layer
 *
 * Clean abstraction over Firestore that mirrors the Prisma schema.
 * Each method returns plain objects (no Firebase DocumentSnapshot types).
 *
 * Collections (17): users, addresses, products, categories, orders, orderItems,
 * payments, shipments, cart, cartItems, wishlist, wishlistItems, reviews,
 * banners, homepageSections, settings, notifications, activityLogs
 */
import { getDb } from './firebase-admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { v4 as uuidv4 } from 'uuid'

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
  SESSIONS: 'sessions',
} as const

/** Generate a Firestore-compatible ID */
export function generateId(): string {
  return uuidv4().replace(/-/g, '').slice(0, 24)
}

/** Convert Firestore Timestamp fields to JS Date in a doc */
function normalizeDoc(doc: FirebaseFirestore.DocumentSnapshot): any {
  if (!doc.exists) return null
  const data = doc.data() || {}
  const normalized: any = { id: doc.id }
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      normalized[key] = value.toDate()
    } else if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      normalized[key] = new Timestamp(value.seconds, value.nanoseconds).toDate()
    } else {
      normalized[key] = value
    }
  }
  return normalized
}

/** Build a Firestore query from a simple where filter */
type WhereFilter = { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }

function buildQuery(
  collection: FirebaseFirestore.CollectionReference,
  where?: WhereFilter[],
  orderBy?: { field: string; direction: 'asc' | 'desc' },
  limit?: number,
  offset?: number
): FirebaseFirestore.Query {
  let q: FirebaseFirestore.Query = collection
  if (where) {
    for (const w of where) {
      q = q.where(w.field, w.op, w.value)
    }
  }
  if (orderBy) {
    q = q.orderBy(orderBy.field, orderBy.direction)
  }
  if (limit) q = q.limit(limit)
  if (offset) q = q.offset(offset)
  return q
}

// ============= GENERIC CRUD =============

export async function findById<T = any>(collection: string, id: string): Promise<T | null> {
  const db = getDb()
  const doc = await db.collection(collection).doc(id).get()
  return normalizeDoc(doc) as T | null
}

export async function findOne<T = any>(
  collection: string,
  where: WhereFilter[],
  orderBy?: { field: string; direction: 'asc' | 'desc' }
): Promise<T | null> {
  const db = getDb()
  const q = buildQuery(db.collection(collection), where, orderBy, 1)
  const snap = await q.get()
  if (snap.empty) return null
  return normalizeDoc(snap.docs[0]!) as T
}

export async function findMany<T = any>(
  collection: string,
  opts: {
    where?: WhereFilter[]
    orderBy?: { field: string; direction: 'asc' | 'desc' }
    limit?: number
    offset?: number
  } = {}
): Promise<T[]> {
  const db = getDb()
  const q = buildQuery(db.collection(collection), opts.where, opts.orderBy, opts.limit, opts.offset)
  const snap = await q.get()
  return snap.docs.map((d) => normalizeDoc(d) as T)
}

export async function countDocs(collection: string, where?: WhereFilter[]): Promise<number> {
  const db = getDb()
  const q = buildQuery(db.collection(collection), where)
  const snap = await q.count().get()
  return snap.data().count
}

export async function create<T = any>(
  collection: string,
  data: any,
  id?: string
): Promise<T> {
  const db = getDb()
  const docId = id || generateId()
  const now = new Date()
  const payload = {
    ...data,
    id: docId,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  }
  await db.collection(collection).doc(docId).set(payload)
  return payload as T
}

export async function createMany<T = any>(
  collection: string,
  items: any[]
): Promise<T[]> {
  const db = getDb()
  const now = new Date()
  const batch = db.batch()
  const results: any[] = []
  for (const item of items) {
    const id = item.id || generateId()
    const payload = { ...item, id, createdAt: item.createdAt || now, updatedAt: item.updatedAt || now }
    batch.set(db.collection(collection).doc(id), payload)
    results.push(payload)
  }
  await batch.commit()
  return results as T[]
}

export async function update<T = any>(
  collection: string,
  id: string,
  data: any
): Promise<T> {
  const db = getDb()
  const payload = { ...data, updatedAt: new Date() }
  // Remove undefined values (Firestore rejects them)
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
  await db.collection(collection).doc(id).set(payload, { merge: true })
  const updated = await db.collection(collection).doc(id).get()
  return normalizeDoc(updated) as T
}

export async function updateMany(
  collection: string,
  where: WhereFilter[],
  data: any
): Promise<number> {
  const db = getDb()
  const q = buildQuery(db.collection(collection), where)
  const snap = await q.get()
  if (snap.empty) return 0
  const batch = db.batch()
  const payload = { ...data, updatedAt: new Date() }
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
  for (const doc of snap.docs) {
    batch.set(doc.ref, payload, { merge: true })
  }
  await batch.commit()
  return snap.size
}

export async function upsert<T = any>(
  collection: string,
  id: string,
  updateData: any,
  createData?: any
): Promise<T> {
  const db = getDb()
  const existing = await db.collection(collection).doc(id).get()
  if (existing.exists) {
    return update<T>(collection, id, updateData)
  }
  return create<T>(collection, { ...(createData || updateData), id })
}

export async function remove(collection: string, id: string): Promise<void> {
  const db = getDb()
  await db.collection(collection).doc(id).delete()
}

export async function removeMany(collection: string, where: WhereFilter[]): Promise<number> {
  const db = getDb()
  const q = buildQuery(db.collection(collection), where)
  const snap = await q.get()
  if (snap.empty) return 0
  const batch = db.batch()
  for (const doc of snap.docs) batch.delete(doc.ref)
  await batch.commit()
  return snap.size
}

// ============= AGGREGATIONS =============

export async function sumField(
  collection: string,
  field: string,
  where?: WhereFilter[]
): Promise<number> {
  const docs = await findMany<any>(collection, { where })
  return docs.reduce((s, d) => s + (Number(d[field]) || 0), 0)
}

export async function groupByCount(
  collection: string,
  groupByField: string,
  where?: WhereFilter[]
): Promise<Record<string, number>> {
  const docs = await findMany<any>(collection, { where })
  const result: Record<string, number> = {}
  for (const d of docs) {
    const key = String(d[groupByField])
    result[key] = (result[key] || 0) + 1
  }
  return result
}

export async function groupBySum(
  collection: string,
  groupByField: string,
  sumField: string,
  where?: WhereFilter[]
): Promise<Array<{ key: string; sum: number; count: number }>> {
  const docs = await findMany<any>(collection, { where })
  const map = new Map<string, { sum: number; count: number }>()
  for (const d of docs) {
    const key = String(d[groupByField])
    const cur = map.get(key) || { sum: 0, count: 0 }
    cur.sum += Number(d[sumField]) || 0
    cur.count += 1
    map.set(key, cur)
  }
  return Array.from(map.entries()).map(([key, v]) => ({ key, sum: v.sum, count: v.count }))
}

// ============= HELPERS =============

/** Run multiple writes atomically (Firestore batch) */
export async function transaction<T>(fn: (batch: FirebaseFirestore.WriteBatch) => Promise<T> | T): Promise<T> {
  const db = getDb()
  const batch = db.batch()
  const result = await fn(batch)
  await batch.commit()
  return result
}

/** Server timestamp for use in create/update */
export const serverNow = () => new Date()

export { FieldValue }
