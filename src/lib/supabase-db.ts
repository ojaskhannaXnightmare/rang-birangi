/**
 * RANG BIRANGI - Supabase Data Access Layer
 *
 * Same interface as firestore-db.ts — drop-in replacement.
 * Each method returns plain objects.
 *
 * Uses Supabase (PostgreSQL) as the backend.
 * Tables match the COLLECTIONS constant below.
 */
import { getSupabase } from './supabase-admin'

export const COLLECTIONS = {
  USERS: 'users',
  ADDRESSES: 'addresses',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PAYMENTS: 'payments',
  SHIPMENTS: 'shipments',
  CART: 'cart',
  CART_ITEMS: 'cart_items',
  WISHLIST: 'wishlist',
  WISHLIST_ITEMS: 'wishlist_items',
  REVIEWS: 'reviews',
  BANNERS: 'banners',
  HOMEPAGE_SECTIONS: 'homepage_sections',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  ACTIVITY_LOGS: 'activity_logs',
  SESSIONS: 'sessions',
} as const

/** Generate a UUID */
export function generateId(): string {
  return crypto.randomUUID()
}

/** Convert camelCase to snake_case for field names */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/** Recursively convert all object keys from camelCase to snake_case */
function keysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(keysToSnakeCase)
  if (obj instanceof Date) return obj.toISOString()
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [k, v] of Object.entries(obj)) {
      result[toSnakeCase(k)] = keysToSnakeCase(v)
    }
    return result
  }
  return obj
}

/** Convert snake_case to camelCase for field names */
function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/** Recursively convert all object keys from snake_case to camelCase */
function keysToCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(keysToCamelCase)
  if (obj instanceof Date) return obj
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [k, v] of Object.entries(obj)) {
      result[toCamelCase(k)] = keysToCamelCase(v)
    }
    return result
  }
  return obj
}

type WhereFilter = { field: string; op: string; value: any }

/** Map Firestore-style operators to Supabase filter operators */
function buildFilter(supabaseQuery: any, where: WhereFilter[]) {
  for (const w of where) {
    const field = toSnakeCase(w.field)
    switch (w.op) {
      case '==':
        supabaseQuery = supabaseQuery.eq(field, w.value)
        break
      case '!=':
        supabaseQuery = supabaseQuery.neq(field, w.value)
        break
      case '>':
        supabaseQuery = supabaseQuery.gt(field, w.value)
        break
      case '>=':
        supabaseQuery = supabaseQuery.gte(field, w.value)
        break
      case '<':
        supabaseQuery = supabaseQuery.lt(field, w.value)
        break
      case '<=':
        supabaseQuery = supabaseQuery.lte(field, w.value)
        break
      case 'in':
        supabaseQuery = supabaseQuery.in(field, w.value)
        break
      case 'array-contains':
        supabaseQuery = supabaseQuery.contains(field, [w.value])
        break
      default:
        supabaseQuery = supabaseQuery.eq(field, w.value)
    }
  }
  return supabaseQuery
}

// ============= GENERIC CRUD =============

export async function findById<T = any>(collection: string, id: string): Promise<T | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from(collection).select('*').eq('id', id).single()
  if (error) {
    if (error.code === 'PGRST116') return null // No rows
    console.error(`findById error (${collection}):`, error.message)
    return null
  }
  return keysToCamelCase(data) as T
}

export async function findOne<T = any>(
  collection: string,
  where: WhereFilter[],
  orderBy?: { field: string; direction: 'asc' | 'desc' }
): Promise<T | null> {
  const supabase = getSupabase()
  let query = supabase.from(collection).select('*')
  query = buildFilter(query, where)
  if (orderBy) {
    query = query.order(toSnakeCase(orderBy.field), { ascending: orderBy.direction === 'asc' })
  }
  query = query.limit(1)
  const { data, error } = await query
  if (error) {
    console.error(`findOne error (${collection}):`, error.message)
    return null
  }
  return (data && data.length > 0) ? (keysToCamelCase(data[0]) as T) : null
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
  const supabase = getSupabase()
  let query = supabase.from(collection).select('*')
  if (opts.where) {
    query = buildFilter(query, opts.where)
  }
  if (opts.orderBy) {
    query = query.order(toSnakeCase(opts.orderBy.field), { ascending: opts.orderBy.direction === 'asc' })
  }
  if (opts.limit) query = query.limit(opts.limit)
  if (opts.offset) query = query.range(opts.offset, opts.offset + (opts.limit || 1000) - 1)
  const { data, error } = await query
  if (error) {
    console.error(`findMany error (${collection}):`, error.message)
    return []
  }
  return (data || []).map(keysToCamelCase) as T[]
}

export async function countDocs(collection: string, where?: WhereFilter[]): Promise<number> {
  const supabase = getSupabase()
  let query = supabase.from(collection).select('*', { count: 'exact', head: true })
  if (where) {
    query = buildFilter(query, where)
  }
  const { count, error } = await query
  if (error) {
    console.error(`countDocs error (${collection}):`, error.message)
    return 0
  }
  return count || 0
}

