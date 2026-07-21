'use client'

import { Heart, ShoppingBag, Star, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { formatINR, type ProductDTO } from '@/lib/helpers'
import { useState } from 'react'

interface Props {
  product: ProductDTO
  index?: number
}

export function ProductCard({ product, index = 0 }: Props) {
  const addToCart = useCartStore((s) => s.add)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const hasInWishlist = useWishlistStore((s) => s.has(product.id))
  const setView = useUIStore((s) => s.setView)
  const openAuth = useUIStore((s) => s.openAuth)
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()
  const [adding, setAdding] = useState(false)

  const finalPrice = product.compareAtPrice && product.compareAtPrice > product.price
    ? product.compareAtPrice
    : null

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      openAuth('login')
      return
    }
    setAdding(true)
    try {
      await addToCart(product, 1)
      toast({ title: 'Added to cart!', description: product.name })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      openAuth('login')
      return
    }
    await toggleWishlist(product)
    toast({
      title: hasInWishlist ? 'Removed from wishlist' : 'Added to wishlist',
      description: product.name,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
      onClick={() => setView({ name: 'product', slug: product.slug })}
      className="group relative cursor-pointer"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-card-gradient border border-border hover-lift">
        {/* Image */}
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.discountPercent > 0 && (
            <Badge className="bg-accent text-background font-medium">
              -{Math.round(product.discountPercent)}%
            </Badge>
          )}
          {product.isNewArrival && (
            <Badge className="bg-primary text-primary-foreground">NEW</Badge>
          )}
          {product.isHandmade && (
            <Badge variant="outline" className="bg-background/80 backdrop-blur border-accent/40 text-accent">
              HANDMADE
            </Badge>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 w-9 h-9 rounded-full glass-strong flex items-center justify-center hover:bg-accent/20 transition-colors"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`h-4 w-4 ${hasInWishlist ? 'fill-accent text-accent' : 'text-foreground'}`}
          />
        </button>

        {/* Hover actions */}
        <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-background/95 via-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
            className="w-full bg-gold-gradient text-background hover:opacity-90 font-medium"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
          </Button>
        </div>

        {/* Quick view indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <Eye className="h-5 w-5 text-accent" />
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1">
        {product.category && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {product.category.name}
          </p>
        )}
        <h3 className="font-medium text-sm line-clamp-1 group-hover:text-accent transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3 w-3 ${
                    s <= Math.round(product.rating)
                      ? 'fill-accent text-accent'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-foreground">
            {formatINR(product.price)}
          </span>
          {finalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatINR(finalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
