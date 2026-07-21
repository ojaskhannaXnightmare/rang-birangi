'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Star, Image, Settings,
  Activity, LogOut, Menu, Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent,
} from '@/components/ui/sheet'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

import { AdminDashboard } from './dashboard'
import { AdminProducts } from './products'
import { AdminOrders } from './orders'
import { AdminCustomers } from './customers'
import { AdminReviews } from './reviews'
import { AdminHomepage } from './homepage'
import { AdminSettings } from './settings'
import { AdminActivity } from './activity'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'orders', label: 'Orders', icon: ShoppingCart },
  { key: 'customers', label: 'Customers', icon: Users },
  { key: 'reviews', label: 'Reviews', icon: Star },
  { key: 'homepage', label: 'Homepage Builder', icon: Image },
  { key: 'activity', label: 'Activity Log', icon: Activity },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export function AdminPanel({ tab }: { tab?: string }) {
  const currentTab = tab || 'dashboard'
  const [mobileOpen, setMobileOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const setView = useUIStore((s) => s.setView)
  const { toast } = useToast()

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Admin access required.</p>
        <Button onClick={() => setView({ name: 'home' })} className="mt-4 bg-luxe-gradient">
          Back to Home
        </Button>
      </div>
    )
  }

  const currentNav = NAV.find((n) => n.key === currentTab)

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border">
          <button onClick={() => setView({ name: 'home' })} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-luxe-gradient flex items-center justify-center border border-gold/30">
              <span className="text-accent font-display text-lg font-bold">R</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-display font-bold tracking-wider text-gradient-gold">
                RANG BIRANGI
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Admin Console
              </span>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => useUIStore.getState().setView({ name: 'admin', tab: n.key })}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                currentTab === n.key
                  ? 'bg-luxe-gradient text-foreground premium-shadow'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <n.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="p-3 rounded-lg glass mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-luxe-gradient flex items-center justify-center">
                <span className="text-accent text-xs font-bold">
                  {(user.name || user.email)[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{user.name || 'Admin'}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
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
        </div>
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="glass-strong border-r border-gold/20 w-[260px] p-0">
          <div className="p-5 border-b border-border">
            <span className="text-sm font-display font-bold tracking-wider text-gradient-gold">
              RANG BIRANGI Admin
            </span>
          </div>
          <nav className="p-3 space-y-1">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => {
                  setView({ name: 'admin', tab: n.key })
                  setMobileOpen(false)
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  currentTab === n.key ? 'bg-luxe-gradient text-foreground' : 'hover:bg-secondary/50'
                }`}
              >
                <n.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{n.label}</span>
              </button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-strong border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-display font-bold">{currentNav?.label}</h1>
                <p className="text-xs text-muted-foreground">RANG BIRANGI Admin Console</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView({ name: 'home' })}
                className="border-accent/30 text-accent"
              >
                <Eye className="h-3.5 w-3.5 mr-2" /> View Store
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <motion.div key={currentTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {currentTab === 'dashboard' && <AdminDashboard />}
            {currentTab === 'products' && <AdminProducts />}
            {currentTab === 'orders' && <AdminOrders />}
            {currentTab === 'customers' && <AdminCustomers />}
            {currentTab === 'reviews' && <AdminReviews />}
            {currentTab === 'homepage' && <AdminHomepage />}
            {currentTab === 'activity' && <AdminActivity />}
            {currentTab === 'settings' && <AdminSettings />}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
