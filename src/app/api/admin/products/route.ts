import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, findOne, findById, create,
} from '@/lib/supabase-db'
import { requireAdmin } from '@/lib/auth'
import { toProductDTO, serializeDates } from '@/lib/helpers'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    let categoryDoc: any = null
    const where: any[] = []
    if (category) {
      categoryDoc = await findOne<any>(COLLECTIONS.CATEGORIES, [
        { field: 'slug', op: '==', value: category },
      ])
      if (categoryDoc) where.push({ field: 'categoryId', op: '==', value: categoryDoc.id })
    }

    let products = await findMany<any>(COLLECTIONS.PRODUCTS, {
      where: where.length > 0 ? where : undefined,
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 500,
    })

    // In-memory search
    if (search) {
      const q = search.toLowerCase()
      products = products.filter((p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      )
    }

    // Hydrate categories
    const catIds = Array.from(new Set(products.map((p) => p.categoryId).filter(Boolean)))
    const cats = await Promise.all(catIds.map((id) => findById<any>(COLLECTIONS.CATEGORIES, id)))
    const catMap = new Map(cats.filter(Boolean).map((c) => [c!.id, c!]))
    products.forEach((p) => { p.category = p.categoryId ? catMap.get(p.categoryId) : undefined })

    return NextResponse.json({
      products: serializeDates(products.map(toProductDTO)),
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

    // Check slug uniqueness
    const existing = await findOne<any>(COLLECTIONS.PRODUCTS, [
      { field: 'slug', op: '==', value: slug },
    ])
    if (existing) {
      return NextResponse.json({ error: 'A product with this name already exists' }, { status: 400 })
    }

    const product = await create<any>(COLLECTIONS.PRODUCTS, {
      name,
      slug,
      sku,
      description: description || '',
      material: material || null,
      weight: weight || null,
      careInstructions: careInstructions || null,
      categoryId,
      price: parseFloat(price),
      compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
      discountPercent: parseFloat(discountPercent || '0'),
      stock: parseInt(stock || '0'),
      lowStockThreshold: 5,
      images: Array.isArray(images) ? images : [],
      videos: Array.isArray(videos) ? videos : [],
      colors: Array.isArray(colors) ? colors : [],
      sizes: Array.isArray(sizes) ? sizes : [],
      tags: Array.isArray(tags) ? tags : [],
      rating: 0,
      reviewCount: 0,
      isFeatured: !!isFeatured,
      isTrending: !!isTrending,
      isNewArrival: !!isNewArrival,
      isFlashSale: !!isFlashSale,
      isBestSeller: !!isBestSeller,
      isHandmade: !!isHandmade,
      isPublished: isPublished !== undefined ? !!isPublished : true,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
    })

    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: session.id,
      action: 'PRODUCT_CREATED',
      entity: 'product',
      entityId: product.id,
      metadata: { name, sku },
    })

    return NextResponse.json({ product: serializeDates(toProductDTO(product)) })
  } catch (e: any) {
    console.error('admin product create error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
