'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Eye, Truck, Package, CheckCircle2, XCircle, Loader2, Download, Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatINR, formatDate, orderStatusColor, paymentStatusColor } from '@/lib/helpers'

const STATUSES = [
  'PENDING_PAYMENT', 'CONFIRMED', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED',
]

export function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<any>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [updating, setUpdating] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      const r = await fetch('/api/orders')
      const d = await r.json()
      setOrders(d.orders || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = orders.filter((o) => {
    const matchSearch = !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleUpdateStatus = async (orderId: string, status: string) => {
    setUpdating(true)
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, trackingNumber: trackingNumber || undefined }),
    })
    if (res.ok) {
      toast({ title: 'Order updated', description: `Status: ${status}` })
      setTrackingNumber('')
      load()
      if (selected?.id === orderId) {
        setSelected({ ...selected, status, trackingNumber: trackingNumber || selected.trackingNumber })
      }
    }
    setUpdating(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold">Orders ({orders.length})</h2>
        <p className="text-sm text-muted-foreground">Manage customer orders</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order #, customer name, email..."
            className="pl-10 bg-secondary/50"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-secondary/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-xl glass border border-gold/20 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((o) => (
            <motion.div
              key={o.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl glass border border-gold/10 hover:border-gold/30 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono font-bold text-sm">{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {o.user?.name || 'Unknown'} · {o.user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={orderStatusColor(o.status)} variant="outline">
                    {o.status.replace(/_/g, ' ')}
                  </Badge>
                  <Badge className={paymentStatusColor(o.paymentStatus)} variant="outline">
                    {o.paymentStatus}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {o.paymentMethod}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="text-sm">
                  <span className="text-muted-foreground">{o.items?.length || 0} items · </span>
                  <span className="font-bold text-accent">{formatINR(o.total)}</span>
                  {o.trackingNumber && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      📦 {o.trackingNumber}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(o)}
                  className="border-accent text-accent"
                >
                  <Eye className="h-3.5 w-3.5 mr-2" /> View
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order detail dialog */}
      {selected && (
        <Dialog open onOpenChange={() => setSelected(null)}>
          <DialogContent className="glass-strong border border-gold/20 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-gradient-gold">
                Order {selected.orderNumber}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Customer */}
              <div className="p-3 rounded-lg bg-secondary/30">
                <h4 className="text-sm font-medium mb-2">Customer</h4>
                <p className="text-sm">{selected.user?.name}</p>
                <p className="text-xs text-muted-foreground">{selected.user?.email} · {selected.user?.phone}</p>
              </div>

              {/* Shipping address */}
              {selected.addressSnapshot && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <h4 className="text-sm font-medium mb-2">Shipping Address</h4>
                  {(() => {
                    const addr = JSON.parse(selected.addressSnapshot)
                    return (
                      <p className="text-sm text-muted-foreground">
                        {addr.fullName}<br />
                        {addr.houseNo}, {addr.street}, {addr.area && `${addr.area}, `}
                        {addr.city}, {addr.state} - {addr.pincode}<br />
                        📞 {addr.phone}
                      </p>
                    )
                  })()}
                </div>
              )}

              {/* Items */}
              <div>
                <h4 className="text-sm font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {selected.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-3 p-2 rounded-lg bg-secondary/20">
                      <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatINR(item.price)}
                          {item.color && ` · ${item.color}`}
                          {item.size && ` · ${item.size}`}
                        </p>
                      </div>
                      <p className="text-sm font-semibold">{formatINR(item.total)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="p-3 rounded-lg bg-secondary/30 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatINR(selected.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{formatINR(selected.shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-border">
                  <span>Total</span>
                  <span className="text-accent">{formatINR(selected.total)}</span>
                </div>
              </div>

              {/* Payment verification (for pending payments) */}
              {selected.paymentStatus === 'PENDING' && selected.paymentMethod === 'UPI' && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-2">
                  <h4 className="text-sm font-medium text-yellow-400">Payment Verification</h4>
                  <p className="text-xs text-muted-foreground">
                    UPI Payment — UTR: {selected.paymentRef || selected.payment?.txnRef || 'Not provided'}
                  </p>
                  <Button
                    size="sm"
                    onClick={async () => {
                      setUpdating(true)
                      const res = await fetch('/api/admin/verify-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: selected.id }),
                      })
                      if (res.ok) {
                        toast({ title: 'Payment verified!', description: 'Order confirmed.' })
                        load()
                        setSelected(null)
                      } else {
                        toast({ title: 'Verification failed', variant: 'destructive' })
                      }
                      setUpdating(false)
                    }}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Verify Payment
                  </Button>
                </div>
              )}

              {/* Status update */}
              <div className="p-3 rounded-lg bg-secondary/30 space-y-2">
                <h4 className="text-sm font-medium">Update Order Status</h4>
                <div className="flex gap-2">
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking number (optional)"
                    className="bg-secondary/50 flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {STATUSES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? 'default' : 'outline'}
                      onClick={() => handleUpdateStatus(selected.id, s)}
                      disabled={updating}
                      className={`text-xs ${selected.status === s ? 'bg-luxe-gradient' : ''}`}
                    >
                      {s.replace(/_/g, ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Tracking info */}
              {selected.shipment && (
                <div className="p-3 rounded-lg bg-secondary/30">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-accent" /> Shipment
                  </h4>
                  <p className="text-sm">Courier: {selected.shipment.courier}</p>
                  {selected.shipment.trackingNumber && (
                    <p className="text-sm">Tracking: {selected.shipment.trackingNumber}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Status: {selected.shipment.status.replace(/_/g, ' ')}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
