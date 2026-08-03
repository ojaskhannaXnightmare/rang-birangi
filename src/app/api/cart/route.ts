import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, findById, findMany, create, update, remove,
} from '@/lib/supabase-db'
import { getSession } from '@/lib/auth'
import { toProductDTO, serializeDates } from '@/lib/helpers'

async function getOrCreateCart(userId: string) {
  let cart = await findOne<any>(COLLECTIONS.CART, [
    { field: 'userId', op: '==', value: userId },
  ])
  if (!cart) {
    cart = await create<any>(COLLECTIONS.CART, { userId, items: [] })
  }
  return cart
}

async function getCartWithItems(userId: string) {
  const cart = await getOrCreateCart(userId)
  const items = await findMany<any>(COLLECTIONS.CART_ITEMS, [
    { field: 'cartId', op: '==', value: cart.id },
  ], { field: 'createdAt', direction: 'asc' })

  // Hydrate products
  const productIds = Array.from(new Set(items.map((i) => i.productId).filter(Boolean)))
  const products = await Promise.all(
    productIds.map((id) => findById<any>(COLLECTIONS.PRODUCTS, id))
  )
  const productMap = new Map(products.filter(Boolean).map((p) => [p!.id, p!]))

  // Hydrate categories for products
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
    productId: i.productId,
    product: toProductDTO(productMap.get(i.productId) || { id: i.productId, name: 'Unknown', slug: '', sku: '', description: '', categoryId: '', price: 0, discountPercent: 0, stock: 0, images: [], videos: [], colors: [], sizes: [], tags: [], rating: 0, reviewCount: 0, isFeatured: false, isTrending: false, isNewArrival: false, isFlashSale: false, isBestSeller: false, isHandmade: false, isPublished: false }),
    quantity: i.quantity,
    color: i.color || null,
    size: i.size || null,
    savedForLater: !!i.savedForLater,
  }))
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ items: [] })
    const items = await getCartWithItems(session.id)
    return NextResponse.json({ items: serializeDates(items) })
  } catch (e: any) {
    // Silent fail — return empty cart instead of error
    console.error('cart GET error', e.message)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Please login to add items to cart' }, { status: 401 })
    }
    const { productId, quantity = 1, color, size } = await req.json()
    const cart = await getOrCreateCart(session.id)

    const items = await findMany<any>(COLLECTIONS.CART_ITEMS, [
      { field: 'cartId', op: '==', value: cart.id },
      { field: 'productId', op: '==', value: productId },
    ])
    const existing = items.find(
      (i) => i.color === (color || null) && i.size === (size || null) && !i.savedForLater
    )
    if (existing) {
      await update(COLLECTIONS.CART_ITEMS, existing.id, {
        quantity: existing.quantity + quantity,
      })
    } else {
      await create(COLLECTIONS.CART_ITEMS, {
        cartId: cart.id,
        productId,
        quantity,
        color: color || null,
        size: size || null,
        savedForLater: false,
      })
    }
    const result = await getCartWithItems(session.id)
    return NextResponse.json({ items: serializeDates(result) })
  } catch (e: any) {
    console.error('cart POST error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { itemId, quantity, savedForLater } = await req.json()
    const updateData: any = {}
    if (quantity !== undefined) updateData.quantity = Math.max(1, quantity)
    if (savedForLater !== undefined) updateData.savedForLater = savedForLater
    await update(COLLECTIONS.CART_ITEMS, itemId, updateData)
    const result = await getCartWithItems(session.id)
    return NextResponse.json({ items: serializeDates(result) })
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
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })
    await remove(COLLECTIONS.CART_ITEMS, itemId)
    const result = await getCartWithItems(session.id)
    return NextResponse.json({ items: serializeDates(result) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
