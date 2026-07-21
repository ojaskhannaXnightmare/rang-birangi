'use client'

import { useEffect, useState, useMemo } from 'react'
import { use } from 'react'
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { ProductCard } from './product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ProductDTO } from '@/lib/helpers'

interface ShopViewProps {
  categorySlug?: string
  filter?: string
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
]

const FILTER_LABELS: Record<string, string> = {
  trending: 'Trending Now',
  new_arrivals: 'New Arrivals',
  flash_sale: 'Flash Sale',
  featured: 'Featured Products',
  handmade: 'Handmade Collection',
  best_sellers: 'Best Sellers',
}

export function ShopView({ categorySlug, filter }: ShopViewProps) {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  // Initialize search from sessionStorage (set by navbar) on first render
  const [search, setSearch] = useState(() => {
    if (typeof window === 'undefined') return ''
    const saved = sessionStorage.getItem('rb_search')
    if (saved) {
      sessionStorage.removeItem('rb_search')
      return saved
    }
    return ''
  })
  const [sort, setSort] = useState('newest')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 15000])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
  }, [])

  // Fetch products
  useEffect(() => {
    let cancelled = false
    const params = new URLSearchParams()
    if (categorySlug) params.set('category', categorySlug)
    if (filter) params.set('filter', filter)
    if (search) params.set('search', search)
    if (sort) params.set('sort', sort)
    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]))
    if (priceRange[1] < 15000) params.set('maxPrice', String(priceRange[1]))
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        setProducts(data.products || [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [categorySlug, filter, search, sort, priceRange])

  const allColors = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => p.colors.forEach((c) => set.add(c)))
    return Array.from(set)
  }, [products])

  const filteredProducts = useMemo(() => {
    if (selectedColors.length === 0) return products
    return products.filter((p) => p.colors.some((c) => selectedColors.includes(c)))
  }, [products, selectedColors])

  const activeCategory = categories.find((c) => c.slug === categorySlug)
  const title = filter
    ? FILTER_LABELS[filter] || 'Shop'
    : activeCategory?.name || 'All Products'

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <span>Home</span>
        <span>/</span>
        <span className="text-foreground">{title}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-gradient-gold">
            {title}
          </h1>
          {activeCategory?.description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              {activeCategory.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="glass border-gold/20">
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="glass-strong border-r border-gold/20 w-[320px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="text-gradient-gold">Filters</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Search */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Search</Label>
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products..."
                    className="bg-secondary/50"
                  />
                </div>

                {/* Price */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">
                    Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                  </Label>
                  <Slider
                    min={0}
                    max={15000}
                    step={100}
                    value={[priceRange[0], priceRange[1]]}
                    onValueChange={(v) => setPriceRange([v[0], v[1]] as [number, number])}
                    className="my-4"
                  />
                </div>

                {/* Colors */}
                {allColors.length > 0 && (
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Colors</Label>
                    <div className="flex flex-wrap gap-2">
                      {allColors.map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            setSelectedColors((prev) =>
                              prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                            )
                          }
                          className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                            selectedColors.includes(c)
                              ? 'bg-accent text-background border-accent'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sort */}
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Sort By</Label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSearch('')
                    setPriceRange([0, 15000])
                    setSelectedColors([])
                    setSort('newest')
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px] glass border-gold/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No products found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
