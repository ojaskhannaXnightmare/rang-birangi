'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Sparkles, Star, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import { HeroCarousel } from './hero-carousel'
import { CategoryCard } from './category-card'
import { ProductCard } from './product-card'
import type { ProductDTO } from '@/lib/helpers'

interface Section {
  id: string
  key: string
  title: string
  subtitle: string | null
  isEnabled: boolean
}

interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  buttonText: string | null
  linkUrl: string | null
  position: string
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
}

interface Review {
  id: string
  rating: number
  title: string | null
  comment: string | null
  user: { name: string | null; avatarUrl: string | null }
  product?: { name: string } | null
}

export function StorefrontHome() {
  const setView = useUIStore((s) => s.setView)
  const [sections, setSections] = useState<Section[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Record<string, ProductDTO[]>>({})
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/homepage').then((r) => r.json()),
      fetch('/api/banners').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/reviews?limit=6').then((r) => r.json()),
    ]).then(([hp, bn, cat, rev]) => {
      setSections(hp.sections || [])
      setBanners(bn.banners || [])
      setCategories(cat.categories || [])
      setReviews(rev.reviews || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (sections.length === 0) return
    const enabledSections = sections.filter((s) => s.isEnabled)
    const filterMap: Record<string, string> = {
      trending: 'trending',
      new_arrivals: 'new_arrivals',
      flash_sale: 'flash_sale',
      featured: 'featured',
      handmade: 'handmade',
      best_sellers: 'best_sellers',
    }
    enabledSections.forEach((s) => {
      const filter = filterMap[s.key]
      if (filter && !products[filter]) {
        fetch(`/api/products?filter=${filter}&limit=8`)
          .then((r) => r.json())
          .then((data) => {
            setProducts((prev) => ({ ...prev, [filter]: data.products || [] }))
          })
      }
    })
  }, [sections, products])

  const enabledSections = sections.filter((s) => s.isEnabled)
  const heroBanners = banners.filter((b) => b.position === 'HERO')
  const middleBanners = banners.filter((b) => b.position === 'MIDDLE')

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-luxe-gradient animate-pulse" />
          <p className="text-muted-foreground">Loading RANG BIRANGI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16">
      {/* Hero */}
      {enabledSections.find((s) => s.key === 'hero') && (
        <HeroCarousel banners={heroBanners} />
      )}

      {/* Trust badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
          { icon: ShieldCheck, title: 'Secure Payment', desc: 'UPI & COD available' },
          { icon: RotateCcw, title: 'Easy Returns', desc: '7-day return policy' },
          { icon: Sparkles, title: 'Handcrafted', desc: 'By Indian artisans' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-4 rounded-xl glass border border-gold/10 hover-lift"
          >
            <div className="w-10 h-10 rounded-full bg-luxe-gradient flex items-center justify-center flex-shrink-0">
              <item.icon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Categories */}
      {enabledSections.find((s) => s.key === 'categories') && (
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-accent mb-1">Curated Collections</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold">Shop by Category</h2>
            </div>
            <Button
              variant="ghost"
              onClick={() => setView({ name: 'shop' })}
              className="hidden md:flex text-accent hover:text-accent/80"
            >
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} category={cat} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {enabledSections.find((s) => s.key === 'trending') && products.trending && products.trending.length > 0 && (
        <ProductSection
          title="Trending Now"
          subtitle="Most loved this week"
          products={products.trending}
          onViewAll={() => setView({ name: 'shop', filter: 'trending' })}
        />
      )}

      {/* Middle banner */}
      {middleBanners.length > 0 && (
        <section className="relative h-[200px] md:h-[280px] rounded-2xl overflow-hidden premium-shadow">
          <img src={middleBanners[0].imageUrl} alt={middleBanners[0].title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-6 lg:px-12">
              <div className="max-w-md">
                <h2 className="text-2xl md:text-4xl font-display font-bold text-gradient-gold mb-2">
                  {middleBanners[0].title}
                </h2>
                {middleBanners[0].subtitle && (
                  <p className="text-sm md:text-base text-foreground/80 mb-4">
                    {middleBanners[0].subtitle}
                  </p>
                )}
                {middleBanners[0].buttonText && (
                  <Button
                    onClick={() => {
                      const url = middleBanners[0].linkUrl
                      if (url?.startsWith('section:')) {
                        const sec = url.split(':')[1]
                        if (sec === 'flash_sale') setView({ name: 'shop', filter: 'flash_sale' })
                      }
                    }}
                    className="bg-gold-gradient text-background hover:opacity-90"
                  >
                    {middleBanners[0].buttonText} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {enabledSections.find((s) => s.key === 'new_arrivals') && products.new_arrivals && products.new_arrivals.length > 0 && (
        <ProductSection
          title="New Arrivals"
          subtitle="Fresh additions to our collection"
          products={products.new_arrivals}
          onViewAll={() => setView({ name: 'shop', filter: 'new_arrivals' })}
        />
      )}

      {/* Flash Sale */}
      {enabledSections.find((s) => s.key === 'flash_sale') && products.flash_sale && products.flash_sale.length > 0 && (
        <section>
          <div className="relative rounded-2xl bg-luxe-gradient p-6 md:p-8 mb-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            <div className="relative flex items-end justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 mb-2">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span className="text-xs uppercase tracking-wider text-accent">Limited Time</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">
                  Flash Sale
                </h2>
                <p className="text-sm text-foreground/70 mt-1">Up to 40% off on selected items</p>
              </div>
              <Button
                onClick={() => setView({ name: 'shop', filter: 'flash_sale' })}
                className="bg-gold-gradient text-background hover:opacity-90 hidden md:flex"
              >
                View All <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.flash_sale.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      {enabledSections.find((s) => s.key === 'featured') && products.featured && products.featured.length > 0 && (
        <ProductSection
          title="Featured Products"
          subtitle="Curated picks just for you"
          products={products.featured}
          onViewAll={() => setView({ name: 'shop', filter: 'featured' })}
        />
      )}

      {/* Handmade Collection */}
      {enabledSections.find((s) => s.key === 'handmade') && products.handmade && products.handmade.length > 0 && (
        <ProductSection
          title="Handmade Collection"
          subtitle="Crafted with love by Indian artisans"
          products={products.handmade}
          onViewAll={() => setView({ name: 'shop', filter: 'handmade' })}
        />
      )}

      {/* Best Sellers */}
      {enabledSections.find((s) => s.key === 'best_sellers') && products.best_sellers && products.best_sellers.length > 0 && (
        <ProductSection
          title="Best Sellers"
          subtitle="Customer favorites you'll love"
          products={products.best_sellers}
          onViewAll={() => setView({ name: 'shop', filter: 'best_sellers' })}
        />
      )}

      {/* Reviews */}
      {enabledSections.find((s) => s.key === 'reviews') && reviews.length > 0 && (
        <section>
          <div className="text-center mb-8">
            <p className="text-xs uppercase tracking-wider text-accent mb-1">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-display font-bold">What Our Customers Say</h2>
            <div className="flex items-center justify-center gap-1 mt-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 fill-accent text-accent" />
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                4.8/5 from 2,500+ happy customers
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reviews.slice(0, 6).map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-5 rounded-xl glass border border-gold/10 hover-lift"
              >
                <Quote className="h-6 w-6 text-accent/40 mb-3" />
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${s <= r.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                {r.title && <h4 className="font-medium mb-1">{r.title}</h4>}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{r.comment}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-luxe-gradient flex items-center justify-center">
                    <span className="text-accent text-xs font-bold">
                      {(r.user.name || 'A')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{r.user.name || 'Anonymous'}</p>
                    {r.product && (
                      <p className="text-xs text-muted-foreground">on {r.product.name}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      {enabledSections.find((s) => s.key === 'newsletter') && (
        <NewsletterSection />
      )}
    </div>
  )
}

function ProductSection({
  title,
  subtitle,
  products,
  onViewAll,
}: {
  title: string
  subtitle: string
  products: ProductDTO[]
  onViewAll: () => void
}) {
  return (
    <section>
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-accent mb-1">Collection</p>
          <h2 className="text-3xl md:text-4xl font-display font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
        <Button variant="ghost" onClick={onViewAll} className="text-accent hover:text-accent/80 hidden md:flex">
          View All <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.slice(0, 8).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  )
}

function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  return (
    <section className="relative rounded-2xl bg-luxe-gradient p-8 md:p-12 overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      <div className="relative max-w-2xl mx-auto text-center">
        <Sparkles className="h-10 w-10 text-accent mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-3">
          Join the RANG BIRANGI Family
        </h2>
        <p className="text-foreground/80 mb-6">
          Subscribe for exclusive offers, new arrivals, and styling tips.
          Get 10% off your first order!
        </p>
        {subscribed ? (
          <div className="p-4 rounded-xl glass border border-gold/30">
            <p className="text-accent font-medium">Thank you for subscribing! Check your inbox for the 10% off code.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSubscribed(true)
            }}
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-background/80 border border-border focus:border-accent outline-none text-sm"
            />
            <Button type="submit" className="bg-gold-gradient text-background hover:opacity-90">
              Subscribe
            </Button>
          </form>
        )}
      </div>
    </section>
  )
}
