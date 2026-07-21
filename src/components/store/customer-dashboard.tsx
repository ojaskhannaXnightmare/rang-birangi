'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Package, Heart, MapPin, Bell, LogOut, Settings, ShoppingBag,
  ChevronRight, Star, Pencil, Trash2, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useWishlistStore } from '@/stores/wishlist-store'
import { useToast } from '@/hooks/use-toast'
import { formatINR, formatDate, orderStatusColor, paymentStatusColor } from '@/lib/helpers'
import { ProductCard } from './product-card'

const TABS = [
  { key: 'orders', label: 'My Orders', icon: Package },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'addresses', label: 'Addresses', icon: MapPin },
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'notifications', label: 'Notifications', icon: Bell },
]

export function CustomerDashboard({ tab: initialTab }: { tab?: string }) {
  const tab = initialTab || 'orders'
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const setView = useUIStore((s) => s.setView)
  const { toast } = useToast()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Please login to view your dashboard.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-64 flex-shrink-0">
          <div className="p-5 rounded-xl glass border border-gold/20 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-luxe-gradient flex items-center justify-center">
                <span className="text-accent font-display font-bold text-lg">
                  {(user.name || user.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{user.name || 'Customer'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            {user.role === 'ADMIN' && (
              <Button
                onClick={() => setView({ name: 'admin', tab: 'dashboard' })}
                className="w-full mt-3 bg-luxe-gradient"
                size="sm"
              >
                <Settings className="h-3.5 w-3.5 mr-2" /> Admin Panel
              </Button>
            )}
          </div>

          <nav className="space-y-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setView({ name: 'dashboard', tab: t.key })}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  tab === t.key
                    ? 'bg-luxe-gradient text-foreground'
                    : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="h-4 w-4" />
                <span className="text-sm font-medium flex-1">{t.label}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ))}
            <button
              onClick={async () => {
                await logout()
                setView({ name: 'home' })
                toast({ title: 'Logged out' })
              }}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {tab === 'orders' && <OrdersTab userId={user.id} />}
            {tab === 'wishlist' && <WishlistTab />}
            {tab === 'addresses' && <AddressesTab />}
            {tab === 'profile' && <ProfileTab />}
            {tab === 'notifications' && <NotificationsTab />}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function OrdersTab({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const setView = useUIStore((s) => s.setView)

  useEffect(() => {
    fetch('/api/orders?mine=1')
      .then((r) => r.json())
      .then((d) => {
        setOrders(d.orders || [])
        setLoading(false)
      })
  }, [userId])

  if (loading) return <div className="animate-pulse">Loading orders...</div>

  if (orders.length === 0) {
    return (
      <div className="p-8 rounded-xl glass border border-gold/20 text-center">
        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">You haven't placed any orders yet.</p>
        <Button onClick={() => setView({ name: 'home' })} className="bg-luxe-gradient">
          Start Shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-display font-bold">My Orders ({orders.length})</h2>
      {orders.map((order) => (
        <div key={order.id} className="p-5 rounded-xl glass border border-gold/20">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3 pb-3 border-b border-border">
            <div>
              <p className="font-mono text-sm font-bold">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={orderStatusColor(order.status)} variant="outline">
                {order.status.replace(/_/g, ' ')}
              </Badge>
              <Badge className={paymentStatusColor(order.paymentStatus)} variant="outline">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            {order.items?.slice(0, 2).map((item: any) => (
              <div key={item.id} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-14 object-cover rounded-md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Qty: {item.quantity} · {formatINR(item.price)}</p>
                </div>
              </div>
            ))}
            {order.items?.length > 2 && (
              <p className="text-xs text-muted-foreground">+{order.items.length - 2} more items</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <p className="text-sm">
              Total: <span className="font-bold text-accent">{formatINR(order.total)}</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView({ name: 'order-success', orderId: order.id })}
              className="border-accent text-accent"
            >
              View Details
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

function WishlistTab() {
  const { items, fetch } = useWishlistStore()
  const setView = useUIStore((s) => s.setView)

  useEffect(() => {
    fetch()
  }, [fetch])

  if (items.length === 0) {
    return (
      <div className="p-8 rounded-xl glass border border-gold/20 text-center">
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
        <Button onClick={() => setView({ name: 'home' })} className="bg-luxe-gradient">
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-4">My Wishlist ({items.length})</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <ProductCard key={item.id} product={item.product} index={i} />
        ))}
      </div>
    </div>
  )
}

function AddressesTab() {
  const [addresses, setAddresses] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>({})
  const { toast } = useToast()

  const load = () => {
    fetch('/api/addresses').then((r) => r.json()).then((d) => setAddresses(d.addresses || []))
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    const res = await fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      toast({ title: 'Address saved' })
      setForm({})
      setShowForm(false)
      load()
    }
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/addresses?id=${id}`, { method: 'DELETE' })
    toast({ title: 'Address deleted' })
    load()
  }

  const handleSetDefault = async (id: string) => {
    await fetch('/api/addresses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isDefault: true }),
    })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display font-bold">Addresses</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-luxe-gradient">
          <Plus className="h-4 w-4 mr-2" /> Add New
        </Button>
      </div>

      {showForm && (
        <div className="p-5 rounded-xl glass border border-gold/20 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Full Name" value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <Input placeholder="Phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <Input placeholder="House No." value={form.houseNo || ''} onChange={(e) => setForm({ ...form, houseNo: e.target.value })} />
            <Input placeholder="Street" value={form.street || ''} onChange={(e) => setForm({ ...form, street: e.target.value })} />
            <Input placeholder="City" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="State" value={form.state || ''} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <Input placeholder="Pincode" value={form.pincode || ''} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
          <Button onClick={handleSave} className="mt-3 bg-luxe-gradient">Save Address</Button>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="p-8 rounded-xl glass border border-gold/20 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="p-4 rounded-xl glass border border-gold/20">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{addr.fullName}</p>
                  {addr.isDefault && (
                    <Badge className="bg-accent/20 text-accent border-accent/40 mt-1" variant="outline">Default</Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7"
                    onClick={() => handleDelete(addr.id)}>
                    <Trash2 className="h-3 w-3 text-red-400" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {addr.houseNo}, {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
              </p>
              <p className="text-xs text-muted-foreground mt-1">📞 {addr.phone}</p>
              {!addr.isDefault && (
                <Button variant="outline" size="sm" className="mt-2"
                  onClick={() => handleSetDefault(addr.id)}>
                  Set as Default
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProfileTab() {
  const user = useAuthStore((s) => s.user)
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const { toast } = useToast()

  const handleSave = async () => {
    // In real app, would call /api/auth/profile
    toast({ title: 'Profile updated (demo)' })
    await fetchUser()
  }

  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-4">Profile</h2>
      <div className="p-5 rounded-xl glass border border-gold/20 space-y-4 max-w-lg">
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
          <Input value={user?.email || ''} disabled className="bg-secondary/30" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-secondary/50" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground mb-1.5 block">Phone</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary/50" />
        </div>
        <Button onClick={handleSave} className="bg-luxe-gradient">Save Changes</Button>
      </div>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div>
      <h2 className="text-2xl font-display font-bold mb-4">Notifications</h2>
      <div className="p-8 rounded-xl glass border border-gold/20 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No new notifications.</p>
      </div>
    </div>
  )
}
