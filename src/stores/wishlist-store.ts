/**
 * Wishlist store - client-side state
 */
import { create } from 'zustand'
import type { ProductDTO } from '@/lib/helpers'

interface WishlistItem {
  id: string
  product: ProductDTO
}

interface WishlistState {
  items: WishlistItem[]
  loading: boolean
  setItems: (items: WishlistItem[]) => void
  fetch: () => Promise<void>
  toggle: (product: ProductDTO) => Promise<void>
  has: (productId: string) => boolean
  count: () => number
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  loading: false,
  setItems: (items) => set({ items }),

  fetch: async () => {
    try {
      set({ loading: true })
      const res = await fetch('/api/wishlist')
      if (res.ok) {
        const data = await res.json()
        set({ items: data.items || [], loading: false })
      } else {
        const local = typeof window !== 'undefined' ? localStorage.getItem('rb_guest_wishlist') : null
        set({ items: local ? JSON.parse(local) : [], loading: false })
      }
    } catch {
      set({ loading: false })
    }
  },

  toggle: async (product) => {
    const existing = get().items.find((i) => i.product.id === product.id)
    const res = await fetch('/api/wishlist', {
      method: existing ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id }),
    })
    if (res.ok) {
      await get().fetch()
    } else {
      // guest fallback
      let items = [...get().items]
      if (existing) {
        items = items.filter((i) => i.product.id !== product.id)
      } else {
        items.push({ id: `guest_${Date.now()}`, product })
      }
      set({ items })
      if (typeof window !== 'undefined') {
        localStorage.setItem('rb_guest_wishlist', JSON.stringify(items))
      }
    }
  },

  has: (productId) => get().items.some((i) => i.product.id === productId),
  count: () => get().items.length,
}))
