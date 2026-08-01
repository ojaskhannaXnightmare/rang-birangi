/**
 * RANG BIRANGI - Helpers
 * Firestore stores arrays natively, so products have images: string[] etc.
 */

export interface ProductDTO {
  id: string
  name: string
  slug: string
  sku: string
  description: string
  material: string | null
  weight: string | null
  careInstructions: string | null
  categoryId: string
  price: number
  compareAtPrice: number | null
  discountPercent: number
  stock: number
  lowStockThreshold?: number
  images: string[]
  videos: string[]
  colors: string[]
  sizes: string[]
  tags: string[]
  rating: number
  reviewCount: number
  isFeatured: boolean
  isTrending: boolean
  isNewArrival: boolean
  isFlashSale: boolean
  isBestSeller: boolean
  isHandmade: boolean
  isPublished: boolean
  seoTitle?: string | null
  seoDescription?: string | null
  createdAt?: Date
  updatedAt?: Date
  category?: { id: string; name: string; slug: string }
}

/** Normalize any product doc (from Firestore) to ProductDTO */
export function toProductDTO(p: any): ProductDTO {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    description: p.description || '',
    material: p.material ?? null,
    weight: p.weight ?? null,
    careInstructions: p.careInstructions ?? null,
    categoryId: p.categoryId,
    price: Number(p.price) || 0,
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    discountPercent: Number(p.discountPercent) || 0,
    stock: Number(p.stock) || 0,
    lowStockThreshold: Number(p.lowStockThreshold) || 5,
    images: Array.isArray(p.images) ? p.images : [],
    videos: Array.isArray(p.videos) ? p.videos : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    tags: Array.isArray(p.tags) ? p.tags : [],
    rating: Number(p.rating) || 0,
    reviewCount: Number(p.reviewCount) || 0,
    isFeatured: !!p.isFeatured,
    isTrending: !!p.isTrending,
    isNewArrival: !!p.isNewArrival,
    isFlashSale: !!p.isFlashSale,
    isBestSeller: !!p.isBestSeller,
    isHandmade: !!p.isHandmade,
    isPublished: p.isPublished !== false,
    seoTitle: p.seoTitle ?? null,
    seoDescription: p.seoDescription ?? null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : undefined,
  }
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string | { seconds: number; nanoseconds: number } | undefined): string {
  if (!date) return ''
  let d: Date
  if (typeof date === 'string') d = new Date(date)
  else if (date instanceof Date) d = date
  else if (typeof date === 'object' && 'seconds' in date) d = new Date(date.seconds * 1000)
  else d = new Date(date as any)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function relativeTime(date: Date | string | { seconds: number; nanoseconds: number } | undefined): string {
  if (!date) return 'just now'
  let d: Date
  if (typeof date === 'string') d = new Date(date)
  else if (date instanceof Date) d = date
  else if (typeof date === 'object' && 'seconds' in date) d = new Date(date.seconds * 1000)
  else d = new Date(date as any)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (day > 0) return `${day}d ago`
  if (hr > 0) return `${hr}h ago`
  if (min > 0) return `${min}m ago`
  return 'just now'
}

export function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING_PAYMENT: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    CONFIRMED: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    PACKED: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    SHIPPED: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    OUT_FOR_DELIVERY: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    DELIVERED: 'bg-green-500/20 text-green-300 border-green-500/40',
    CANCELLED: 'bg-red-500/20 text-red-300 border-red-500/40',
    RETURNED: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
    REFUNDED: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  }
  return map[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/40'
}

export function paymentStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    PAID: 'bg-green-500/20 text-green-300 border-green-500/40',
    SUCCESS: 'bg-green-500/20 text-green-300 border-green-500/40',
    FAILED: 'bg-red-500/20 text-red-300 border-red-500/40',
    REFUNDED: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
  }
  return map[status] || 'bg-gray-500/20 text-gray-300 border-gray-500/40'
}

/** Convert Date/Timestamp to ISO string for JSON serialization in API responses */
export function serializeDates(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (obj instanceof Date) return obj.toISOString()
  if (typeof obj === 'object' && 'seconds' in obj && 'nanoseconds' in obj) {
    return new Date(obj.seconds * 1000).toISOString()
  }
  if (Array.isArray(obj)) return obj.map(serializeDates)
  if (typeof obj === 'object') {
    const result: any = {}
    for (const [k, v] of Object.entries(obj)) result[k] = serializeDates(v)
    return result
  }
  return obj
}
