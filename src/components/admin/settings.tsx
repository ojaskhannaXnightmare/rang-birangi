'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'

const SETTING_GROUPS = [
  {
    title: 'Brand Information',
    settings: [
      { key: 'brand_name', label: 'Brand Name' },
      { key: 'brand_tagline', label: 'Brand Tagline' },
      { key: 'support_phone', label: 'Support Phone' },
      { key: 'support_email', label: 'Support Email' },
    ],
  },
  {
    title: 'Payment Configuration',
    settings: [
      { key: 'upi_id', label: 'UPI ID' },
      { key: 'cod_available', label: 'COD Available (true/false)' },
    ],
  },
  {
    title: 'Shipping Configuration',
    settings: [
      { key: 'free_shipping_threshold', label: 'Free Shipping Threshold (₹)' },
      { key: 'shipping_cost', label: 'Standard Shipping Cost (₹)' },
    ],
  },
  {
    title: 'Social Media',
    settings: [
      { key: 'instagram_url', label: 'Instagram URL' },
      { key: 'facebook_url', label: 'Facebook URL' },
      { key: 'whatsapp_url', label: 'WhatsApp URL' },
    ],
  },
]

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || {})
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
    if (res.ok) {
      toast({ title: 'Settings saved successfully' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your store</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-luxe-gradient">
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All
        </Button>
      </div>

      {SETTING_GROUPS.map((group) => (
        <div key={group.title} className="p-5 rounded-xl glass border border-gold/20">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-accent" /> {group.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.settings.map((s) => (
              <div key={s.key}>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{s.label}</Label>
                <Input
                  value={settings[s.key] || ''}
                  onChange={(e) => setSettings({ ...settings, [s.key]: e.target.value })}
                  className="bg-secondary/50"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="p-4 rounded-xl bg-secondary/20 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">⚠️ Production Notice</p>
        This app is configured for Firebase Firestore + Storage. To enable:
        <ol className="list-decimal ml-5 mt-2 space-y-1">
          <li>Go to Firebase Console → Project Settings → Service Accounts</li>
          <li>Click "Generate new private key" and download the JSON</li>
          <li>Set <code className="text-accent">FIREBASE_SERVICE_ACCOUNT</code> env var (full JSON) on Vercel</li>
          <li>Or set <code className="text-accent">FIREBASE_PROJECT_ID</code>, <code className="text-accent">FIREBASE_CLIENT_EMAIL</code>, <code className="text-accent">FIREBASE_PRIVATE_KEY</code> separately</li>
          <li>Enable Firestore Database and Storage in Firebase Console</li>
        </ol>
      </div>
    </div>
  )
}
