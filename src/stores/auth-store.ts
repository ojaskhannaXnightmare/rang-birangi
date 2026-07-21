/**
 * Auth store - client-side user state
 */
import { create } from 'zustand'

export interface ClientUser {
  id: string
  email: string
  name: string | null
  role: 'CUSTOMER' | 'ADMIN'
  phone: string | null
}

interface AuthState {
  user: ClientUser | null
  loading: boolean
  setUser: (user: ClientUser | null) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null })
  },
  fetchUser: async () => {
    try {
      set({ loading: true })
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const user = await res.json()
        set({ user, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },
}))
