'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, X, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { useToast } from '@/hooks/use-toast'

/**
 * Floating Admin Login Button (bottom-right corner)
 *
 * Shows a shield icon. Click opens a simple admin login form.
 * On successful admin login, navigates to the admin panel.
 * Auto-hides when user is already logged in.
 *
 * NOTE: This is a direct admin-only login. Customer login happens
 * via the regular account icon in the navbar.
 */
export function FloatingAdminButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const fetchUser = useAuthStore((s) => s.fetchUser)
  const setView = useUIStore((s) => s.setView)
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
          action: 'login',
          email,
          password,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setUser(data)
        await fetchUser()
        if (data.role === 'ADMIN') {
          toast({
            title: 'Welcome Admin!',
            description: 'Redirecting to admin panel...',
          })
          setOpen(false)
          setEmail('')
          setPassword('')
          setView({ name: 'admin', tab: 'dashboard' })
        } else {
          toast({
            title: 'Not an admin account',
            description: 'These credentials belong to a customer account. Use the account icon in navbar for customer login.',
            variant: 'destructive',
          })
        }
      } else {
        toast({ title: 'Login failed', description: data.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
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
        aria-label="Admin login"
        title="Admin Login"
      >
        <Shield className="h-6 w-6 text-accent group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse" />
      </motion.button>

      {/* Admin Login Panel */}
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
                    <Shield className="h-4 w-4 text-accent" />
                    <span className="text-sm font-display font-bold text-gradient-gold">
                      Admin Login
                    </span>
                  </div>
                  <p className="text-xs text-foreground/70">
                    Restricted access — authorized personnel only
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Admin Email</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="pl-9 bg-secondary/50 h-9 text-sm"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 bg-secondary/50 h-9 text-sm"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gold-gradient text-background hover:opacity-90 text-sm h-9"
                  >
                    {loading ? 'Verifying...' : 'Login to Admin Panel'}
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
