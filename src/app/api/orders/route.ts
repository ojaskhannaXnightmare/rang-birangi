import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, findById, findOne,
} from '@/lib/supabase-db'
import { getSession } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

async function hydrateOrder(order: any) {
  const items = await findMany<any>(COLLECTIONS.ORDER_ITEMS, [
    { field: 'orderId', op: '==', value: order.id },
  ])
  order.items = items

  const payment = await findOne<any>(COLLECTIONS.PAYMENTS, [
    { field: 'orderId', op: '==', value: order.id },
  ])
  order.payment = payment

  const shipment = await findOne<any>(COLLECTIONS.SHIPMENTS, [
    { field: 'orderId', op: '==', value: order.id },
  ])
  order.shipment = shipment

  if (order.userId) {
    order.user = await findById<any>(COLLECTIONS.USERS, order.userId)
  }
  return order
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const onlyMe = searchParams.get('mine') === '1'

    if (onlyMe) {
      const orders = await findMany<any>(COLLECTIONS.ORDERS, {
        where: [{ field: 'userId', op: '==', value: session.id }],
        orderBy: { field: 'createdAt', direction: 'desc' },
      })
      for (const o of orders) await hydrateOrder(o)
      return NextResponse.json({ orders: serializeDates(orders) })
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const orders = await findMany<any>(COLLECTIONS.ORDERS, {
      orderBy: { field: 'createdAt', direction: 'desc' },
    })
    for (const o of orders) await hydrateOrder(o)
    return NextResponse.json({ orders: serializeDates(orders) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
