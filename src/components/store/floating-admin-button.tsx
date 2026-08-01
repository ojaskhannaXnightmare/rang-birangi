'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, Mail, Lock, User, Phone, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useToast } from '@/hooks/use-toast'

/**
 * Floating Admin Access Button (bottom-right corner)
 *
 * TEMPORARY dev/demo utility — provides one-click access to:
 *  - Admin login (auto-fills admin@rangbirangi.com / admin123)
 *  - Customer login (auto-fills customer@demo.com / demo123)
 *  - Register new account
 *
 * Remove this component before production launch.
 */
export function FloatingAdminButton() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', name: '', phone: '' })
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const setView = useUIStore((s) => s.setView)
  const closeAuth = useUIStore((s) => s.closeAuth)
  const { toast } = useToast()

  // Hide if user is already logged in
  if (user) return null

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
          description: mode === 'register' ? 'Account created' : 'Logged in',
        })
        setOpen(false)
        setForm({ email: '', password: '', name: '', phone: '' })
        if (data.role === 'ADMIN') {
          setView({ name: 'admin', tab: 'dashboard' })
        }
      } else {
        toast({ title: 'Auth failed', description: data.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const fillAdmin = () => {
    setForm({ email: 'admin@rangbirangi.com', password: 'admin123', name: '', phone: '' })
    setMode('login')
  }

  const fillCustomer = () => {
    setForm({ email: 'customer@demo.com', password: 'demo123', name: '', phone: '' })
    setMode('login')
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: 'spring' }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-luxe-gradient border-2 border-gold/40 flex items-center justify-center premium-shadow hover:scale-110 transition-transform group"
        aria-label="Quick access"
        title="Quick Access (Admin/Customer Login)"
      >
        <Shield className="h-6 w-6 text-accent group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed bottom-24 right-5 z-50 w-[340px] max-w-[calc(100vw-2.5rem)]"
            >
              <div className="glass-strong premium-shadow rounded-2xl border border-gold/30 overflow-hidden">
                {/* Header */}
                <div className="relative p-4 bg-luxe-gradient">
                  <button
                    onClick={() => setOpen(false)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full glass flex items-center justify-center hover:bg-accent/20"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-accent" />
                    <span className="text-sm font-display font-bold text-gradient-gold">
                      Quick Access
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70">
                    Demo login or register new account
                  </p>
                </div>

                {/* Quick demo buttons */}
                <div className="p-3 border-b border-border bg-secondary/20">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 text-center">
                    Quick Demo Login
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={fillAdmin}
                      size="sm"
                      variant="outline"
                      className="border-accent/40 text-accent hover:bg-accent/10 text-xs h-8"
                    >
                      <Shield className="h-3 w-3 mr-1" /> Admin
                    </Button>
                    <Button
                      onClick={fillCustomer}
                      size="sm"
                      variant="outline"
                      className="border-primary/40 text-primary hover:bg-primary/10 text-xs h-8"
                    >
                      <User className="h-3 w-3 mr-1" /> Customer
                    </Button>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                  <div className="flex bg-secondary/30 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        mode === 'login' ? 'bg-luxe-gradient text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        mode === 'register' ? 'bg-luxe-gradient text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          required
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="John Doe"
                          className="pl-9 bg-secondary/50 h-9 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        className="pl-9 bg-secondary/50 h-9 text-sm"
                      />
                    </div>
                  </div>

                  {mode === 'register' && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          placeholder="10-digit mobile"
                          className="pl-9 bg-secondary/50 h-9 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        className="pl-9 bg-secondary/50 h-9 text-sm"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold-gradient text-background hover:opacity-90 text-sm h-9"
                  >
                    {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
                  </Button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
