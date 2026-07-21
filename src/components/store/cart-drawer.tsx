'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Heart, Bookmark,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { formatINR } from '@/lib/helpers'
import { Skeleton } from '@/components/ui/skeleton'

export function CartDrawer() {
  const open = useUIStore((s) => s.cartOpen)
  const closeCart = useUIStore((s) => s.closeCart)
  const setView = useUIStore((s) => s.setView)
  const openAuth = useUIStore((s) => s.openAuth)
  const { items, fetch, updateQty, remove, saveForLater, loading } = useCartStore()
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()

  useEffect(() => {
    if (open) fetch()
  }, [open, fetch])

  const activeItems = items.filter((i) => !i.savedForLater)
  const savedItems = items.filter((i) => i.savedForLater)
  const subtotal = activeItems.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const freeShipThreshold = 999
  const remaining = Math.max(0, freeShipThreshold - subtotal)
  const progress = Math.min(100, (subtotal / freeShipThreshold) * 100)

  const handleCheckout = () => {
    if (!user) {
      openAuth('login')
      return
    }
    closeCart()
    setView({ name: 'checkout' })
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[450px] glass-strong border-l border-gold/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-accent" />
                <h2 className="font-display font-bold text-lg">
                  Cart ({activeItems.length})
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={closeCart}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Free shipping progress */}
            {activeItems.length > 0 && (
              <div className="p-4 border-b border-border bg-secondary/20">
                {remaining > 0 ? (
                  <p className="text-xs text-muted-foreground mb-2">
                    Add <span className="text-accent font-medium">{formatINR(remaining)}</span> more for FREE shipping!
                  </p>
                ) : (
                  <p className="text-xs text-green-500 mb-2 flex items-center gap-1">
                    <Heart className="h-3 w-3 fill-current" /> You've unlocked FREE shipping!
                  </p>
                )}
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gold-gradient"
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))
              ) : activeItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">Your cart is empty</p>
                  <Button
                    onClick={() => {
                      closeCart()
                      setView({ name: 'home' })
                    }}
                    className="bg-luxe-gradient"
                  >
                    Continue Shopping
                  </Button>
                </div>
              ) : (
                <>
                  {activeItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="flex gap-3 p-3 rounded-xl glass border border-gold/10"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-20 h-24 object-cover rounded-lg cursor-pointer"
                        onClick={() => {
                          closeCart()
                          setView({ name: 'product', slug: item.product.slug })
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {item.color && `Color: ${item.color}`}
                          {item.size && ` · Size: ${item.size}`}
                        </p>
                        <p className="text-sm font-semibold text-accent mt-1">
                          {formatINR(item.product.price)}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-border rounded-md">
                            <button
                              onClick={() => updateQty(item.id, item.quantity - 1)}
                              className="px-2 py-1 hover:bg-secondary/50"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="px-3 text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQty(item.id, item.quantity + 1)}
                              className="px-2 py-1 hover:bg-secondary/50"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => saveForLater(item.id, true)}
                              className="h-7 px-2 text-xs"
                            >
                              <Bookmark className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                remove(item.id)
                                toast({ title: 'Item removed' })
                              }}
                              className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Saved items */}
                  {savedItems.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                        Saved for Later ({savedItems.length})
                      </p>
                      {savedItems.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 rounded-xl bg-secondary/20 mb-2">
                          <img src={item.product.images[0]} alt={item.product.name} className="w-16 h-20 object-cover rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium line-clamp-1">{item.product.name}</h4>
                            <p className="text-sm font-semibold text-accent mt-1">{formatINR(item.product.price)}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => saveForLater(item.id, false)}
                              className="mt-2 h-7 text-xs"
                            >
                              Move to Cart
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            {activeItems.length > 0 && (
              <div className="p-4 border-t border-border glass-strong">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold">{formatINR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className={remaining > 0 ? '' : 'text-green-500 font-medium'}>
                      {remaining > 0 ? formatINR(49) : 'FREE'}
                    </span>
                  </div>
                  <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-gradient-gold">
                      {formatINR(subtotal + (remaining > 0 ? 49 : 0))}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gold-gradient text-background hover:opacity-90 font-medium"
                  size="lg"
                >
                  {user ? 'Proceed to Checkout' : 'Login to Checkout'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
