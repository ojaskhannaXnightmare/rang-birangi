import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toProductDTO } from '@/lib/helpers'

async function getOrCreateWishlist(userId: string) {
  let wishlist = await db.wishlist.findUnique({
    where: { userId },
    include: {
      items: {
        include: { product: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!wishlist) {
    wishlist = await db.wishlist.create({
      data: { userId },
      include: { items: { include: { product: { include: { category: true } } } } },
    })
  }
  return wishlist
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ items: [] })
    const wishlist = await getOrCreateWishlist(session.id)
    return NextResponse.json({
      items: wishlist.items.map((i) => ({
        id: i.id,
        product: toProductDTO(i.product),
      })),
    })
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
    const wishlist = await getOrCreateWishlist(session.id)
    const existing = wishlist.items.find((i) => i.productId === productId)
    if (!existing) {
      await db.wishlistItem.create({
        data: { wishlistId: wishlist.id, productId },
      })
    }
    const updated = await getOrCreateWishlist(session.id)
    return NextResponse.json({
      items: updated.items.map((i) => ({
        id: i.id,
        product: toProductDTO(i.product),
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
    const { productId } = await req.json()
    const wishlist = await getOrCreateWishlist(session.id)
    const existing = wishlist.items.find((i) => i.productId === productId)
    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } })
    }
    const updated = await getOrCreateWishlist(session.id)
    return NextResponse.json({
      items: updated.items.map((i) => ({
        id: i.id,
        product: toProductDTO(i.product),
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
