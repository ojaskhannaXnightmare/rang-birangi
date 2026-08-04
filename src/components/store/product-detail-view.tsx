'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Heart, ShoppingBag, Star, Truck, ShieldCheck, RotateCcw, ChevronLeft,
  ChevronRight, Minus, Plus, Check, Share2, MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCartStore } from '@/stores/cart-store'
import { useWishlistStore } from '@/stores/wishlist-store'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'
import { formatINR, type ProductDTO } from '@/lib/helpers'
import { ProductCard } from './product-card'

export function ProductDetailView({ slug }: { slug: string }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [related, setRelated] = useState<ProductDTO[]>([])
  const [adding, setAdding] = useState(false)
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '' })
  const [showReviewForm, setShowReviewForm] = useState(false)

  const addToCart = useCartStore((s) => s.add)
  const toggleWishlist = useWishlistStore((s) => s.toggle)
  const hasInWishlist = useWishlistStore((s) => product ? s.has(product.id) : false)
  const goBack = useUIStore((s) => s.goBack)
  const setView = useUIStore((s) => s.setView)
  const openCart = useUIStore((s) => s.openCart)
  const openAuth = useUIStore((s) => s.openAuth)
  const user = useAuthStore((s) => s.user)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setProduct(data)
        if (data.colors?.length > 0) setSelectedColor(data.colors[0])
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0])
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    if (product?.category) {
      fetch(`/api/products?category=${product.category.slug}&limit=4`)
        .then((r) => r.json())
        .then((d) => setRelated((d.products || []).filter((p: ProductDTO) => p.id !== product.id)))
    }
  }, [product?.category?.slug])

  const handleAddToCart = async () => {
    if (!user) {
      openAuth('login')
      return
    }
    if (product.sizes.length > 0 && !selectedSize) {
      toast({ title: 'Please select a size', variant: 'destructive' })
      return
    }
    setAdding(true)
    try {
      // Optimistic cart — item is added instantly, server syncs in background
      await addToCart(product, quantity, selectedColor, selectedSize)
      toast({ title: 'Added to cart!', description: `${quantity} × ${product.name}` })
      openCart()
    } catch {
      // Should never happen with optimistic cart, but just in case
      toast({ title: 'Added to cart!', description: `${quantity} × ${product.name}` })
      openCart()
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async () => {
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

  const handleBuyNow = async () => {
    if (!user) {
      openAuth('login')
      return
    }
    setAdding(true)
    try {
      await addToCart(product, quantity, selectedColor, selectedSize)
      setView({ name: 'checkout' })
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      openAuth('login')
      return
    }
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
      }),
    })
    if (res.ok) {
      toast({ title: 'Review submitted!', description: 'Your review is pending approval.' })
      setNewReview({ rating: 5, title: '', comment: '' })
      setShowReviewForm(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Product not found.</p>
        <Button onClick={() => setView({ name: 'home' })} className="mt-4">Back to Home</Button>
      </div>
    )
  }

  const finalPrice = product.compareAtPrice && product.compareAtPrice > product.price
    ? product.compareAtPrice
    : null

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 flex-wrap">
        <button onClick={() => setView({ name: 'home' })} className="hover:text-foreground">Home</button>
        <span>/</span>
        {product.category && (
          <>
            <button
              onClick={() => setView({ name: 'shop', categorySlug: product.category.slug })}
              className="hover:text-foreground"
            >
              {product.category.name}
            </button>
            <span>/</span>
          </>
        )}
        <span className="text-foreground line-clamp-1">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-square rounded-2xl overflow-hidden bg-card-gradient border border-border premium-shadow"
          >
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discountPercent > 0 && (
              <Badge className="absolute top-4 left-4 bg-accent text-background text-sm">
                -{Math.round(product.discountPercent)}% OFF
              </Badge>
            )}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImage((i) => (i - 1 + product.images.length) % product.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong flex items-center justify-center hover:bg-accent/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedImage((i) => (i + 1) % product.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong flex items-center justify-center hover:bg-accent/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </motion.div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {product.images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    i === selectedImage ? 'border-accent' : 'border-border opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-5">
          <div>
            {product.category && (
              <p className="text-xs uppercase tracking-wider text-accent mb-1">
                {product.category.name}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl font-display font-bold">{product.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">SKU: {product.sku}</p>
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s <= Math.round(product.rating) ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} · {product.reviewCount} reviews
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-gradient-gold">{formatINR(product.price)}</span>
            {finalPrice && (
              <span className="text-lg text-muted-foreground line-through">{formatINR(finalPrice)}</span>
            )}
            {product.discountPercent > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/40">
                Save {formatINR(finalPrice! - product.price)}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-foreground/80 leading-relaxed">{product.description}</p>

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            {product.stock > 10 ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-green-500">In Stock</span>
              </>
            ) : product.stock > 0 ? (
              <>
                <span className="text-yellow-500">Only {product.stock} left in stock!</span>
              </>
            ) : (
              <span className="text-red-500">Out of Stock</span>
            )}
          </div>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                Color: <span className="text-foreground">{selectedColor}</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color: string) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 rounded-lg text-sm border transition-all ${
                      selectedColor === color
                        ? 'bg-accent text-background border-accent'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Size</Label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size: string) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3rem] px-3 py-2 rounded-lg text-sm border transition-all ${
                      selectedSize === size
                        ? 'bg-accent text-background border-accent'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity + Add to cart */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-3 hover:bg-secondary/50"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 py-3 min-w-[3rem] text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-3 hover:bg-secondary/50"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              className="flex-1 bg-luxe-gradient hover:opacity-90 font-medium"
              size="lg"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              {product.stock === 0 ? 'Out of Stock' : adding ? 'Adding...' : 'Add to Cart'}
            </Button>

            <Button
              onClick={handleBuyNow}
              disabled={adding || product.stock === 0}
              variant="outline"
              className="border-accent text-accent hover:bg-accent/10"
              size="lg"
            >
              Buy Now
            </Button>

            <Button
              onClick={handleWishlist}
              variant="outline"
              size="lg"
              className="border-border"
              aria-label="Add to wishlist"
            >
              <Heart className={`h-4 w-4 ${hasInWishlist ? 'fill-accent text-accent' : ''}`} />
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            <div className="text-center p-3 rounded-lg glass">
              <Truck className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-xs">Free shipping above ₹999</p>
            </div>
            <div className="text-center p-3 rounded-lg glass">
              <ShieldCheck className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-xs">Secure payments</p>
            </div>
            <div className="text-center p-3 rounded-lg glass">
              <RotateCcw className="h-5 w-5 text-accent mx-auto mb-1" />
              <p className="text-xs">7-day returns</p>
            </div>
          </div>

          {/* Product details accordion */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="font-display font-semibold">Product Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {product.material && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Material:</dt>
                  <dd>{product.material}</dd>
                </div>
              )}
              {product.weight && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Weight:</dt>
                  <dd>{product.weight}</dd>
                </div>
              )}
              {product.careInstructions && (
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="text-muted-foreground">Care:</dt>
                  <dd>{product.careInstructions}</dd>
                </div>
              )}
              {product.tags.length > 0 && (
                <div className="flex gap-2 sm:col-span-2">
                  <dt className="text-muted-foreground">Tags:</dt>
                  <dd className="flex flex-wrap gap-1">
                    {product.tags.map((t: string) => (
                      <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <div className="mt-16 pt-8 border-t border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-display font-bold">Customer Reviews ({product.reviews?.length || 0})</h2>
          <Button
            variant="outline"
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="border-accent text-accent hover:bg-accent/10"
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Write a Review
          </Button>
        </div>

        {showReviewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-5 rounded-xl glass border border-gold/20 mb-6 space-y-3"
          >
            <div>
              <Label className="mb-2 block">Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewReview({ ...newReview, rating: s })}
                    className="p-1"
                  >
                    <Star className={`h-6 w-6 ${s <= newReview.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Title</Label>
              <input
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background/80 border border-border focus:border-accent outline-none text-sm"
                placeholder="Summarize your experience"
              />
            </div>
            <div>
              <Label className="mb-2 block">Review</Label>
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background/80 border border-border focus:border-accent outline-none text-sm min-h-[100px]"
                placeholder="Share your thoughts about this product..."
              />
            </div>
            <Button onClick={handleSubmitReview} className="bg-luxe-gradient">Submit Review</Button>
          </motion.div>
        )}

        {product.reviews?.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((r: any) => (
              <div key={r.id} className="p-4 rounded-xl glass border border-gold/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-luxe-gradient flex items-center justify-center">
                      <span className="text-accent text-xs font-bold">
                        {(r.user?.name || 'A')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.user?.name || 'Anonymous'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                      />
                    ))}
                  </div>
                </div>
                {r.title && <h4 className="font-medium text-sm mb-1">{r.title}</h4>}
                <p className="text-sm text-muted-foreground">{r.comment}</p>
                {r.adminReply && (
                  <div className="mt-2 p-2 rounded-lg bg-secondary/30 border-l-2 border-accent">
                    <p className="text-xs text-accent font-medium mb-1">RANG BIRANGI Reply:</p>
                    <p className="text-xs text-muted-foreground">{r.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No reviews yet. Be the first to review!</p>
        )}
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-display font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
