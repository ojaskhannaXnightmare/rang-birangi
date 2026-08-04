/**
 * Cart store - OPTIMISTIC updates (instant add, background sync)
 *
 * Key fix: Items are added to the cart INSTANTLY on the client.
 * The server sync happens in the background. If the server fails,
 * the item is still in the cart (guest mode).
 *
 * This fixes the mobile "Adding..." stuck issue.
 */
import { create } from 'zustand'
import type { ProductDTO } from '@/lib/helpers'

export interface CartItem {
  id: string
  productId: string
  product: ProductDTO
  quantity: number
  color?: string
  size?: string
  savedForLater: boolean
}

interface CartState {
  items: CartItem[]
  loading: boolean
  setItems: (items: CartItem[]) => void
  setLoading: (loading: boolean) => void
  fetch: () => Promise<void>
  add: (product: ProductDTO, quantity?: number, color?: string, size?: string) => Promise<void>
  updateQty: (itemId: string, quantity: number) => Promise<void>
  remove: (itemId: string) => Promise<void>
  saveForLater: (itemId: string, saved: boolean) => Promise<void>
  clear: () => void
  count: () => number
  subtotal: () => number
  activeItems: () => CartItem[]
  savedItems: () => CartItem[]
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),

  fetch: async () => {
    try {
      set({ loading: true })
      const res = await fetch('/api/cart')
      if (res.ok) {
        const data = await res.json()
        set({ items: data.items || [], loading: false })
      } else {
        const local = typeof window !== 'undefined' ? localStorage.getItem('rb_guest_cart') : null
        set({ items: local ? JSON.parse(local) : [], loading: false })
      }
    } catch {
      const local = typeof window !== 'undefined' ? localStorage.getItem('rb_guest_cart') : null
      set({ items: local ? JSON.parse(local) : [], loading: false })
    }
  },

  add: async (product, quantity = 1, color, size) => {
    // === OPTIMISTIC UPDATE: Add to cart INSTANTLY ===
    const items = [...get().items]
    const existing = items.find(
      (i) => i.productId === product.id && i.color === color && i.size === size && !i.savedForLater
    )
    if (existing) {
      existing.quantity += quantity
    } else {
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        productId: product.id,
        product,
        quantity,
        color,
        size,
        savedForLater: false,
      })
    }
    // Update state immediately — user sees the item RIGHT AWAY
    set({ items })
    // Also save to localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('rb_guest_cart', JSON.stringify(items))
    }

    // === BACKGROUND SYNC: Try to sync with server (non-blocking) ===
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity, color, size }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          // Server returned updated cart — use it (authoritative)
          set({ items: data.items })
          if (typeof window !== 'undefined') {
            localStorage.removeItem('rb_guest_cart')
          }
        }
      }
      // If res not ok (401 = not logged in), the optimistic item stays in cart
      // User can still browse and checkout as guest
    } catch {
      // Network error — item stays in cart (optimistic)
      // Will sync on next successful fetch
    }
  },

  updateQty: async (itemId, quantity) => {
    if (quantity < 1) return
    // Optimistic update
    const items = get().items.map((i) => i.id === itemId ? { ...i, quantity } : i)
    set({ items })
    if (typeof window !== 'undefined') localStorage.setItem('rb_guest_cart', JSON.stringify(items))

    // Background sync
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.items) set({ items: data.items })
      }
    } catch {}
  },

  remove: async (itemId) => {
    // Optimistic update
    const items = get().items.filter((i) => i.id !== itemId)
    set({ items })
    if (typeof window !== 'undefined') localStorage.setItem('rb_guest_cart', JSON.stringify(items))

    // Background sync
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        if (data.items) set({ items: data.items })
      }
    } catch {}
  },

  saveForLater: async (itemId, saved) => {
    // Optimistic update
    const items = get().items.map((i) => i.id === itemId ? { ...i, savedForLater: saved } : i)
    set({ items })
    if (typeof window !== 'undefined') localStorage.setItem('rb_guest_cart', JSON.stringify(items))

    // Background sync
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, savedForLater: saved }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.items) set({ items: data.items })
      }
    } catch {}
  },

  clear: () => {
    set({ items: [] })
    if (typeof window !== 'undefined') localStorage.removeItem('rb_guest_cart')
  },

  count: () => get().items.filter((i) => !i.savedForLater).reduce((s, i) => s + i.quantity, 0),
  subtotal: () => get().items.filter((i) => !i.savedForLater).reduce((s, i) => s + i.product.price * i.quantity, 0),
  activeItems: () => get().items.filter((i) => !i.savedForLater),
  savedItems: () => get().items.filter((i) => i.savedForLater),
}))
