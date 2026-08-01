import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, findOne, findById,
} from '@/lib/firestore-db'
import { toProductDTO, serializeDates } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const filter = searchParams.get('filter')
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clauses
    const where: any[] = [{ field: 'isPublished', op: '==', value: true }]

    let categoryDoc: any = null
    if (category) {
      categoryDoc = await findOne<any>(COLLECTIONS.CATEGORIES, [
        { field: 'slug', op: '==', value: category },
      ])
      if (categoryDoc) where.push({ field: 'categoryId', op: '==', value: categoryDoc.id })
    }

    if (filter === 'trending') where.push({ field: 'isTrending', op: '==', value: true })
    if (filter === 'new_arrivals') where.push({ field: 'isNewArrival', op: '==', value: true })
    if (filter === 'flash_sale') where.push({ field: 'isFlashSale', op: '==', value: true })
    if (filter === 'featured') where.push({ field: 'isFeatured', op: '==', value: true })
    if (filter === 'handmade') where.push({ field: 'isHandmade', op: '==', value: true })
    if (filter === 'best_sellers') where.push({ field: 'isBestSeller', op: '==', value: true })

    // Note: Firestore doesn't support OR queries across different fields easily,
    // and doesn't support `contains` (it uses `array-contains` for arrays).
    // For text search, we filter in memory after fetch.
    let orderBy: { field: string; direction: 'asc' | 'desc' } | undefined
    if (sort === 'newest') orderBy = { field: 'createdAt', direction: 'desc' }
    else if (sort === 'price_low') orderBy = { field: 'price', direction: 'asc' }
    else if (sort === 'price_high') orderBy = { field: 'price', direction: 'desc' }
    else if (sort === 'rating') orderBy = { field: 'rating', direction: 'desc' }
    else if (sort === 'popular') orderBy = { field: 'reviewCount', direction: 'desc' }

    let products = await findMany<any>(COLLECTIONS.PRODUCTS, { where, orderBy, limit: 200 })

    // In-memory filtering for search (Firestore doesn't do full-text search)
    if (search) {
      const q = search.toLowerCase()
      products = products.filter((p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      )
    }

    // Price range filter (in memory to support range)
    if (minPrice) {
      const min = parseFloat(minPrice)
      products = products.filter((p) => p.price >= min)
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice)
      products = products.filter((p) => p.price <= max)
    }

    // Apply limit after in-memory filters
    products = products.slice(0, limit)

    // Hydrate categories
    const catIds = new Set(products.map((p) => p.categoryId).filter(Boolean))
    const cats = await Promise.all(
      Array.from(catIds).map((id) => findById<any>(COLLECTIONS.CATEGORIES, id))
    )
    const catMap = new Map(cats.filter(Boolean).map((c) => [c!.id, c!]))
    products.forEach((p) => {
      p.category = p.categoryId ? catMap.get(p.categoryId) : undefined
    })

    return NextResponse.json({
      products: serializeDates(products.map(toProductDTO)),
      total: products.length,
    })
  } catch (e: any) {
    console.error('products list error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
