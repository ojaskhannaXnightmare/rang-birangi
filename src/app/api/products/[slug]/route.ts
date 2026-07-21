import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toProductDTO } from '@/lib/helpers'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: { user: { select: { name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })
    if (!product || !product.isPublished) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({
      ...toProductDTO(product),
      reviews: product.reviews,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
