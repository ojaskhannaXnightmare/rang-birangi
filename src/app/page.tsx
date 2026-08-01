'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'

import { Navbar } from '@/components/store/navbar'
import { Footer } from '@/components/store/footer'
import { StorefrontHome } from '@/components/store/storefront-home'
import { ShopView } from '@/components/store/shop-view'
import { ProductDetailView } from '@/components/store/product-detail-view'
import { CartDrawer } from '@/components/store/cart-drawer'
import { CheckoutView } from '@/components/store/checkout-view'
import { OrderSuccessView } from '@/components/store/order-success-view'
import { AuthModal } from '@/components/store/auth-modal'
import { CustomerDashboard } from '@/components/store/customer-dashboard'
import { FloatingAdminButton } from '@/components/store/floating-admin-button'
import { AdminPanel } from '@/components/admin/admin-panel'

export default function Home() {
  const view = useUIStore((s) => s.view)
  const setView = useUIStore((s) => s.setView)
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const fetchCart = useCartStore((s) => s.fetch)
  const fetchWishlist = useWishlistStore((s) => s.fetch)

  // Initial load: fetch user, cart, wishlist
  useEffect(() => {
    fetchUser().then(() => {
      // Only fetch cart/wishlist after user is resolved
      fetchCart()
      fetchWishlist()
    })
  }, [fetchUser, fetchCart, fetchWishlist])

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [view])

  // Admin view: full-screen layout (no navbar/footer)
  if (view.name === 'admin') {
    return (
      <>
        <AdminPanel tab={view.tab} />
        <AuthModal />
        <FloatingAdminButton />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {view.name === 'home' && <StorefrontHome />}
        {view.name === 'shop' && (
          <ShopView categorySlug={view.categorySlug} filter={view.filter} />
        )}
        {view.name === 'product' && <ProductDetailView slug={view.slug} />}
        {view.name === 'cart' && (
          <div className="container mx-auto px-4 py-6">
            <CartPage />
          </div>
        )}
        {view.name === 'checkout' && <CheckoutView />}
        {view.name === 'order-success' && <OrderSuccessView orderId={view.orderId} />}
        {view.name === 'dashboard' && <CustomerDashboard tab={view.tab} />}
      </main>

      <Footer />

      {/* Overlays */}
      <CartDrawer />
      <AuthModal />
      <FloatingAdminButton />
    </div>
  )
}

function CartPage() {
  // For simplicity, redirect to checkout view
  return <CheckoutView />
}
