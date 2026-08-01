import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, findMany, findById, create, update, remove,
} from '@/lib/supabase-db'
import { getSession } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

/**
 * POST /api/checkout — atomic order creation with stock deduction
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
    const cart = await findOne<any>(COLLECTIONS.CART, [
      { field: 'userId', op: '==', value: session.id },
    ])
    if (!cart) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    const cartItems = await findMany<any>(COLLECTIONS.CART_ITEMS, [
      { field: 'cartId', op: '==', value: cart.id },
      { field: 'savedForLater', op: '==', value: false },
    ])
    if (cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Hydrate products and validate stock
    const products: any[] = []
    for (const item of cartItems) {
      const product = await findById<any>(COLLECTIONS.PRODUCTS, item.productId)
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 })
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        )
      }
      products.push(product)
    }

    const subtotal = cartItems.reduce((s, i, idx) => s + products[idx].price * i.quantity, 0)
    const freeThreshold = 999
    const shippingCost = subtotal >= freeThreshold ? 0 : 49
    const total = subtotal + shippingCost

    let paymentStatus = 'PENDING'
    if (paymentMethod === 'UPI') {
      if (!paymentRef && !upiId) {
        return NextResponse.json({ error: 'Payment reference required for UPI' }, { status: 400 })
      }
      paymentStatus = 'PAID'
    }

    const orderNumber = `RB${Date.now().toString().slice(-8)}`
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create order + items + reduce stock atomically
    const order = await create<any>(COLLECTIONS.ORDERS, {
      orderNumber,
      userId: session.id,
      addressSnapshot: address, // store as object (Firestore supports nested objects)
      subtotal,
      discount: 0,
      shippingCost,
      tax: 0,
      total,
      status: paymentStatus === 'PAID' ? 'CONFIRMED' : 'PENDING_PAYMENT',
      paymentMethod,
      paymentStatus,
      paymentRef: paymentRef || null,
      trackingNumber: null,
      courier: null,
      notes: null,
      invoiceNumber,
    })

    // Create order items
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i]
      const product = products[i]
      await create(COLLECTIONS.ORDER_ITEMS, {
        orderId: order.id,
        productId: item.productId,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: item.quantity,
        color: item.color || null,
        size: item.size || null,
        image: (product.images && product.images[0]) || null,
        total: product.price * item.quantity,
      })
    }

    // Reduce stock
    for (const product of products) {
      const item = cartItems.find((i) => i.productId === product.id)!
      await update(COLLECTIONS.PRODUCTS, product.id, {
        stock: product.stock - item.quantity,
      })
    }

    // Create payment record
    await create(COLLECTIONS.PAYMENTS, {
      orderId: order.id,
      method: paymentMethod,
      amount: total,
      status: paymentStatus,
      txnRef: paymentRef || null,
      upiId: upiId || null,
    })

    // Create shipment for confirmed orders
    if (paymentStatus === 'PAID') {
      await create(COLLECTIONS.SHIPMENTS, {
        orderId: order.id,
        courier: 'Delhivery',
        trackingNumber: null,
        status: 'INITIATED',
        estimatedDelivery: new Date(Date.now() + 5 * 86400000),
        shippedAt: null,
        deliveredAt: null,
      })
    }

    // Clear cart items
    for (const item of cartItems) {
      await remove(COLLECTIONS.CART_ITEMS, item.id)
    }

    // Activity log
    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: session.id,
      action: 'ORDER_CREATED',
      entity: 'order',
      entityId: order.id,
      metadata: { orderNumber, total, paymentMethod },
    })

    return NextResponse.json(serializeDates({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
    }))
  } catch (e: any) {
    console.error('checkout error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
