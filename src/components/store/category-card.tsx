'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { Button } from '@/components/ui/button'

interface CategoryCardProps {
  category: {
    id: string
    name: string
    slug: string
    description?: string | null
    imageUrl?: string | null
  }
  index?: number
}

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  const setView = useUIStore((s) => s.setView)

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.1, 0.4) }}
      onClick={() => setView({ name: 'shop', categorySlug: category.slug })}
      className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border hover-lift"
    >
      <img
        src={category.imageUrl || 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600'}
        alt={category.name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 text-left">
        <h3 className="font-display text-xl font-bold text-gradient-gold mb-1">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs text-foreground/70 line-clamp-2 mb-3">
            {category.description}
          </p>
        )}
        <div className="inline-flex items-center gap-1 text-sm text-accent group-hover:gap-2 transition-all">
          Shop Now <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </motion.button>
  )
}
