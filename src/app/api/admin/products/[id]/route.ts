import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { toProductDTO } from '@/lib/helpers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await req.json()

    const update: any = { ...body }
    if (typeof body.price === 'string') update.price = parseFloat(body.price)
    if (typeof body.compareAtPrice === 'string') update.compareAtPrice = parseFloat(body.compareAtPrice)
    if (typeof body.discountPercent === 'string') update.discountPercent = parseFloat(body.discountPercent)
    if (typeof body.stock === 'string') update.stock = parseInt(body.stock)
    if (Array.isArray(body.images)) update.images = body.images.join(',')
    if (Array.isArray(body.videos)) update.videos = body.videos.join(',')
    if (Array.isArray(body.colors)) update.colors = body.colors.join(',')
    if (Array.isArray(body.sizes)) update.sizes = body.sizes.join(',')
    if (Array.isArray(body.tags)) update.tags = body.tags.join(',')

    // Don't allow slug/sku to be re-validated
    delete update.id
    delete update.sku

    const product = await db.product.update({
      where: { id },
      data: update,
    })

    await db.activityLog.create({
      data: {
        userId: session.id,
        action: 'PRODUCT_UPDATED',
        entity: 'product',
        entityId: id,
        metadata: JSON.stringify({ updated: Object.keys(body) }),
      },
    })

    return NextResponse.json({ product: toProductDTO(product) })
  } catch (e: any) {
    console.error('admin product update error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    await db.product.delete({ where: { id } })
    await db.activityLog.create({
      data: {
        userId: session.id,
        action: 'PRODUCT_DELETED',
        entity: 'product',
        entityId: id,
        metadata: '{}',
      },
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
