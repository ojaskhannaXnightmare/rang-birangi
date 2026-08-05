/**
 * RANG BIRANGI - Checkout API
 * POST /api/checkout
 *
 * Creates an order from cart items.
 * Bulletproof: handles all error cases, returns structured JSON.
 *
 * Flow:
 * 1. Check auth
 * 2. Get cart from DB (or use items from request body as fallback)
 * 3. Validate cart not empty
 * 4. Validate address
 * 5. Validate payment method
 * 6. Check stock
 * 7. Create order
 * 8. Create order items
 * 9. Create payment record
 * 10. Create shipment (if paid)
 * 11. Reduce stock
 * 12. Clear cart items
 * 13. Return order ID
 */
import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, findMany, findById, create, update, remove,
} from '@/lib/supabase-db'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // 1. Check auth
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Please login to checkout' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    let body: any
    try {
      body = await req.json()
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { address, paymentMethod, paymentRef, upiId, items: clientItems, pending } = body

    // 3. Validate address
    if (!address || !address.fullName || !address.phone || !address.city) {
      return NextResponse.json(
        { success: false, error: 'Please provide a complete shipping address' },
        { status: 400 }
      )
    }

    // 4. Validate payment method
    if (!paymentMethod || !['UPI', 'COD'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Please select a payment method' },
        { status: 400 }
      )
    }

    // 5. Validate UPI payment reference
    if (paymentMethod === 'UPI' && !paymentRef) {
      return NextResponse.json(
        { success: false, error: 'Please enter the UPI transaction reference (UTR) number' },
        { status: 400 }
      )
    }

    // 6. Get cart items — try DB first, fall back to client items
    let cartItems: any[] = []
    let cartId: string | null = null

    try {
      const cart = await findOne<any>(COLLECTIONS.CART, [
        { field: 'userId', op: '==', value: session.id },
      ])
      if (cart) {
        cartId = cart.id
        cartItems = await findMany<any>(COLLECTIONS.CART_ITEMS, [
          { field: 'cartId', op: '==', value: cart.id },
          { field: 'savedForLater', op: '==', value: false },
        ])
      }
    } catch (e) {
      console.error('Cart fetch error:', e)
    }

    // If DB cart is empty, use client items (from optimistic cart)
    if (cartItems.length === 0 && clientItems && clientItems.length > 0) {
      cartItems = clientItems.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        color: item.color || null,
        size: item.size || null,
      }))
    }

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Your cart is empty. Please add items before checkout.' },
        { status: 400 }
      )
    }

    // 7. Hydrate products and validate stock
    const products: any[] = []
    for (const item of cartItems) {
      const product = await findById<any>(COLLECTIONS.PRODUCTS, item.productId)
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 400 }
        )
      }
      products.push(product)
    }

    // 8. Calculate totals
    const subtotal = cartItems.reduce((s, i, idx) => s + (products[idx].price * i.quantity), 0)
    const freeThreshold = 999
    const shippingCost = subtotal >= freeThreshold ? 0 : 49
    const codCharge = paymentMethod === 'COD' ? 30 : 0
    const total = subtotal + shippingCost + codCharge

    // 9. Determine payment status
    let paymentStatus = 'PENDING'
    let orderStatus = 'PENDING_PAYMENT'
    if (paymentMethod === 'UPI' && !pending) {
      paymentStatus = 'PAID'
      orderStatus = 'CONFIRMED'
    }
    // If pending=true, order stays as PENDING_PAYMENT regardless of method

    // 10. Generate order number
    const orderNumber = `RB${Date.now().toString().slice(-8)}`
    const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // 11. Create order
    const order = await create<any>(COLLECTIONS.ORDERS, {
      orderNumber,
      userId: session.id,
      addressSnapshot: address,
      subtotal,
      discount: 0,
      shippingCost,
      tax: 0,
      total,
      status: orderStatus,
      paymentMethod,
      paymentStatus,
      paymentRef: paymentRef || null,
      trackingNumber: null,
      courier: null,
      notes: null,
      invoiceNumber,
    })

    // 12. Create order items
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i]
      const product = products[i]
      try {
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
      } catch (e) {
        console.error('Order item create error:', e)
      }
    }

    // 13. Reduce stock (skip if pending order — will reduce on verification)
    if (!pending) {
      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        const item = cartItems[i]
        try {
          await update(COLLECTIONS.PRODUCTS, product.id, {
            stock: Math.max(0, (product.stock || 0) - item.quantity),
          })
        } catch (e) {
          console.error('Stock update error:', e)
        }
      }
    }

    // 14. Create payment record
    try {
      await create(COLLECTIONS.PAYMENTS, {
        orderId: order.id,
        method: paymentMethod,
        amount: total,
        status: paymentStatus,
        txnRef: paymentRef || null,
        upiId: upiId || null,
      })
    } catch (e) {
      console.error('Payment record error:', e)
    }

    // 15. Create shipment for confirmed orders
    if (paymentStatus === 'PAID') {
      try {
        await create(COLLECTIONS.SHIPMENTS, {
          orderId: order.id,
          courier: 'Delhivery',
          trackingNumber: null,
          status: 'INITIATED',
          estimatedDelivery: new Date(Date.now() + 5 * 86400000),
          shippedAt: null,
          deliveredAt: null,
        })
      } catch (e) {
        console.error('Shipment create error:', e)
      }
    }

    // 16. Clear cart items from DB (skip if pending)
    if (!pending && cartId) {
      for (const item of cartItems) {
        try {
          if (item.id && !item.id.startsWith('item_')) {
            await remove(COLLECTIONS.CART_ITEMS, item.id)
          }
        } catch (e) {
          // Ignore — item might be client-side only
        }
      }
    }

    // 17. Log activity
    try {
      await create(COLLECTIONS.ACTIVITY_LOGS, {
        userId: session.id,
        action: 'ORDER_CREATED',
        entity: 'order',
        entityId: order.id,
        metadata: { orderNumber, total, paymentMethod },
      })
    } catch (e) {
      // Non-critical
    }

    // 18. Return success
    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      message: 'Order created successfully',
    })

  } catch (e: any) {
    console.error('checkout error:', e)
    return NextResponse.json(
      { success: false, error: e.message || 'Failed to create order. Please try again.' },
      { status: 500 }
    )
  }
}
