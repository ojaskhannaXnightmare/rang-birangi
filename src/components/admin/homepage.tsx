'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GripVertical, Eye, EyeOff, Save, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export function AdminHomepage() {
  const [sections, setSections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const { toast } = useToast()

  const load = async () => {
    try {
      const r = await fetch('/api/admin/homepage')
      const d = await r.json()
      setSections(d.sections || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleToggle = async (id: string, isEnabled: boolean) => {
    setSaving(id)
    const res = await fetch('/api/admin/homepage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isEnabled }),
    })
    if (res.ok) {
      setSections((prev) => prev.map((s) => s.id === id ? { ...s, isEnabled } : s))
      toast({ title: `Section ${isEnabled ? 'enabled' : 'disabled'}` })
    }
    setSaving(null)
  }

  const handleUpdateTitle = async (id: string, title: string, subtitle?: string) => {
    setSaving(id)
    const res = await fetch('/api/admin/homepage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, title, subtitle }),
    })
    if (res.ok) {
      setSections((prev) => prev.map((s) => s.id === id ? { ...s, title, subtitle } : s))
      toast({ title: 'Section updated' })
    }
    setSaving(null)
  }

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((s) => s.id === id)
    if (idx < 0) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= sections.length) return
    const reordered = [...sections]
    ;[reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]]
    // Update sortOrder
    reordered.forEach((s, i) => {
      s.sortOrder = i + 1
      fetch('/api/admin/homepage', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, sortOrder: i + 1 }),
      })
    })
    setSections(reordered)
    toast({ title: 'Section reordered' })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Homepage Builder</h2>
          <p className="text-sm text-muted-foreground">Toggle and reorder homepage sections</p>
        </div>
        <Button onClick={load} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-secondary/30 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((s, i) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl glass border transition-colors ${
                s.isEnabled ? 'border-gold/30' : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <button
                    onClick={() => moveSection(s.id, 'up')}
                    disabled={i === 0}
                    className="text-muted-foreground hover:text-accent disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <button
                    onClick={() => moveSection(s.id, 'down')}
                    disabled={i === sections.length - 1}
                    className="text-muted-foreground hover:text-accent disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{s.sortOrder}</span>
                    <Input
                      defaultValue={s.title}
                      onBlur={(e) => e.target.value !== s.title && handleUpdateTitle(s.id, e.target.value, s.subtitle)}
                      className="bg-secondary/50 font-medium h-8"
                    />
                    {saving === s.id && <Loader2 className="h-3 w-3 animate-spin text-accent" />}
                  </div>
                  {s.subtitle && (
                    <Input
                      defaultValue={s.subtitle}
                      onBlur={(e) => e.target.value !== s.subtitle && handleUpdateTitle(s.id, s.title, e.target.value)}
                      className="bg-secondary/30 text-xs mt-1 h-7"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {s.isEnabled ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                    {s.isEnabled ? 'Visible' : 'Hidden'}
                  </Badge>
                  <Switch
                    checked={s.isEnabled}
                    onCheckedChange={(v) => handleToggle(s.id, v)}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="p-4 rounded-xl bg-secondary/20 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 How it works</p>
        Changes you make here are instantly applied to the customer-facing homepage.
        Use the arrows to reorder sections, toggle switches to show/hide them, and click titles to edit.
      </div>
    </div>
  )
}
