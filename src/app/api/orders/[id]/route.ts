import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findById, update, findOne, findMany, create,
} from '@/lib/supabase-db'
import { getSession } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const order = await findById<any>(COLLECTIONS.ORDERS, id)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    if (order.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Hydrate
    order.items = await findMany<any>(COLLECTIONS.ORDER_ITEMS, [
      { field: 'orderId', op: '==', value: order.id },
    ])
    order.payment = await findOne<any>(COLLECTIONS.PAYMENTS, [
      { field: 'orderId', op: '==', value: order.id },
    ])
    order.shipment = await findOne<any>(COLLECTIONS.SHIPMENTS, [
      { field: 'orderId', op: '==', value: order.id },
    ])
    order.user = await findById<any>(COLLECTIONS.USERS, order.userId)

    return NextResponse.json({ order: serializeDates(order) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const { id } = await params
    const body = await req.json()
    const { status, trackingNumber, courier, adminNote } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (trackingNumber) updateData.trackingNumber = trackingNumber
    if (courier) updateData.courier = courier
    if (adminNote) updateData.notes = adminNote

    const order = await update<any>(COLLECTIONS.ORDERS, id, updateData)

    // Update shipment
    const shipment = await findOne<any>(COLLECTIONS.SHIPMENTS, [
      { field: 'orderId', op: '==', value: id },
    ])
    const shipUpdate: any = {}
    if (trackingNumber) shipUpdate.trackingNumber = trackingNumber
    if (courier) shipUpdate.courier = courier
    if (status === 'SHIPPED') {
      shipUpdate.status = 'PICKED_UP'
      shipUpdate.shippedAt = new Date()
    }
    if (status === 'DELIVERED') {
      shipUpdate.status = 'DELIVERED'
      shipUpdate.deliveredAt = new Date()
    }
    if (shipment) {
      await update(COLLECTIONS.SHIPMENTS, shipment.id, shipUpdate)
    } else if (Object.keys(shipUpdate).length > 0) {
      await create(COLLECTIONS.SHIPMENTS, {
        orderId: id,
        courier: courier || 'Delhivery',
        trackingNumber: trackingNumber || null,
        status: status === 'SHIPPED' ? 'PICKED_UP' : 'INITIATED',
        shippedAt: status === 'SHIPPED' ? new Date() : null,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
        estimatedDelivery: new Date(Date.now() + 5 * 86400000),
      })
    }

    // Activity log
    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: session.id,
      action: 'ORDER_UPDATED',
      entity: 'order',
      entityId: id,
      metadata: { status, trackingNumber },
    })

    return NextResponse.json({ order: serializeDates(order) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
