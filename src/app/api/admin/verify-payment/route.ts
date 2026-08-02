/**
 * RANG BIRANGI - Payment Verification API
 * POST /api/admin/verify-payment
 *
 * Admin can verify UPI payments by checking the UTR number.
 * In production, this would call the payment gateway API.
 * For now, it marks the payment as verified.
 *
 * Body: { orderId }
 */
import { NextRequest, NextResponse } from 'next/server'
import { COLLECTIONS, findById, update, create } from '@/lib/supabase-db'
import { requireAdmin } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const order = await findById<any>(COLLECTIONS.ORDERS, orderId)
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Update order status to CONFIRMED
    const updatedOrder = await update<any>(COLLECTIONS.ORDERS, orderId, {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
    })

    // Update payment record
    const payments = await findById<any>(COLLECTIONS.PAYMENTS, orderId)
    // Note: payments table has order_id, not id — let me use findOne
    const { findOne } = await import('@/lib/supabase-db')
    const payment = await findOne<any>(COLLECTIONS.PAYMENTS, [
      { field: 'orderId', op: '==', value: orderId },
    ])

    if (payment) {
      await update(COLLECTIONS.PAYMENTS, payment.id, {
        status: 'PAID',
      })
    }

    // Create shipment
    const existingShipment = await findOne<any>(COLLECTIONS.SHIPMENTS, [
      { field: 'orderId', op: '==', value: orderId },
    ])
    if (!existingShipment) {
      await create(COLLECTIONS.SHIPMENTS, {
        orderId: orderId,
        courier: 'Delhivery',
        trackingNumber: null,
        status: 'INITIATED',
        estimatedDelivery: new Date(Date.now() + 5 * 86400000),
        shippedAt: null,
        deliveredAt: null,
      })
    }

    // Activity log
    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: session.id,
      action: 'PAYMENT_VERIFIED',
      entity: 'order',
      entityId: orderId,
      metadata: { orderNumber: order.orderNumber },
    })

    return NextResponse.json({
      success: true,
      order: serializeDates(updatedOrder),
      message: 'Payment verified. Order confirmed.',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
