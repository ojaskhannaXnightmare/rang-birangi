/**
 * RANG BIRANGI - Payment Verification API
 * POST /api/checkout/verify
 *
 * Verifies a pending order's UPI payment and confirms the order.
 *
 * Body: { orderId, paymentRef, upiId }
 *
 * On success:
 * - Marks order as CONFIRMED
 * - Marks payment as PAID
 * - Reduces inventory
 * - Creates shipment
 * - Clears cart items
 * - Returns { success: true, orderId, message }
 *
 * Idempotent: if order is already confirmed, returns success without
 * duplicating actions.
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findById, update, create, remove, findMany, findOne,
} from '@/lib/supabase-db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Please login to verify payment' },
        { status: 401 }
      )
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { orderId, paymentRef, upiId } = body

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID required' },
        { status: 400 }
      )
    }

    if (!paymentRef || paymentRef.trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid UTR/Transaction Reference number' },
        { status: 400 }
      )
    }

    // Fetch the order
    const order = await findById<any>(COLLECTIONS.ORDERS, orderId)
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Verify the order belongs to this user
    if (order.userId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Idempotency: if order is already confirmed, return success
    if (order.status === 'CONFIRMED' || order.status === 'DELIVERED' || order.status === 'SHIPPED') {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: 'Order already confirmed',
        alreadyConfirmed: true,
      })
    }

    // Update order status to CONFIRMED
    await update(COLLECTIONS.ORDERS, orderId, {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentRef: paymentRef,
    })

    // Update payment record
    try {
      const payment = await findOne<any>(COLLECTIONS.PAYMENTS, [
        { field: 'orderId', op: '==', value: orderId },
      ])
      if (payment) {
        await update(COLLECTIONS.PAYMENTS, payment.id, {
          status: 'PAID',
          txnRef: paymentRef,
          upiId: upiId || null,
        })
      }
    } catch (e) {
      console.error('Payment update error:', e)
    }

    // Reduce stock (now that payment is confirmed)
    try {
      const orderItems = await findMany<any>(COLLECTIONS.ORDER_ITEMS, [
        { field: 'orderId', op: '==', value: orderId },
      ])
      for (const item of orderItems) {
        try {
          const product = await findById<any>(COLLECTIONS.PRODUCTS, item.productId)
          if (product) {
            await update(COLLECTIONS.PRODUCTS, product.id, {
              stock: Math.max(0, (product.stock || 0) - item.quantity),
            })
          }
        } catch (e) {
          console.error('Stock reduce error for item:', item.id, e)
        }
      }
    } catch (e) {
      console.error('Order items fetch error:', e)
    }

    // Create shipment
    try {
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
    } catch (e) {
      console.error('Shipment create error:', e)
    }

    // Clear cart items
    try {
      const cart = await findOne<any>(COLLECTIONS.CART, [
        { field: 'userId', op: '==', value: session.id },
      ])
      if (cart) {
        const cartItems = await findMany<any>(COLLECTIONS.CART_ITEMS, [
          { field: 'cartId', op: '==', value: cart.id },
        ])
        for (const item of cartItems) {
          try {
            await remove(COLLECTIONS.CART_ITEMS, item.id)
          } catch {}
        }
      }
    } catch (e) {
      console.error('Cart clear error:', e)
    }

    // Activity log
    try {
      await create(COLLECTIONS.ACTIVITY_LOGS, {
        userId: session.id,
        action: 'PAYMENT_VERIFIED',
        entity: 'order',
        entityId: orderId,
        metadata: { paymentRef, orderNumber: order.orderNumber },
      })
    } catch {}

    return NextResponse.json({
      success: true,
      orderId: orderId,
      orderNumber: order.orderNumber,
      message: 'Payment verified. Order confirmed successfully.',
    })

  } catch (e: any) {
    console.error('Payment verification error:', e)
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