export async function create<T = any>(
  collection: string,
  data: any,
  id?: string
): Promise<T> {
  const supabase = getSupabase()
  const docId = id || generateId()
  const now = new Date().toISOString()
  // Convert all keys to snake_case for Postgres
  const snakeData = keysToSnakeCase(data)
  const payload = {
    ...snakeData,
    id: docId,
    created_at: snakeData.created_at || snakeData.createdAt || now,
    updated_at: snakeData.updated_at || snakeData.updatedAt || now,
  }
  delete payload.createdAt
  delete payload.updatedAt

  const { data: result, error } = await supabase.from(collection).insert(payload).select('*').single()
  if (error) {
    console.error(`create error (${collection}):`, error.message, JSON.stringify(payload))
    throw new Error(`Database error: ${error.message}`)
  }
  return keysToCamelCase(result) as T
}

export async function createMany<T = any>(
  collection: string,
  items: any[]
): Promise<T[]> {
  const supabase = getSupabase()
  const now = new Date().toISOString()
  const payload = items.map((item) => {
    const docId = item.id || generateId()
    const snakeData = keysToSnakeCase(item)
    const p = {
      ...snakeData,
      id: docId,
      created_at: snakeData.created_at || snakeData.createdAt || now,
      updated_at: snakeData.updated_at || snakeData.updatedAt || now,
    }
    delete p.createdAt
    delete p.updatedAt
    return p
  })
  const { data, error } = await supabase.from(collection).insert(payload).select('*')
  if (error) {
    console.error(`createMany error (${collection}):`, error.message)
    throw new Error(`Database error: ${error.message}`)
  }
  return (data || []).map(keysToCamelCase) as T[]
}

export async function update<T = any>(
  collection: string,
  id: string,
  data: any
): Promise<T> {
  const supabase = getSupabase()
  // Convert all keys to snake_case
  const snakeData = keysToSnakeCase(data)
  const payload: any = { ...snakeData, updated_at: new Date().toISOString() }
  // Remove undefined values
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
  delete payload.createdAt
  delete payload.updatedAt
  delete payload.id

  const { data: result, error } = await supabase
    .from(collection)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single()
  if (error) {
    console.error(`update error (${collection}):`, error.message)
    throw new Error(`Database error: ${error.message}`)
  }
  return keysToCamelCase(result) as T
}

export async function updateMany(
  collection: string,
  where: WhereFilter[],
  data: any
): Promise<number> {
  const supabase = getSupabase()
  const snakeData = keysToSnakeCase(data)
  const payload: any = { ...snakeData, updated_at: new Date().toISOString() }
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
  delete payload.createdAt
  delete payload.updatedAt

  let query = supabase.from(collection).update(payload)
  query = buildFilter(query, where)
  const { data: result, error } = await query.select('id')
  if (error) {
    console.error(`updateMany error (${collection}):`, error.message)
    return 0
  }
  return result?.length || 0
}

export async function upsert<T = any>(
  collection: string,
  id: string,
  updateData: any,
  createData?: any
): Promise<T> {
  const existing = await findById<any>(collection, id)
  if (existing) {
    return update<T>(collection, id, updateData)
  }
  return create<T>(collection, { ...(createData || updateData), id })
}

export async function remove(collection: string, id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from(collection).delete().eq('id', id)
  if (error) {
    console.error(`remove error (${collection}):`, error.message)
    throw new Error(`Database error: ${error.message}`)
  }
}

export async function removeMany(collection: string, where: WhereFilter[]): Promise<number> {
  const supabase = getSupabase()
  let query = supabase.from(collection).delete()
  query = buildFilter(query, where)
  const { data, error } = await query.select('id')
  if (error) {
    console.error(`removeMany error (${collection}):`, error.message)
    return 0
  }
  return data?.length || 0
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

/**
 * Run multiple writes. Supabase JS client doesn't support true transactions,
 * but we execute sequentially. For true atomicity, use Postgres RPC.
 */
export async function transaction<T>(fn: (batch: any) => Promise<T> | T): Promise<T> {
  // Just run the function — no actual batching in Supabase JS client
  // The "batch" param is a dummy object
  const dummyBatch = {
    set: () => dummyBatch,
    update: () => dummyBatch,
    delete: () => dummyBatch,
    create: () => dummyBatch,
    commit: async () => {},
  }
  return await fn(dummyBatch)
}

/** Server timestamp for use in create/update */
export const serverNow = () => new Date()

/** FieldValue stub (Firestore compat — not used in Supabase) */
export const FieldValue = {
  serverTimestamp: () => new Date().toISOString(),
  increment: (n: number) => n,
  arrayUnion: (arr: any[]) => arr,
  arrayRemove: () => [],
}
