import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toProductDTO } from '@/lib/helpers'

async function getOrCreateCart(userId: string) {
  let cart = await db.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
  if (!cart) {
    cart = await db.cart.create({
      data: { userId },
      include: { items: { include: { product: { include: { category: true } } } } },
    })
  }
  return cart
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ items: [] })
    }
    const cart = await getOrCreateCart(session.id)
    return NextResponse.json({
      items: cart.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        product: toProductDTO(i.product),
        quantity: i.quantity,
        color: i.color,
        size: i.size,
        savedForLater: i.savedForLater,
      })),
    })
  } catch (e: any) {
    console.error('cart GET error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
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

    const existing = cart.items.find(
      (i) => i.productId === productId && i.color === color && i.size === size && !i.savedForLater
    )
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    } else {
      await db.cartItem.create({
        data: { cartId: cart.id, productId, quantity, color, size },
      })
    }
    const updated = await getOrCreateCart(session.id)
    return NextResponse.json({
      items: updated.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        product: toProductDTO(i.product),
        quantity: i.quantity,
        color: i.color,
        size: i.size,
        savedForLater: i.savedForLater,
      })),
    })
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
    const update: any = {}
    if (quantity !== undefined) update.quantity = Math.max(1, quantity)
    if (savedForLater !== undefined) update.savedForLater = savedForLater
    await db.cartItem.update({ where: { id: itemId }, data: update })
    const cart = await getOrCreateCart(session.id)
    return NextResponse.json({
      items: cart.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        product: toProductDTO(i.product),
        quantity: i.quantity,
        color: i.color,
        size: i.size,
        savedForLater: i.savedForLater,
      })),
    })
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
    await db.cartItem.delete({ where: { id: itemId } })
    const cart = await getOrCreateCart(session.id)
    return NextResponse.json({
      items: cart.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        product: toProductDTO(i.product),
        quantity: i.quantity,
        color: i.color,
        size: i.size,
        savedForLater: i.savedForLater,
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
