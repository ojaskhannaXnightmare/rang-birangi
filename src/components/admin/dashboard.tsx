'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, DollarSign, ShoppingBag, Users, Package, ArrowUpRight,
  ArrowDownRight, AlertTriangle, Activity,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { formatINR, formatDate, relativeTime, orderStatusColor } from '@/lib/helpers'

const PIE_COLORS = ['#D4AF37', '#7B1E3A', '#A1A1AA', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export function AdminDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) return <div>No data available</div>

  const { stats, salesByDay, categoryPerf, statusBreakdown, lowStockProducts, recentOrders, bestSellers, recentActivity } = data

  const statusPieData = Object.entries(statusBreakdown).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatINR(stats.totalRevenue)}
          icon={DollarSign}
          change="+12.5%"
          positive
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          change="+8.2%"
          positive
        />
        <StatCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Users}
          change="+5.1%"
          positive
        />
        <StatCard
          title="Avg Order Value"
          value={formatINR(stats.avgOrderValue)}
          icon={TrendingUp}
          change="-2.3%"
          positive={false}
        />
      </div>

      {/* Sales chart */}
      <div className="p-5 rounded-xl glass border border-gold/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg">Sales Overview</h3>
            <p className="text-xs text-muted-foreground">Last 7 days revenue & orders</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={salesByDay}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOrd" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7B1E3A" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7B1E3A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
            <XAxis dataKey="date" stroke="#A1A1AA" fontSize={12} />
            <YAxis stroke="#A1A1AA" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181B',
                border: '1px solid #D4AF37',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#D4AF37' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" strokeWidth={2} fill="url(#colorRev)" />
            <Area type="monotone" dataKey="orders" stroke="#7B1E3A" strokeWidth={2} fill="url(#colorOrd)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category performance */}
        <div className="p-5 rounded-xl glass border border-gold/20">
          <h3 className="font-display font-bold text-lg mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryPerf} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis type="number" stroke="#A1A1AA" fontSize={12} />
              <YAxis dataKey="name" type="category" stroke="#A1A1AA" fontSize={11} width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18181B',
                  border: '1px solid #D4AF37',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#D4AF37' }}
              />
              <Bar dataKey="revenue" fill="#D4AF37" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status breakdown */}
        <div className="p-5 rounded-xl glass border border-gold/20">
          <h3 className="font-display font-bold text-lg mb-4">Order Status Breakdown</h3>
          {statusPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                  label={(entry: any) => `${entry.name}: ${entry.value}`}
                  labelLine={false}
                >
                  {statusPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181B',
                    border: '1px solid #D4AF37',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12">No orders yet</p>
          )}
        </div>
      </div>

      {/* Low stock + Best sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low stock alerts */}
        <div className="p-5 rounded-xl glass border border-gold/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h3 className="font-display font-bold text-lg">Low Stock Alerts</h3>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lowStockProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <Badge className={p.stock === 0 ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}>
                    {p.stock} left
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">All products well stocked</p>
          )}
        </div>

        {/* Best sellers */}
        <div className="p-5 rounded-xl glass border border-gold/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-accent" />
            <h3 className="font-display font-bold text-lg">Best Sellers</h3>
          </div>
          {bestSellers.length > 0 ? (
            <div className="space-y-2">
              {bestSellers.map((b: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-luxe-gradient flex items-center justify-center text-xs font-bold text-accent">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-xs text-muted-foreground">{b._sum.quantity} sold</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-accent">{formatINR(b._sum.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No sales data yet</p>
          )}
        </div>
      </div>

      {/* Recent orders + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl glass border border-gold/20">
          <h3 className="font-display font-bold text-lg mb-4">Recent Orders</h3>
          <div className="space-y-2">
            {recentOrders.slice(0, 5).map((o: any) => (
              <div key={o.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                <div className="min-w-0">
                  <p className="text-sm font-mono font-medium truncate">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.user?.name || 'Unknown'} · {relativeTime(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatINR(o.total)}</span>
                  <Badge className={orderStatusColor(o.status)} variant="outline">
                    {o.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl glass border border-gold/20">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-accent" />
            <h3 className="font-display font-bold text-lg">Recent Activity</h3>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentActivity.map((a: any) => (
              <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/20">
                <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{a.user?.name || 'System'}</span>
                    <span className="text-muted-foreground"> · {a.action.replace(/_/g, ' ').toLowerCase()}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{relativeTime(a.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  title, value, icon: Icon, change, positive,
}: {
  title: string
  value: string | number
  icon: any
  change: string
  positive: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl glass border border-gold/20 hover-lift"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="w-10 h-10 rounded-lg bg-luxe-gradient flex items-center justify-center">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <div className={`flex items-center gap-1 text-xs ${positive ? 'text-green-500' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {change}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-xl md:text-2xl font-display font-bold mt-1">{value}</p>
    </motion.div>
  )
}
