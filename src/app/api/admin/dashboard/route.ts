import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()

    const [totalRevenue, totalOrders, totalCustomers, totalProducts, lowStockProducts, recentOrders] = await Promise.all([
      db.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: 'PAID' },
      }),
      db.order.count(),
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.product.count(),
      db.product.findMany({
        where: { stock: { lte: 10 } },
        select: { id: true, name: true, sku: true, stock: true, price: true },
        take: 10,
        orderBy: { stock: 'asc' },
      }),
      db.order.findMany({
        take: 8,
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Sales last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const orders7d = await db.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        paymentStatus: 'PAID',
      },
      select: { total: true, createdAt: true },
    })
    const salesByDay: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000)
      const dayKey = day.toISOString().slice(0, 10)
      const dayOrders = orders7d.filter(
        (o) => o.createdAt.toISOString().slice(0, 10) === dayKey
      )
      salesByDay.push({
        date: day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
      })
    }

    // Category performance
    const categories = await db.category.findMany({
      include: {
        products: {
          select: { id: true, price: true, stock: true },
        },
      },
    })
    const categoryPerf = await Promise.all(
      categories.map(async (c) => {
        const orderItems = await db.orderItem.findMany({
          where: { product: { categoryId: c.id } },
          select: { quantity: true, total: true },
        })
        return {
          name: c.name,
          slug: c.slug,
          productCount: c.products.length,
          revenue: orderItems.reduce((s, i) => s + i.total, 0),
          unitsSold: orderItems.reduce((s, i) => s + i.quantity, 0),
        }
      })
    )

    // Status breakdown
    const statusBreakdownRaw = await db.order.groupBy({
      by: ['status'],
      _count: true,
    })
    const statusBreakdown: Record<string, number> = {}
    for (const s of statusBreakdownRaw) statusBreakdown[s.status] = s._count

    // Best sellers
    const bestSellerItems = await db.orderItem.groupBy({
      by: ['productId', 'name', 'sku'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    })

    // Activity logs
    const recentActivity = await db.activityLog.findMany({
      take: 10,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      stats: {
        totalRevenue: totalRevenue._sum.total || 0,
        totalOrders,
        totalCustomers,
        totalProducts,
        avgOrderValue: totalOrders > 0 ? (totalRevenue._sum.total || 0) / totalOrders : 0,
      },
      salesByDay,
      categoryPerf: categoryPerf.sort((a, b) => b.revenue - a.revenue),
      statusBreakdown,
      lowStockProducts,
      recentOrders,
      bestSellers: bestSellerItems,
      recentActivity,
    })
  } catch (e: any) {
    console.error('admin dashboard error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
