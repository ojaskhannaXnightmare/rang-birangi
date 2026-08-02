'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Pencil, Trash2, Package, Loader2, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

export function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    try {
      setLoading(true)
      const r = await fetch('/api/admin/categories')
      const d = await r.json()
      setCategories(d.categories || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Products in this category will remain but lose their category.`)) return
    const res = await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast({ title: 'Category deleted' })
      load()
    } else {
      const data = await res.json()
      toast({ title: 'Cannot delete', description: data.error, variant: 'destructive' })
    }
  }

  const handleToggleActive = async (cat: any) => {
    await fetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cat.id, isActive: !cat.isActive }),
    })
    load()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold">Categories ({categories.length})</h2>
          <p className="text-sm text-muted-foreground">Manage product categories</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="bg-luxe-gradient"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="p-8 rounded-xl glass border border-gold/20 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No categories yet.</p>
          <Button
            onClick={() => { setEditing(null); setShowForm(true) }}
            className="bg-luxe-gradient"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Your First Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl glass border border-gold/10 hover:border-gold/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <img
                  src={cat.imageUrl || 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400'}
                  alt={cat.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{cat.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">/{cat.slug}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!cat.isActive}
                    onCheckedChange={() => handleToggleActive(cat)}
                  />
                  <span className="text-xs text-muted-foreground">
                    {cat.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    onClick={() => { setEditing(cat); setShowForm(true) }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400"
                    onClick={() => handleDelete(cat.id, cat.name)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <AnimatePresence>
        {showForm && (
          <CategoryForm
            category={editing}
            onClose={() => { setShowForm(false); setEditing(null) }}
            onSaved={() => { load(); setShowForm(false); setEditing(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function CategoryForm({
  category, onClose, onSaved,
}: {
  category: any | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<any>(
    category || {
      name: '', description: '', imageUrl: '', sortOrder: 99, isActive: true,
    }
  )
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!form.name) {
      toast({ title: 'Name required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const url = category ? '/api/admin/categories' : '/api/admin/categories'
      const method = category ? 'PATCH' : 'POST'
      const body = category ? { id: category.id, ...form } : form
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        toast({ title: category ? 'Category updated' : 'Category created' })
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
      <DialogContent className="glass-strong border border-gold/20 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-gradient-gold">
            {category ? 'Edit Category' : 'Add New Category'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="bg-secondary/50"
              placeholder="e.g. Handmade Bangles"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border focus:border-accent outline-none text-sm min-h-[60px]"
              placeholder="Brief description of this category"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Image URL</Label>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="bg-secondary/50"
              placeholder="https://..."
            />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Sort Order</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 99 })}
                className="bg-secondary/50"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch
                checked={!!form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <span className="text-xs">{form.isActive ? 'Active' : 'Hidden'}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-border">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-luxe-gradient">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {category ? 'Update' : 'Create'} Category
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
