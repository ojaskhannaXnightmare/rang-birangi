import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, findMany, create, remove, findById,
} from '@/lib/firestore-db'
import { getSession } from '@/lib/auth'
import { toProductDTO, serializeDates } from '@/lib/helpers'

async function getWishlistItems(userId: string) {
  let wishlist = await findOne<any>(COLLECTIONS.WISHLIST, [
    { field: 'userId', op: '==', value: userId },
  ])
  if (!wishlist) {
    wishlist = await create<any>(COLLECTIONS.WISHLIST, { userId, items: [] })
  }
  const items = await findMany<any>(COLLECTIONS.WISHLIST_ITEMS, [
    { field: 'wishlistId', op: '==', value: wishlist.id },
  ], { field: 'createdAt', direction: 'desc' })

  // Hydrate products
  const productIds = Array.from(new Set(items.map((i) => i.productId).filter(Boolean)))
  const products = await Promise.all(
    productIds.map((id) => findById<any>(COLLECTIONS.PRODUCTS, id))
  )
  const productMap = new Map(products.filter(Boolean).map((p) => [p!.id, p!]))

  // Hydrate categories
  const catIds = new Set(products.filter(Boolean).map((p) => p!.categoryId).filter(Boolean))
  const cats = await Promise.all(
    Array.from(catIds).map((id) => findById<any>(COLLECTIONS.CATEGORIES, id as string))
  )
  const catMap = new Map(cats.filter(Boolean).map((c) => [c!.id, c!]))
  products.forEach((p) => {
    if (p && p.categoryId) p.category = catMap.get(p.categoryId)
  })

  return items.map((i) => ({
    id: i.id,
    product: toProductDTO(productMap.get(i.productId) || { id: i.productId, name: 'Unknown', slug: '', sku: '', description: '', categoryId: '', price: 0, discountPercent: 0, stock: 0, images: [], videos: [], colors: [], sizes: [], tags: [], rating: 0, reviewCount: 0, isFeatured: false, isTrending: false, isNewArrival: false, isFlashSale: false, isBestSeller: false, isHandmade: false, isPublished: false }),
  }))
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ items: [] })
    const items = await getWishlistItems(session.id)
    return NextResponse.json({ items: serializeDates(items) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Please login' }, { status: 401 })
    }
    const { productId } = await req.json()
    let wishlist = await findOne<any>(COLLECTIONS.WISHLIST, [
      { field: 'userId', op: '==', value: session.id },
    ])
    if (!wishlist) {
      wishlist = await create<any>(COLLECTIONS.WISHLIST, { userId: session.id, items: [] })
    }
    const existing = await findMany<any>(COLLECTIONS.WISHLIST_ITEMS, [
      { field: 'wishlistId', op: '==', value: wishlist.id },
      { field: 'productId', op: '==', value: productId },
    ])
    if (existing.length === 0) {
      await create(COLLECTIONS.WISHLIST_ITEMS, {
        wishlistId: wishlist.id,
        productId,
      })
    }
    const items = await getWishlistItems(session.id)
    return NextResponse.json({ items: serializeDates(items) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { productId } = await req.json()
    let wishlist = await findOne<any>(COLLECTIONS.WISHLIST, [
      { field: 'userId', op: '==', value: session.id },
    ])
    if (!wishlist) {
      return NextResponse.json({ items: [] })
    }
    const items = await findMany<any>(COLLECTIONS.WISHLIST_ITEMS, [
      { field: 'wishlistId', op: '==', value: wishlist.id },
      { field: 'productId', op: '==', value: productId },
    ])
    for (const i of items) {
      await remove(COLLECTIONS.WISHLIST_ITEMS, i.id)
    }
    const result = await getWishlistItems(session.id)
    return NextResponse.json({ items: serializeDates(result) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
