import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        shipment: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Allow owner or admin
    if (order.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ order })
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

    const update: any = {}
    if (status) update.status = status
    if (trackingNumber) update.trackingNumber = trackingNumber
    if (courier) update.courier = courier
    if (adminNote) update.notes = adminNote

    const order = await db.order.update({
      where: { id },
      data: update,
    })

    // Update shipment if relevant
    if (status === 'SHIPPED' || trackingNumber) {
      await db.shipment.upsert({
        where: { orderId: id },
        update: {
          ...(trackingNumber && { trackingNumber }),
          ...(courier && { courier }),
          ...(status === 'SHIPPED' && { status: 'PICKED_UP', shippedAt: new Date() }),
        },
        create: {
          orderId: id,
          courier: courier || 'Delhivery',
          trackingNumber,
          status: status === 'SHIPPED' ? 'PICKED_UP' : 'INITIATED',
          shippedAt: status === 'SHIPPED' ? new Date() : null,
        },
      })
    }
    if (status === 'DELIVERED') {
      await db.shipment.updateMany({
        where: { orderId: id },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      })
    }

    // Activity log
    await db.activityLog.create({
      data: {
        userId: session.id,
        action: 'ORDER_UPDATED',
        entity: 'order',
        entityId: id,
        metadata: JSON.stringify({ status, trackingNumber }),
      },
    })

    return NextResponse.json({ order })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
