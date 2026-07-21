import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const reviews = await db.review.findMany({
      include: {
        user: { select: { name: true, email: true, avatarUrl: true } },
        product: { select: { id: true, name: true, slug: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ reviews })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { id, status, adminReply } = await req.json()

    const update: any = {}
    if (status) update.status = status
    if (adminReply !== undefined) update.adminReply = adminReply

    const review = await db.review.update({
      where: { id },
      data: update,
    })

    // Recalc product rating
    if (status) {
      const allReviews = await db.review.findMany({
        where: { productId: review.productId, status: 'APPROVED' },
        select: { rating: true },
      })
      await db.product.update({
        where: { id: review.productId },
        data: {
          rating: allReviews.length > 0
            ? allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
            : 0,
          reviewCount: allReviews.length,
        },
      })
    }

    await db.activityLog.create({
      data: {
        userId: session.id,
        action: 'REVIEW_UPDATED',
        entity: 'review',
        entityId: id,
        metadata: JSON.stringify({ status, adminReply }),
      },
    })

    return NextResponse.json({ review })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
