import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/**
 * POST /api/checkout
 * Body: { address, paymentMethod: 'UPI' | 'COD', paymentRef?, upiId? }
 * Server-side order creation with stock reduction, atomic transaction.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Please login to checkout' }, { status: 401 })
    }
    const { address, paymentMethod, paymentRef, upiId } = await req.json()

    if (!address || !paymentMethod) {
      return NextResponse.json({ error: 'Address and payment method required' }, { status: 400 })
    }
    if (!['UPI', 'COD'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    // Fetch cart
    const cart = await db.cart.findUnique({
      where: { userId: session.id },
      include: {
        items: {
          include: { product: true },
          where: { savedForLater: false },
        },
      },
    })
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Validate stock
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}` },
          { status: 400 }
        )
      }
    }

    const subtotal = cart.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
    const settings = await db.setting.findMany()
    const settingsObj: Record<string, string> = {}
    for (const s of settings) settingsObj[s.key] = s.value
    const freeThreshold = parseFloat(settingsObj.free_shipping_threshold || '999')
    const shippingCost = subtotal >= freeThreshold ? 0 : parseFloat(settingsObj.shipping_cost || '49')
    const total = subtotal + shippingCost

    // For UPI: verify payment ref exists (in production, verify with gateway webhook)
    let paymentStatus = 'PENDING'
    if (paymentMethod === 'UPI') {
      if (!paymentRef && !upiId) {
        return NextResponse.json({ error: 'Payment reference required for UPI' }, { status: 400 })
      }
      // Mark as PAID after "verification" (in production, do this in webhook)
      paymentStatus = 'PAID'
    }

    const orderNumber = `RB${Date.now().toString().slice(-8)}`
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create order + items + reduce stock (atomic)
    const order = await db.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: session.id,
          addressSnapshot: JSON.stringify(address),
          subtotal,
          shippingCost,
          total,
          status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING_PAYMENT',
          paymentMethod,
          paymentStatus,
          paymentRef: paymentRef || null,
          invoiceNumber,
          items: {
            create: cart.items.map((i) => ({
              productId: i.productId,
              name: i.product.name,
              sku: i.product.sku,
              price: i.product.price,
              quantity: i.quantity,
              color: i.color,
              size: i.size,
              image: i.product.images.split(',')[0],
              total: i.product.price * i.quantity,
            })),
          },
        },
        include: { items: true },
      })

      // Reduce stock
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod,
          amount: total,
          status: paymentStatus,
          txnRef: paymentRef || null,
          upiId: upiId || null,
        },
      })

      // Create shipment record for confirmed orders
      if (paymentStatus === 'PAID') {
        await tx.shipment.create({
          data: {
            orderId: newOrder.id,
            courier: 'Delhivery',
            status: 'INITIATED',
            estimatedDelivery: new Date(Date.now() + 5 * 86400000),
          },
        })
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

      // Activity log
      await tx.activityLog.create({
        data: {
          userId: session.id,
          action: 'ORDER_CREATED',
          entity: 'order',
          entityId: newOrder.id,
          metadata: JSON.stringify({ orderNumber, total, paymentMethod }),
        },
      })

      return newOrder
    })

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
    })
  } catch (e: any) {
    console.error('checkout error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
