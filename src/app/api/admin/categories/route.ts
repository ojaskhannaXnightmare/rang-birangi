/**
 * RANG BIRANGI - Admin Categories API
 *
 * GET /api/admin/categories — List all categories (including inactive)
 * POST /api/admin/categories — Create a new category
 * PATCH /api/admin/categories — Update a category
 * DELETE /api/admin/categories?id=xxx — Delete a category
 *
 * Also: GET /api/admin/categories?action=ensure-defaults
 * Creates the 4 default categories if they don't exist.
 */
import { NextRequest, NextResponse } from 'next/server'
import { COLLECTIONS, findMany, findOne, create, update, remove } from '@/lib/firestore-db'
import { requireAdmin } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

const DEFAULT_CATEGORIES = [
  {
    name: 'Handmade Bangles',
    slug: 'handmade-bangles',
    description: 'Handcrafted bangles made by Indian artisans using traditional techniques.',
    imageUrl: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80',
    sortOrder: 1, isActive: true, iconName: null,
  },
  {
    name: 'Earrings',
    slug: 'earrings',
    description: 'Exquisite earrings for every occasion.',
    imageUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80',
    sortOrder: 2, isActive: true, iconName: null,
  },
  {
    name: 'Sarees',
    slug: 'sarees',
    description: 'Elegant handwoven sarees from across India.',
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80',
    sortOrder: 3, isActive: true, iconName: null,
  },
  {
    name: 'Kurtis',
    slug: 'kurtis',
    description: 'Comfortable and stylish kurtis for everyday wear.',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80',
    sortOrder: 4, isActive: true, iconName: null,
  },
]

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    // Ensure default categories exist
    if (action === 'ensure-defaults') {
      let created = 0
      for (const cat of DEFAULT_CATEGORIES) {
        const existing = await findOne<any>(COLLECTIONS.CATEGORIES, [
          { field: 'slug', op: '==', value: cat.slug },
        ])
        if (!existing) {
          await create(COLLECTIONS.CATEGORIES, cat)
          created++
        }
      }
      return NextResponse.json({
        success: true,
        message: `${created} default categories created`,
        created,
      })
    }

    const categories = await findMany<any>(COLLECTIONS.CATEGORIES, {
      orderBy: { field: 'sortOrder', direction: 'asc' },
    })
    return NextResponse.json({ categories: serializeDates(categories) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { name, description, imageUrl, sortOrder, isActive } = body

    if (!name) {
      return NextResponse.json({ error: 'Category name required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

    const existing = await findOne<any>(COLLECTIONS.CATEGORIES, [
      { field: 'slug', op: '==', value: slug },
    ])
    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 })
    }

    const category = await create<any>(COLLECTIONS.CATEGORIES, {
      name,
      slug,
      description: description || '',
      imageUrl: imageUrl || '',
      sortOrder: sortOrder || 99,
      isActive: isActive !== false,
      iconName: null,
    })

    return NextResponse.json({ category: serializeDates(category) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { id, ...updates } = body

    if (updates.name) {
      updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }

    const category = await update<any>(COLLECTIONS.CATEGORIES, id, updates)
    return NextResponse.json({ category: serializeDates(category) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Check if products exist in this category
    const products = await findMany<any>(COLLECTIONS.PRODUCTS, {
      where: [{ field: 'categoryId', op: '==', value: id }],
    })
    if (products.length > 0) {
      return NextResponse.json({
        error: `Cannot delete: ${products.length} product(s) use this category. Move them first.`,
      }, { status: 400 })
    }

    await remove(COLLECTIONS.CATEGORIES, id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
