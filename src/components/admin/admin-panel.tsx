'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Package, ShoppingCart, Users, Star, Image, Settings,
  Activity, LogOut, Menu, Eye, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

import { AdminDashboard } from './dashboard'
import { AdminProducts } from './products'
import { AdminCategories } from './categories'
import { AdminOrders } from './orders'
import { AdminCustomers } from './customers'
import { AdminReviews } from './reviews'
import { AdminHomepage } from './homepage'
import { AdminSettings } from './settings'
import { AdminActivity } from './activity'

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'products', label: 'Products', icon: Package },
  { key: 'categories', label: 'Categories', icon: Package },
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

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

  const handleNavClick = (key: string) => {
    setView({ name: 'admin', tab: key })
    setMobileOpen(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - desktop only */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border fixed left-0 top-0 bottom-0">
        <SidebarContent
          currentTab={currentTab}
          onNavClick={handleNavClick}
          user={user}
          onLogout={async () => {
            await logout()
            setView({ name: 'home' })
            toast({ title: 'Logged out' })
          }}
          onHome={() => setView({ name: 'home' })}
        />
      </aside>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[85vw] glass-strong border-r border-gold/20 z-50 lg:hidden overflow-y-auto"
            >
              <SidebarContent
                currentTab={currentTab}
                onNavClick={handleNavClick}
                user={user}
                onLogout={async () => {
                  await logout()
                  setView({ name: 'home' })
                  toast({ title: 'Logged out' })
                }}
                onHome={() => setView({ name: 'home' })}
                onClose={() => setMobileOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 min-w-0 overflow-x-hidden lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass-strong border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-base sm:text-lg font-display font-bold">{currentNav?.label}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">RANG BIRANGI Admin Console</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView({ name: 'home' })}
                className="border-accent/30 text-accent"
              >
                <Eye className="h-3.5 w-3.5 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">View Store</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-3 sm:p-6">
          <motion.div key={currentTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {currentTab === 'dashboard' && <AdminDashboard />}
            {currentTab === 'products' && <AdminProducts />}
            {currentTab === 'categories' && <AdminCategories />}
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

/** Shared sidebar content (used in both desktop sidebar and mobile drawer) */
function SidebarContent({
  currentTab,
  onNavClick,
  user,
  onLogout,
  onHome,
  onClose,
}: {
  currentTab: string
  onNavClick: (key: string) => void
  user: any
  onLogout: () => void
  onHome: () => void
  onClose?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-2 group">
          <img
            src="/logo.png"
            alt="RANG BIRANGI"
            className="w-10 h-10 rounded-full object-cover border border-lavender/30 flex-shrink-0"
          />
          <div className="flex flex-col leading-none">
            <span className="text-sm font-display font-bold tracking-wider text-gradient-lavender">
              RANG BIRANGI
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Admin Console
            </span>
          </div>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden w-8 h-8 rounded-full glass flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((n) => (
          <button
            key={n.key}
            onClick={() => onNavClick(n.key)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
              currentTab === n.key
                ? 'bg-luxe-gradient text-foreground premium-shadow'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
            }`}
          >
            <n.icon className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">{n.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="p-3 rounded-lg glass mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-luxe-gradient flex items-center justify-center flex-shrink-0">
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
          onClick={onLogout}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors text-left"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
