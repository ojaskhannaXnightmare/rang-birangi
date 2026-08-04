'use client'

import { ErrorBoundary } from 'react-error-boundary'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

function ErrorFallback({ error, resetErrorBoundary }: any) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-strong rounded-2xl border border-lavender/20 p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple/20 flex items-center justify-center"
        >
          <AlertTriangle className="h-8 w-8 text-lavender" />
        </motion.div>
        <h2 className="text-xl font-display font-bold mb-2 text-gradient-lavender">
          Something went wrong
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Don't worry — your data is safe. This is usually a temporary connection issue.
          Please try again.
        </p>
        <div className="flex gap-2">
          <Button
            onClick={resetErrorBoundary}
            className="flex-1 bg-luxe-gradient"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="flex-1"
          >
            Go Home
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * Only wraps the main content area in an error boundary.
 * Does NOT wrap the entire app — so auth modals, cart drawer, etc.
 * still work even if the main content crashes.
 *
 * Also, this only catches RENDERING errors (component crashes),
 * not API fetch failures (those are handled by individual components).
 */
export function AppErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // Just reset the boundary, don't reload the whole page
        // The user can navigate to a different view
      }}
      onError={(error) => {
        // Log to console but don't crash the whole app
        console.error('App error caught by boundary:', error.message)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
