'use client'

import { useEffect } from 'react'
import { useUIStore, View } from '@/stores/ui-store'

/**
 * URL Router — syncs the URL hash with the app view state.
 * 
 * Routes:
 *   #/              → home
 *   #/shop          → shop (all products)
 *   #/shop/bangles  → shop (category)
 *   #/product/slug  → product detail
 *   #/cart          → cart
 *   #/checkout      → checkout
 *   #/dashboard     → customer dashboard
 *   #/admin         → admin panel
 *   #/login         → opens auth modal
 *   #/signup        → opens auth modal (register mode)
 */

function parseHash(): { view: View; openAuth?: 'login' | 'register' } {
  if (typeof window === 'undefined') return { view: { name: 'home' } }
  
  const hash = window.location.hash.replace(/^#/, '')
  const [path, ...rest] = hash.split('/')
  
  switch (path) {
    case '':
    case 'home':
      return { view: { name: 'home' } }
    case 'shop':
      if (rest[0]) {
        return { view: { name: 'shop', categorySlug: rest[0] } }
      }
      return { view: { name: 'shop' } }
    case 'product':
      if (rest[0]) {
        return { view: { name: 'product', slug: rest[0] } }
      }
      return { view: { name: 'home' } }
    case 'cart':
      return { view: { name: 'cart' } }
    case 'checkout':
      return { view: { name: 'checkout' } }
    case 'dashboard':
      return { view: { name: 'dashboard', tab: rest[0] } }
    case 'admin':
      return { view: { name: 'admin', tab: rest[0] } }
    case 'login':
      return { view: { name: 'home' }, openAuth: 'login' }
    case 'signup':
      return { view: { name: 'home' }, openAuth: 'register' }
    default:
      return { view: { name: 'home' } }
  }
}

function viewToHash(view: View): string {
  switch (view.name) {
    case 'home':
      return '#/'
    case 'shop':
      return view.categorySlug ? `#/shop/${view.categorySlug}` : '#/shop'
    case 'product':
      return `#/product/${view.slug}`
    case 'cart':
      return '#/cart'
    case 'checkout':
      return '#/checkout'
    case 'dashboard':
      return view.tab ? `#/dashboard/${view.tab}` : '#/dashboard'
    case 'admin':
      return view.tab ? `#/admin/${view.tab}` : '#/admin'
    default:
      return '#/'
  }
}

export function useUrlRouter() {
  const view = useUIStore((s) => s.view)
  const setView = useUIStore((s) => s.setView)
  const openAuth = useUIStore((s) => s.openAuth)

  // On mount: read hash → set view
  useEffect(() => {
    const { view: hashView, openAuth: authMode } = parseHash()
    setView(hashView)
    if (authMode) {
      setTimeout(() => openAuth(authMode), 300)
    }
  }, [])

  // When view changes: update hash
  useEffect(() => {
    const newHash = viewToHash(view)
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash)
    }
  }, [view])

  // Listen to hashchange (back/forward buttons)
  useEffect(() => {
    const onHashChange = () => {
      const { view: hashView, openAuth: authMode } = parseHash()
      setView(hashView)
      if (authMode) openAuth(authMode)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
}
