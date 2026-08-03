'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Search, ShoppingBag, Heart, User, Menu, X, ChevronRight, Sparkles,
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'
import { useAuthStore } from '@/stores/auth-store'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'

const NAV_LINKS = [
  { label: 'Bangles', categorySlug: 'handmade-bangles' },
  { label: 'Earrings', categorySlug: 'earrings' },
  { label: 'Sarees', categorySlug: 'sarees' },
  { label: 'Kurtis', categorySlug: 'kurtis' },
]

export function Navbar() {
  const setView = useUIStore((s) => s.setView)
  const openCart = useUIStore((s) => s.openCart)
  const openAuth = useUIStore((s) => s.openAuth)
  const setViewStore = useUIStore((s) => s.setView)
  const cartCount = useCartStore((s) => s.count())
  const wishlistCount = useWishlistStore((s) => s.count())
  const user = useAuthStore((s) => s.user)
  const [scrolled, setScrolled] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchValue.trim()) {
      setViewStore({ name: 'shop', filter: undefined, categorySlug: undefined })
      // Use sessionStorage to pass search query
      sessionStorage.setItem('rb_search', searchValue)
      setSearchOpen(false)
    }
  }

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-gold-gradient text-black text-xs sm:text-sm font-medium py-2 text-center px-4">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">Free shipping on orders above ₹999 · COD available across India</span>
          <span className="sm:hidden">Free shipping above ₹999</span>
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
        </span>
      </div>

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? 'glass-strong premium-shadow' : 'bg-background/80 backdrop-blur'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="glass-strong border-r border-gold/20 w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-gradient-gold text-2xl font-display">
                    RANG BIRANGI
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 mt-6">
                  {NAV_LINKS.map((link) => (
                    <button
                      key={link.categorySlug}
                      onClick={() => setView({ name: 'shop', categorySlug: link.categorySlug })}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                    >
                      <span>{link.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                  <div className="h-px bg-border my-2" />
                  <button
                    onClick={() => setView({ name: 'shop', filter: 'flash_sale' })}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <span className="text-accent">Flash Sale</span>
                    <ChevronRight className="h-4 w-4 text-accent" />
                  </button>
                  <button
                    onClick={() => setView({ name: 'shop', filter: 'new_arrivals' })}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <span>New Arrivals</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setView({ name: 'shop', filter: 'best_sellers' })}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  >
                    <span>Best Sellers</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <button
              onClick={() => setView({ name: 'home' })}
              className="flex items-center gap-2 group"
            >
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="RANG BIRANGI"
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border border-gold/30 group-hover:border-gold/60 transition-colors"
                />
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-lg font-display font-bold tracking-wider text-gradient-gold">
                  RANG BIRANGI
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Handcrafted Elegance
                </span>
              </div>
            </button>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.categorySlug}
                  onClick={() => setView({ name: 'shop', categorySlug: link.categorySlug })}
                  className="relative px-4 py-2 text-sm font-medium hover:text-accent transition-colors group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-accent group-hover:w-3/4 transition-all duration-300" />
                </button>
              ))}
              <div className="w-px h-6 bg-border mx-2" />
              <button
                onClick={() => setView({ name: 'shop', filter: 'flash_sale' })}
                className="relative px-4 py-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Flash Sale
              </button>
              <button
                onClick={() => setView({ name: 'shop', filter: 'new_arrivals' })}
                className="relative px-4 py-2 text-sm font-medium hover:text-accent transition-colors"
              >
                New Arrivals
              </button>
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Wishlist */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (user ? setView({ name: 'dashboard', tab: 'wishlist' }) : openAuth('login'))}
                aria-label="Wishlist"
                className="relative"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-background text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Button>

              {/* Cart */}
              <Button
                variant="ghost"
                size="icon"
                onClick={openCart}
                aria-label="Cart"
                className="relative"
              >
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-background text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Account */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (user) {
                    if (user.role === 'ADMIN') setView({ name: 'admin', tab: 'dashboard' })
                    else setView({ name: 'dashboard', tab: 'orders' })
                  } else {
                    openAuth('login')
                  }
                }}
                aria-label="Account"
              >
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.form
                onSubmit={handleSearch}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="py-4 flex gap-2">
                  <Input
                    autoFocus
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search for bangles, earrings, sarees, kurtis..."
                    className="bg-secondary/50 border-border"
                  />
                  <Button type="submit" className="bg-luxe-gradient hover:opacity-90">
                    <Search className="h-4 w-4 mr-2" /> Search
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </header>
    </>
  )
}
