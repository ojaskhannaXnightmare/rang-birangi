'use client'

import { useEffect, useState } from 'react'
import { Search, Users, Mail, Phone, ShoppingBag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatINR, formatDate } from '@/lib/helpers'

export function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/customers')
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.customers || [])
        setLoading(false)
      })
  }, [])

  const filtered = customers.filter((c) =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-display font-bold">Customers ({customers.length})</h2>
        <p className="text-sm text-muted-foreground">Manage customer accounts</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, phone..."
          className="pl-10 bg-secondary/50"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-xl glass border border-gold/20 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No customers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="p-4 rounded-xl glass border border-gold/10 hover:border-gold/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-luxe-gradient flex items-center justify-center">
                  <span className="text-accent font-display font-bold text-lg">
                    {(c.name || c.email)[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{c.name || 'Unnamed'}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <Badge variant="outline" className={c.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}>
                  {c.status}
                </Badge>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                {c.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3 w-3" /> {c.phone}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Mail className="h-3 w-3" /> {c.email}
                </p>
                <p className="flex items-center gap-2">
                  <ShoppingBag className="h-3 w-3" /> {c.orderCount} orders · {formatINR(c.totalSpent)}
                </p>
                <p>Joined: {formatDate(c.createdAt)}</p>
                {c.lastOrderAt && <p>Last order: {formatDate(c.lastOrderAt)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
