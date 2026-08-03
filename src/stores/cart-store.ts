/**
 * Cart store - client-side cart state synced with server
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

  // Selectors
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
        // Not logged in or error — use guest cart from localStorage
        const local = typeof window !== 'undefined' ? localStorage.getItem('rb_guest_cart') : null
        if (local) {
          try {
            set({ items: JSON.parse(local), loading: false })
          } catch {
            set({ items: [], loading: false })
          }
        } else {
          set({ items: [], loading: false })
        }
      }
    } catch {
      // Network error — try guest cart
      const local = typeof window !== 'undefined' ? localStorage.getItem('rb_guest_cart') : null
      if (local) {
        try {
          set({ items: JSON.parse(local), loading: false })
        } catch {
          set({ items: [], loading: false })
        }
      } else {
        set({ items: [], loading: false })
      }
    }
  },

  add: async (product, quantity = 1, color, size) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity, color, size }),
      })

      if (res.ok) {
        // Use the response directly — don't do a separate fetch
        const data = await res.json()
        if (data.items) {
          set({ items: data.items })
        } else {
          // Fallback: fetch if response didn't include items
          await get().fetch()
        }
      } else {
        // Not logged in (401) or other error — use guest cart
        const items = [...get().items]
        const existing = items.find(
          (i) => i.productId === product.id && i.color === color && i.size === size && !i.savedForLater
        )
        if (existing) {
          existing.quantity += quantity
        } else {
          items.push({
            id: `guest_${Date.now()}`,
            productId: product.id,
            product,
            quantity,
            color,
            size,
            savedForLater: false,
          })
        }
        set({ items })
        if (typeof window !== 'undefined') {
          localStorage.setItem('rb_guest_cart', JSON.stringify(items))
        }
      }
    } catch {
      // Network error — use guest cart
      const items = [...get().items]
      const existing = items.find(
        (i) => i.productId === product.id && i.color === color && i.size === size && !i.savedForLater
      )
      if (existing) {
        existing.quantity += quantity
      } else {
        items.push({
          id: `guest_${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          color,
          size,
          savedForLater: false,
        })
      }
      set({ items })
      if (typeof window !== 'undefined') {
        localStorage.setItem('rb_guest_cart', JSON.stringify(items))
      }
    }
  },

  updateQty: async (itemId, quantity) => {
    if (quantity < 1) return
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.items) {
          set({ items: data.items })
        } else {
          await get().fetch()
        }
      } else {
        // Guest fallback
        const items = get().items.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        )
        set({ items })
        if (typeof window !== 'undefined') {
          localStorage.setItem('rb_guest_cart', JSON.stringify(items))
        }
      }
    } catch {
      // Guest fallback
      const items = get().items.map((i) =>
        i.id === itemId ? { ...i, quantity } : i
      )
      set({ items })
      if (typeof window !== 'undefined') {
        localStorage.setItem('rb_guest_cart', JSON.stringify(items))
      }
    }
  },

  remove: async (itemId) => {
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        if (data.items) {
          set({ items: data.items })
        } else {
          await get().fetch()
        }
      } else {
        // Guest fallback
        const items = get().items.filter((i) => i.id !== itemId)
        set({ items })
        if (typeof window !== 'undefined') {
          localStorage.setItem('rb_guest_cart', JSON.stringify(items))
        }
      }
    } catch {
      // Guest fallback
      const items = get().items.filter((i) => i.id !== itemId)
      set({ items })
      if (typeof window !== 'undefined') {
        localStorage.setItem('rb_guest_cart', JSON.stringify(items))
      }
    }
  },

  saveForLater: async (itemId, saved) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, savedForLater: saved }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.items) {
          set({ items: data.items })
        } else {
          await get().fetch()
        }
      } else {
        // Guest fallback
        const items = get().items.map((i) =>
          i.id === itemId ? { ...i, savedForLater: saved } : i
        )
        set({ items })
        if (typeof window !== 'undefined') {
          localStorage.setItem('rb_guest_cart', JSON.stringify(items))
        }
      }
    } catch {
      // Guest fallback
      const items = get().items.map((i) =>
        i.id === itemId ? { ...i, savedForLater: saved } : i
      )
      set({ items })
      if (typeof window !== 'undefined') {
        localStorage.setItem('rb_guest_cart', JSON.stringify(items))
      }
    }
  },

  clear: () => {
    set({ items: [] })
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rb_guest_cart')
    }
  },

  count: () => get().items.filter((i) => !i.savedForLater).reduce((s, i) => s + i.quantity, 0),
  subtotal: () =>
    get()
      .items.filter((i) => !i.savedForLater)
      .reduce((s, i) => s + i.product.price * i.quantity, 0),
  activeItems: () => get().items.filter((i) => !i.savedForLater),
  savedItems: () => get().items.filter((i) => i.savedForLater),
}))
