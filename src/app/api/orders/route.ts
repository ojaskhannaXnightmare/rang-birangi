import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const onlyMe = searchParams.get('mine') === '1'

    if (onlyMe) {
      const orders = await db.order.findMany({
        where: { userId: session.id },
        include: {
          items: true,
          payment: true,
          shipment: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({ orders })
    }

    // Admin: all orders
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const orders = await db.order.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
        payment: true,
        shipment: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ orders })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
