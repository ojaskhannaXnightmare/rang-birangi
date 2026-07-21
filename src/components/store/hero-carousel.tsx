'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui-store'
import type { ProductDTO } from '@/lib/helpers'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string
  buttonText: string | null
  linkUrl: string | null
}

export function HeroCarousel({ banners }: { banners: Banner[] }) {
  const setView = useUIStore((s) => s.setView)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [banners.length])

  const handleBannerClick = (linkUrl: string | null) => {
    if (!linkUrl) return
    if (linkUrl.startsWith('category:')) {
      setView({ name: 'shop', categorySlug: linkUrl.split(':')[1] })
    } else if (linkUrl.startsWith('section:')) {
      const section = linkUrl.split(':')[1]
      if (section === 'flash_sale') setView({ name: 'shop', filter: 'flash_sale' })
      else if (section === 'new_arrivals') setView({ name: 'shop', filter: 'new_arrivals' })
      else setView({ name: 'home' })
    }
  }

  if (banners.length === 0) {
    return (
      <div className="relative h-[60vh] min-h-[400px] rounded-2xl overflow-hidden bg-luxe-gradient">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <Sparkles className="h-12 w-12 text-accent mb-4" />
          <h1 className="text-4xl md:text-6xl font-display font-bold text-gradient-gold mb-4">
            RANG BIRANGI
          </h1>
          <p className="text-lg text-foreground/80 max-w-md">
            Handcrafted Indian Elegance — Bangles, Earrings, Sarees & Kurtis
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[70vh] min-h-[450px] max-h-[700px] rounded-2xl overflow-hidden premium-shadow group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={banners[current].imageUrl}
            alt={banners[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="max-w-xl">
            <motion.div
              key={`text-${current}`}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-gold/30">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="text-xs uppercase tracking-wider text-accent">RANG BIRANGI Exclusive</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold leading-tight">
                <span className="text-gradient-gold">{banners[current].title}</span>
              </h1>
              {banners[current].subtitle && (
                <p className="text-lg text-foreground/80 max-w-md">
                  {banners[current].subtitle}
                </p>
              )}
              {banners[current].buttonText && (
                <Button
                  onClick={() => handleBannerClick(banners[current].linkUrl)}
                  size="lg"
                  className="bg-gold-gradient text-background hover:opacity-90 font-medium group"
                >
                  {banners[current].buttonText}
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong flex items-center justify-center hover:bg-accent/20 transition-colors"
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrent((c) => (c + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full glass-strong flex items-center justify-center hover:bg-accent/20 transition-colors"
            aria-label="Next banner"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'w-8 bg-accent' : 'w-2 bg-foreground/40'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
