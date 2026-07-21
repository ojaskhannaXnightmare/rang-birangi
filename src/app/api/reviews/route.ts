import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    const reviews = await db.review.findMany({
      where: {
        status: 'APPROVED',
        ...(productId && { productId }),
      },
      include: {
        user: { select: { name: true, avatarUrl: true } },
        product: { select: { id: true, name: true, slug: true, images: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ reviews })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Please login to review' }, { status: 401 })
    }
    const { productId, rating, title, comment, imageUrl } = await req.json()
    if (!productId || !rating || !comment) {
      return NextResponse.json({ error: 'productId, rating, comment required' }, { status: 400 })
    }

    const review = await db.review.create({
      data: {
        userId: session.id,
        productId,
        rating: parseInt(rating),
        title,
        comment,
        imageUrl,
        status: 'PENDING',
      },
    })

    // Update product rating
    const allReviews = await db.review.findMany({
      where: { productId, status: 'APPROVED' },
      select: { rating: true },
    })
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      await db.product.update({
        where: { id: productId },
        data: { rating: avg, reviewCount: allReviews.length },
      })
    }

    return NextResponse.json({ review })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
