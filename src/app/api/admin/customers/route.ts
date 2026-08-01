import { NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany,
} from '@/lib/firestore-db'
import { requireAdmin } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    await requireAdmin()
    const customers = await findMany<any>(COLLECTIONS.USERS, {
      where: [{ field: 'role', op: '==', value: 'CUSTOMER' }],
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 500,
    })

    const allOrders = await findMany<any>(COLLECTIONS.ORDERS)
    const ordersByUser = new Map<string, any[]>()
    for (const o of allOrders) {
      const arr = ordersByUser.get(o.userId) || []
      arr.push(o)
      ordersByUser.set(o.userId, arr)
    }

    const enriched = customers.map((c) => {
      const orders = ordersByUser.get(c.id) || []
      const totalSpent = orders
        .filter((o) => o.status === 'DELIVERED' || o.status === 'SHIPPED')
        .reduce((s, o) => s + (Number(o.total) || 0), 0)
      const lastOrderAt = orders[0]?.createdAt || null
      return {
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        status: c.status, createdAt: c.createdAt, avatarUrl: c.avatarUrl,
        orderCount: orders.length,
        totalSpent,
        lastOrderAt,
      }
    })

    return NextResponse.json({ customers: serializeDates(enriched) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
