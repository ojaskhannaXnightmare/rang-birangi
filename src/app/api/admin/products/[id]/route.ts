import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, update, remove, create,
} from '@/lib/firestore-db'
import { requireAdmin } from '@/lib/auth'
import { toProductDTO, serializeDates } from '@/lib/helpers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin()
    const { id } = await params
    const body = await req.json()

    const updateData: any = { ...body }
    // Type conversions
    if (typeof body.price === 'string') updateData.price = parseFloat(body.price)
    if (typeof body.compareAtPrice === 'string') updateData.compareAtPrice = body.compareAtPrice ? parseFloat(body.compareAtPrice) : null
    if (typeof body.discountPercent === 'string') updateData.discountPercent = parseFloat(body.discountPercent)
    if (typeof body.stock === 'string') updateData.stock = parseInt(body.stock)
    // Arrays are stored natively in Firestore

    // Don't allow id/sku to be overwritten
    delete updateData.id
    delete updateData.sku

    const product = await update<any>(COLLECTIONS.PRODUCTS, id, updateData)

    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: session.id,
      action: 'PRODUCT_UPDATED',
      entity: 'product',
      entityId: id,
      metadata: { updated: Object.keys(body) },
    })

    return NextResponse.json({ product: serializeDates(toProductDTO(product)) })
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
    await remove(COLLECTIONS.PRODUCTS, id)
    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: session.id,
      action: 'PRODUCT_DELETED',
      entity: 'product',
      entityId: id,
      metadata: {},
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
