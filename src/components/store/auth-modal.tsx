'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Mail, Lock, User, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export function AuthModal() {
  const open = useUIStore((s) => s.authModalOpen)
  const mode = useUIStore((s) => s.authModalMode)
  const closeAuth = useUIStore((s) => s.closeAuth)
  const setUser = useAuthStore((s) => s.setUser)
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          email: form.email,
          password: form.password,
          name: form.name,
          phone: form.phone,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data)
        await fetchUser()
        toast({
          title: `Welcome${data.name ? `, ${data.name.split(' ')[0]}` : ''}!`,
          description: mode === 'register' ? 'Account created successfully' : 'Logged in successfully',
        })
        closeAuth()
        setForm({ email: '', password: '', name: '', phone: '' })
      } else {
        toast({ title: 'Authentication failed', description: data.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAuth}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md mx-4 z-50"
          >
            <div className="glass-strong premium-shadow rounded-2xl border border-gold/20 overflow-hidden">
              {/* Header */}
              <div className="relative p-6 bg-luxe-gradient">
                <button
                  onClick={closeAuth}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-accent/20"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/logo.png"
                    alt="RANG BIRANGI"
                    className="w-10 h-10 rounded-full object-cover border border-gold/30"
                  />
                  <span className="text-lg font-display font-bold tracking-wider text-gradient-gold">
                    RANG BIRANGI
                  </span>
                </div>
                <h2 className="text-2xl font-display font-bold text-gradient-gold">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-sm text-foreground/70 mt-1">
                  {mode === 'login'
                    ? 'Login to access your account, orders, and wishlist.'
                    : 'Join RANG BIRANGI for exclusive offers and a personalized experience.'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {mode === 'register' && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        className="pl-10 bg-secondary/50"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="pl-10 bg-secondary/50"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="10-digit mobile number"
                        className="pl-10 bg-secondary/50"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="pl-10 bg-secondary/50"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-gradient text-background hover:opacity-90 font-medium"
                  size="lg"
                >
                  {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => useUIStore.getState().openAuth(mode === 'login' ? 'register' : 'login')}
                    className="text-accent hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Sign up' : 'Login'}
                  </button>
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
