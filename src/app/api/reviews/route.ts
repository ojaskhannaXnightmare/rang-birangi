import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, create, update, findById,
} from '@/lib/supabase-db'
import { getSession } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    const reviews = await findMany<any>(COLLECTIONS.REVIEWS, {
      where: [
        { field: 'status', op: '==', value: 'APPROVED' },
        ...(productId ? [{ field: 'productId', op: '==', value: productId }] : []),
      ],
      orderBy: { field: 'createdAt', direction: 'desc' },
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

    const review = await create<any>(COLLECTIONS.REVIEWS, {
      userId: session.id,
      productId,
      rating: parseInt(rating),
      title: title || null,
      comment,
      imageUrl: imageUrl || null,
      status: 'PENDING',
      adminReply: null,
    })

    // Update product rating
    const allReviews = await findMany<any>(COLLECTIONS.REVIEWS, [
      { field: 'productId', op: '==', value: productId },
      { field: 'status', op: '==', value: 'APPROVED' },
    ])
    if (allReviews.length > 0) {
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
      await update(COLLECTIONS.PRODUCTS, productId, {
        rating: avg,
        reviewCount: allReviews.length,
      })
    }

    return NextResponse.json({ review: serializeDates(review) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
