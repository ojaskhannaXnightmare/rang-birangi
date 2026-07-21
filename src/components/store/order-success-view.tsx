'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2, Package, Truck, Mail, ArrowRight, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { useCartStore } from '@/stores/cart-store'
import { formatINR, formatDate, orderStatusColor } from '@/lib/helpers'

export function OrderSuccessView({ orderId }: { orderId: string }) {
  const setView = useUIStore((s) => s.setView)
  const clearCart = useCartStore((s) => s.clear)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    clearCart()
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => setOrder(d.order))
  }, [orderId, clearCart])

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">Loading order...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
        >
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-2">
          Order Confirmed!
        </h1>
        <p className="text-muted-foreground">
          Thank you for shopping with RANG BIRANGI. Your order has been placed successfully.
        </p>
      </motion.div>

      {/* Order details card */}
      <div className="p-6 rounded-2xl glass border border-gold/20 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Order Number</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-mono font-bold">{order.orderNumber}</p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => navigator.clipboard.writeText(order.orderNumber)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Order Date</p>
            <p className="font-medium mt-1">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Amount</p>
            <p className="font-bold text-accent mt-1">{formatINR(order.total)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Status</p>
            <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs border ${orderStatusColor(order.status)}`}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Items */}
        <h3 className="font-display font-semibold mb-3">Items</h3>
        <div className="space-y-3">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex gap-3">
              <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-lg" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity}
                  {item.color && ` · ${item.color}`}
                  {item.size && ` · ${item.size}`}
                </p>
                <p className="text-sm font-semibold mt-1">{formatINR(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking timeline */}
      <div className="p-6 rounded-2xl glass border border-gold/20 mb-6">
        <h3 className="font-display font-semibold mb-4">What Happens Next?</h3>
        <div className="space-y-4">
          {[
            { icon: CheckCircle2, title: 'Order Confirmed', desc: 'We\'ve received your order', done: true },
            { icon: Package, title: 'Packing', desc: 'Your items are being prepared', done: order.status !== 'PENDING_PAYMENT' },
            { icon: Truck, title: 'Shipping', desc: 'Out for delivery via Delhivery', done: ['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) },
            { icon: Mail, title: 'Delivered', desc: 'Package delivered to your address', done: order.status === 'DELIVERED' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                s.done ? 'bg-green-500/20 text-green-500' : 'bg-secondary/50 text-muted-foreground'
              }`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="pt-1">
                <p className="text-sm font-medium">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => setView({ name: 'dashboard', tab: 'orders' })}
          className="flex-1 bg-luxe-gradient"
        >
          View My Orders <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={() => setView({ name: 'home' })}
          className="flex-1 border-accent text-accent hover:bg-accent/10"
        >
          Continue Shopping
        </Button>
      </div>
    </div>
  )
}
