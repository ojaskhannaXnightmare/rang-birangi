import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, update, create, findById, findOne,
} from '@/lib/firestore-db'
import { requireAdmin } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    await requireAdmin()
    const reviews = await findMany<any>(COLLECTIONS.REVIEWS, {
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 500,
    })

    // Hydrate users + products
    const userIds = Array.from(new Set(reviews.map((r) => r.userId).filter(Boolean)))
    const users = await Promise.all(userIds.map((id) => findById<any>(COLLECTIONS.USERS, id)))
    const userMap = new Map(users.filter(Boolean).map((u) => [u!.id, u!]))

    const productIds = Array.from(new Set(reviews.map((r) => r.productId).filter(Boolean)))
    const products = await Promise.all(productIds.map((id) => findById<any>(COLLECTIONS.PRODUCTS, id)))
    const productMap = new Map(products.filter(Boolean).map((p) => [p!.id, p!]))

    reviews.forEach((r) => {
      r.user = r.userId ? userMap.get(r.userId) : null
      r.product = r.productId ? productMap.get(r.productId) : null
    })

    return NextResponse.json({ reviews: serializeDates(reviews) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { id, status, adminReply } = await req.json()

    const updateData: any = {}
    if (status) updateData.status = status
    if (adminReply !== undefined) updateData.adminReply = adminReply

    const review = await update<any>(COLLECTIONS.REVIEWS, id, updateData)

    // Recalc product rating
    if (status) {
      const allReviews = await findMany<any>(COLLECTIONS.REVIEWS, [
        { field: 'productId', op: '==', value: review.productId },
        { field: 'status', op: '==', value: 'APPROVED' },
      ])
      await update(COLLECTIONS.PRODUCTS, review.productId, {
        rating: allReviews.length > 0
          ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
          : 0,
        reviewCount: allReviews.length,
      })
    }

    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: session.id,
      action: 'REVIEW_UPDATED',
      entity: 'review',
      entityId: id,
      metadata: { status, adminReply },
    })

    return NextResponse.json({ review: serializeDates(review) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Unused but kept for completeness
export const _findOne = findOne
