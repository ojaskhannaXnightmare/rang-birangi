import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, findMany,
} from '@/lib/supabase-db'
import { toProductDTO, serializeDates } from '@/lib/helpers'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const product = await findOne<any>(COLLECTIONS.PRODUCTS, [
      { field: 'slug', op: '==', value: slug },
    ])
    if (!product || !product.isPublished) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Fetch approved reviews
    const reviews = await findMany<any>(COLLECTIONS.REVIEWS, [
      { field: 'productId', op: '==', value: product.id },
      { field: 'status', op: '==', value: 'APPROVED' },
    ], { field: 'createdAt', direction: 'desc' })

    // Hydrate review users
    const userIds = new Set(reviews.map((r) => r.userId).filter(Boolean))
    const users = await Promise.all(
      Array.from(userIds).map((id) =>
        findOne<any>(COLLECTIONS.USERS, [{ field: 'id', op: '==', value: id }])
      )
    )
    const userMap = new Map(users.filter(Boolean).map((u) => [u!.id, u!]))
    reviews.forEach((r) => {
      r.user = r.userId ? userMap.get(r.userId) : null
    })

    return NextResponse.json(serializeDates({
      ...toProductDTO(product),
      reviews: reviews.slice(0, 20),
    }))
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
