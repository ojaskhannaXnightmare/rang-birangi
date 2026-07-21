'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Pencil, Trash2, Eye, X, Package, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { formatINR, type ProductDTO } from '@/lib/helpers'
import { useUIStore } from '@/stores/ui-store'

export function AdminProducts() {
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState<ProductDTO | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()
  const setView = useUIStore((s) => s.setView)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryFilter !== 'all') params.set('category', categoryFilter)
    fetch(`/api/admin/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || [])
        setLoading(false)
      })
  }

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then((d) => setCategories(d.categories || []))
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [search, categoryFilter])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Product deleted' })
      load()
    }
  }

  const handleTogglePublish = async (p: ProductDTO) => {
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !p.isPublished }),
    })
    load()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Products ({products.length})</h2>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-luxe-gradient"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="pl-10 bg-secondary/50"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px] bg-secondary/50">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-8 rounded-xl glass border border-gold/20 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No products found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl glass border border-gold/10 hover:border-gold/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-16 h-20 object-cover rounded-lg cursor-pointer"
                  onClick={() => setView({ name: 'product', slug: p.slug })}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium line-clamp-1">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.sku} · {p.category?.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-accent">{formatINR(p.price)}</p>
                      {p.compareAtPrice && (
                        <p className="text-xs text-muted-foreground line-through">{formatINR(p.compareAtPrice)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className={p.stock > 10 ? 'text-green-400' : p.stock > 0 ? 'text-yellow-400' : 'text-red-400'}>
                      Stock: {p.stock}
                    </Badge>
                    {p.isFeatured && <Badge className="bg-accent/20 text-accent" variant="outline">Featured</Badge>}
                    {p.isTrending && <Badge className="bg-primary/20 text-primary" variant="outline">Trending</Badge>}
                    {p.isNewArrival && <Badge className="bg-blue-500/20 text-blue-300" variant="outline">New</Badge>}
                    {p.isFlashSale && <Badge className="bg-red-500/20 text-red-300" variant="outline">Flash Sale</Badge>}
                    {p.isBestSeller && <Badge className="bg-green-500/20 text-green-300" variant="outline">Best Seller</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => setView({ name: 'product', slug: p.slug })}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => { setEditing(p); setShowForm(true) }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400"
                    onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={p.isPublished}
                    onCheckedChange={() => handleTogglePublish(p)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {p.isPublished ? 'Published' : 'Hidden'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <AnimatePresence>
        {showForm && (
          <ProductForm
            product={editing}
            categories={categories}
            onClose={() => { setShowForm(false); setEditing(null) }}
            onSaved={() => { load(); setShowForm(false); setEditing(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function ProductForm({
  product, categories, onClose, onSaved,
}: {
  product: ProductDTO | null
  categories: any[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<any>(
    product || {
      name: '', sku: '', description: '', material: '', weight: '',
      careInstructions: '', categoryId: categories[0]?.id || '',
      price: '', compareAtPrice: '', discountPercent: '0', stock: '0',
      images: [''], videos: [], colors: [], sizes: [],
      tags: [], isFeatured: false, isTrending: false, isNewArrival: false,
      isFlashSale: false, isBestSeller: false, isHandmade: false,
      isPublished: true, seoTitle: '', seoDescription: '',
    }
  )
  const [imagesText, setImagesText] = useState((product?.images || ['']).join('\n'))
  const [colorsText, setColorsText] = useState((product?.colors || []).join(','))
  const [sizesText, setSizesText] = useState((product?.sizes || []).join(','))
  const [tagsText, setTagsText] = useState((product?.tags || []).join(','))
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setSaving(true)
    try {
      const images = imagesText.split('\n').map((s) => s.trim()).filter(Boolean)
      const colors = colorsText.split(',').map((s) => s.trim()).filter(Boolean)
      const sizes = sizesText.split(',').map((s) => s.trim()).filter(Boolean)
      const tags = tagsText.split(',').map((s) => s.trim()).filter(Boolean)

      const payload = {
        ...form,
        price: String(form.price),
        compareAtPrice: form.compareAtPrice ? String(form.compareAtPrice) : '',
        discountPercent: String(form.discountPercent || '0'),
        stock: String(form.stock || '0'),
        images, colors, sizes, tags,
      }

      const url = product
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products'
      const method = product ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: product ? 'Product updated' : 'Product created' })
        onSaved()
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="glass-strong border border-gold/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-gold">
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary/50" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">SKU *</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="bg-secondary/50" disabled={!!product} />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Description *</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border focus:border-accent outline-none text-sm min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Category *</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                <SelectTrigger className="bg-secondary/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Material</Label>
              <Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="bg-secondary/50" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Price *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-secondary/50" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Compare At</Label>
              <Input type="number" value={form.compareAtPrice} onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })} className="bg-secondary/50" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Discount %</Label>
              <Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className="bg-secondary/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="bg-secondary/50" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Weight</Label>
              <Input value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="bg-secondary/50" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Image URLs (one per line)</Label>
            <textarea
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border focus:border-accent outline-none text-sm min-h-[60px]"
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Colors (comma-separated)</Label>
              <Input value={colorsText} onChange={(e) => setColorsText(e.target.value)} className="bg-secondary/50" placeholder="Red,Blue,Green" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Sizes (comma-separated)</Label>
              <Input value={sizesText} onChange={(e) => setSizesText(e.target.value)} className="bg-secondary/50" placeholder="S,M,L,XL" />
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Tags (comma-separated)</Label>
            <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} className="bg-secondary/50" placeholder="wedding,festive" />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Care Instructions</Label>
            <Input value={form.careInstructions} onChange={(e) => setForm({ ...form, careInstructions: e.target.value })} className="bg-secondary/50" />
          </div>

          {/* Flags */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Product Flags</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'isFeatured', label: 'Featured' },
                { key: 'isTrending', label: 'Trending' },
                { key: 'isNewArrival', label: 'New Arrival' },
                { key: 'isFlashSale', label: 'Flash Sale' },
                { key: 'isBestSeller', label: 'Best Seller' },
                { key: 'isHandmade', label: 'Handmade' },
                { key: 'isPublished', label: 'Published' },
              ].map((f) => (
                <div key={f.key} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                  <Switch
                    checked={!!form[f.key]}
                    onCheckedChange={(v) => setForm({ ...form, [f.key]: v })}
                  />
                  <span className="text-xs">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-luxe-gradient">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {product ? 'Update' : 'Create'} Product
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
