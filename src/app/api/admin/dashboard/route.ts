import { NextResponse } from 'next/server'
import {
  COLLECTIONS, countDocs, findMany, findOne, findById, groupBySum,
} from '@/lib/supabase-db'
import { requireAdmin } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    await requireAdmin()

    // Stats
    const allOrders = await findMany<any>(COLLECTIONS.ORDERS)
    const allUsers = await findMany<any>(COLLECTIONS.USERS, [
      { field: 'role', op: '==', value: 'CUSTOMER' },
    ])
    const allProducts = await findMany<any>(COLLECTIONS.PRODUCTS)
    const paidOrders = allOrders.filter((o) => o.paymentStatus === 'PAID')
    const totalRevenue = paidOrders.reduce((s, o) => s + (Number(o.total) || 0), 0)

    // Low stock products
    const lowStockProducts = allProducts
      .filter((p) => Number(p.stock) <= 10)
      .sort((a, b) => (a.stock || 0) - (b.stock || 0))
      .slice(0, 10)
      .map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock, price: p.price }))

    // Recent orders
    const recentOrders = allOrders
      .sort((a, b) => {
        const aT = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
        const bT = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
        return bT - aT
      })
      .slice(0, 8)
    for (const o of recentOrders) {
      o.user = await findById<any>(COLLECTIONS.USERS, o.userId)
      o.items = await findMany<any>(COLLECTIONS.ORDER_ITEMS, [
        { field: 'orderId', op: '==', value: o.id },
      ])
    }

    // Sales last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
    const orders7d = paidOrders.filter((o) => {
      const t = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt || 0)
      return t >= sevenDaysAgo
    })
    const salesByDay: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 86400000)
      const dayKey = day.toISOString().slice(0, 10)
      const dayOrders = orders7d.filter((o) => {
        const t = o.createdAt instanceof Date ? o.createdAt : new Date(o.createdAt || 0)
        return t.toISOString().slice(0, 10) === dayKey
      })
      salesByDay.push({
        date: day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        revenue: dayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0),
        orders: dayOrders.length,
      })
    }

    // Category performance
    const categories = await findMany<any>(COLLECTIONS.CATEGORIES)
    const allOrderItems = await findMany<any>(COLLECTIONS.ORDER_ITEMS)
    const allProds = await findMany<any>(COLLECTIONS.PRODUCTS)
    const productToCategory = new Map(allProds.map((p) => [p.id, p.categoryId]))
    const categoryPerf = await Promise.all(categories.map(async (c) => {
      const itemsInCat = allOrderItems.filter((i) => productToCategory.get(i.productId) === c.id)
      return {
        name: c.name,
        slug: c.slug,
        productCount: allProds.filter((p) => p.categoryId === c.id).length,
        revenue: itemsInCat.reduce((s, i) => s + (Number(i.total) || 0), 0),
        unitsSold: itemsInCat.reduce((s, i) => s + (Number(i.quantity) || 0), 0),
      }
    })).then((arr) => arr.sort((a, b) => b.revenue - a.revenue))

    // Status breakdown
    const statusBreakdown: Record<string, number> = {}
    for (const o of allOrders) {
      statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1
    }

    // Best sellers
    const sellerMap = new Map<string, { productId: string; name: string; sku: string; qty: number; total: number }>()
    for (const item of allOrderItems) {
      const key = item.productId
      const cur = sellerMap.get(key) || { productId: item.productId, name: item.name, sku: item.sku, qty: 0, total: 0 }
      cur.qty += Number(item.quantity) || 0
      cur.total += Number(item.total) || 0
      sellerMap.set(key, cur)
    }
    const bestSellers = Array.from(sellerMap.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((b) => ({ productId: b.productId, name: b.name, sku: b.sku, _sum: { quantity: b.qty, total: b.total } }))

    // Recent activity
    const recentActivity = await findMany<any>(COLLECTIONS.ACTIVITY_LOGS, {
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 10,
    })
    for (const a of recentActivity) {
      a.user = a.userId ? await findById<any>(COLLECTIONS.USERS, a.userId) : null
    }

    return NextResponse.json(serializeDates({
      stats: {
        totalRevenue,
        totalOrders: allOrders.length,
        totalCustomers: allUsers.length,
        totalProducts: allProducts.length,
        avgOrderValue: allOrders.length > 0 ? totalRevenue / allOrders.length : 0,
      },
      salesByDay,
      categoryPerf,
      statusBreakdown,
      lowStockProducts,
      recentOrders,
      bestSellers,
      recentActivity,
    }))
  } catch (e: any) {
    console.error('admin dashboard error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
