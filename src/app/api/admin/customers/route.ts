import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const customers = await db.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true, name: true, email: true, phone: true,
        status: true, createdAt: true, avatarUrl: true,
        orders: { select: { id: true, total: true, status: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const enriched = customers.map((c) => {
      const totalSpent = c.orders
        .filter((o) => o.status === 'DELIVERED' || o.status === 'SHIPPED')
        .reduce((s, o) => s + o.total, 0)
      return {
        id: c.id, name: c.name, email: c.email, phone: c.phone,
        status: c.status, createdAt: c.createdAt, avatarUrl: c.avatarUrl,
        orderCount: c.orders.length,
        totalSpent,
        lastOrderAt: c.orders[0]?.createdAt || null,
      }
    })

    return NextResponse.json({ customers: enriched })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
