import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { toProductDTO } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    const where: any = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ]
    }
    if (category) {
      const cat = await db.category.findUnique({ where: { slug: category } })
      if (cat) where.categoryId = cat.id
    }

    const products = await db.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      products: products.map(toProductDTO),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const body = await req.json()
    const {
      name, description, sku, material, weight, careInstructions,
      categoryId, price, compareAtPrice, discountPercent, stock,
      images, videos, colors, sizes, tags,
      isFeatured, isTrending, isNewArrival, isFlashSale, isBestSeller, isHandmade,
      isPublished, seoTitle, seoDescription,
    } = body

    if (!name || !sku || !categoryId || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const product = await db.product.create({
      data: {
        name, slug, sku, description, material, weight, careInstructions,
        categoryId, price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        discountPercent: parseFloat(discountPercent || '0'),
        stock: parseInt(stock || '0'),
        images: Array.isArray(images) ? images.join(',') : images,
        videos: Array.isArray(videos) ? videos.join(',') : videos || null,
        colors: Array.isArray(colors) ? colors.join(',') : colors,
        sizes: Array.isArray(sizes) ? sizes.join(',') : sizes,
        tags: Array.isArray(tags) ? tags.join(',') : tags,
        isFeatured: !!isFeatured,
        isTrending: !!isTrending,
        isNewArrival: !!isNewArrival,
        isFlashSale: !!isFlashSale,
        isBestSeller: !!isBestSeller,
        isHandmade: !!isHandmade,
        isPublished: isPublished !== undefined ? !!isPublished : true,
        seoTitle, seoDescription,
      },
    })

    await db.activityLog.create({
      data: {
        userId: session.id,
        action: 'PRODUCT_CREATED',
        entity: 'product',
        entityId: product.id,
        metadata: JSON.stringify({ name, sku }),
      },
    })

    return NextResponse.json({ product: toProductDTO(product) })
  } catch (e: any) {
    console.error('admin product create error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
