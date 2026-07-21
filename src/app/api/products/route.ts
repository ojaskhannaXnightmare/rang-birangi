import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { toProductDTO } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const filter = searchParams.get('filter') // trending, new_arrivals, flash_sale, featured, handmade, best_sellers
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'newest'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = { isPublished: true }
    if (category) {
      const cat = await db.category.findUnique({ where: { slug: category } })
      if (cat) where.categoryId = cat.id
    }
    if (filter === 'trending') where.isTrending = true
    if (filter === 'new_arrivals') where.isNewArrival = true
    if (filter === 'flash_sale') where.isFlashSale = true
    if (filter === 'featured') where.isFeatured = true
    if (filter === 'handmade') where.isHandmade = true
    if (filter === 'best_sellers') where.isBestSeller = true
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ]
    }
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price_low') orderBy = { price: 'asc' }
    if (sort === 'price_high') orderBy = { price: 'desc' }
    if (sort === 'rating') orderBy = { rating: 'desc' }
    if (sort === 'popular') orderBy = { reviewCount: 'desc' }

    const products = await db.product.findMany({
      where,
      include: { category: true },
      orderBy,
      take: limit,
      skip: offset,
    })

    return NextResponse.json({
      products: products.map(toProductDTO),
      total: products.length,
    })
  } catch (e: any) {
    console.error('products list error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
