/**
 * UI store - manages view routing, cart drawer, auth modal, etc.
 * (Single-page app approach since only `/` route is exposed)
 */
import { create } from 'zustand'

export type View =
  | { name: 'home' }
  | { name: 'shop'; categorySlug?: string; filter?: string }
  | { name: 'product'; slug: string }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'order-success'; orderId: string }
  | { name: 'dashboard'; tab?: string }
  | { name: 'admin'; tab?: string }

interface UIState {
  view: View
  history: View[]
  cartOpen: boolean
  authModalOpen: boolean
  authModalMode: 'login' | 'register'
  searchOpen: boolean
  mobileMenuOpen: boolean
  wishlistOpen: boolean

  setView: (view: View) => void
  goBack: () => void
  openCart: () => void
  closeCart: () => void
  openAuth: (mode?: 'login' | 'register') => void
  closeAuth: () => void
  openSearch: () => void
  closeSearch: () => void
  openMobileMenu: () => void
  closeMobileMenu: () => void
  openWishlist: () => void
  closeWishlist: () => void
}

export const useUIStore = create<UIState>((set, get) => ({
  view: { name: 'home' },
  history: [],
  cartOpen: false,
  authModalOpen: false,
  authModalMode: 'login',
  searchOpen: false,
  mobileMenuOpen: false,
  wishlistOpen: false,

  setView: (view) =>
    set((state) => ({
      view,
      history: [...state.history, state.view].slice(-20),
      cartOpen: false,
      mobileMenuOpen: false,
      wishlistOpen: false,
    })),

  goBack: () =>
    set((state) => {
      if (state.history.length === 0) return { view: { name: 'home' } }
      const history = [...state.history]
      const prev = history.pop()!
      return { view: prev, history }
    }),

  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  openAuth: (mode = 'login') => set({ authModalOpen: true, authModalMode: mode }),
  closeAuth: () => set({ authModalOpen: false }),
  openSearch: () => set({ searchOpen: true }),
  closeSearch: () => set({ searchOpen: false }),
  openMobileMenu: () => set({ mobileMenuOpen: true }),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),
  openWishlist: () => set({ wishlistOpen: true }),
  closeWishlist: () => set({ wishlistOpen: false }),
}))
