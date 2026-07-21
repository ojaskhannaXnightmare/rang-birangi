'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { motion, AnimatePresence } from 'framer-motion'

interface ImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  label?: string
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  label = 'Product Images',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) return

    const remaining = maxImages - images.length
    if (remaining <= 0) {
      toast({
        title: 'Maximum reached',
        description: `You can upload up to ${maxImages} images.`,
        variant: 'destructive',
      })
      return
    }

    const toUpload = fileArray.slice(0, remaining)
    setUploading(true)

    try {
      const uploaded: string[] = []
      for (const file of toUpload) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok) {
          uploaded.push(data.url)
        } else {
          toast({
            title: `Upload failed: ${file.name}`,
            description: data.error,
            variant: 'destructive',
          })
        }
      }
      if (uploaded.length > 0) {
        onChange([...images, ...uploaded])
        toast({ title: `${uploaded.length} image(s) uploaded` })
      }
    } catch (e: any) {
      toast({ title: 'Upload error', description: e.message, variant: 'destructive' })
    } finally {
      setUploading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }, [images, maxImages, onChange, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const removeImage = async (idx: number) => {
    const url = images[idx]
    const filename = url.split('/').pop()
    if (filename && url.startsWith('/uploads/')) {
      // Delete from server
      fetch(`/api/admin/upload?filename=${filename}`, { method: 'DELETE' }).catch(() => {})
    }
    onChange(images.filter((_, i) => i !== idx))
  }

  const moveImage = (idx: number, dir: 'left' | 'right') => {
    if (idx === 0 && dir === 'left') return
    if (idx === images.length - 1 && dir === 'right') return
    const newImages = [...images]
    const swapIdx = dir === 'left' ? idx - 1 : idx + 1
    ;[newImages[idx], newImages[swapIdx]] = [newImages[swapIdx], newImages[idx]]
    onChange(newImages)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-muted-foreground">
          {label} ({images.length}/{maxImages})
        </label>
        {images.length > 0 && (
          <span className="text-xs text-muted-foreground">First image = cover</span>
        )}
      </div>

      {/* Uploaded images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-3">
          <AnimatePresence>
            {images.map((img, i) => (
              <motion.div
                key={img + i}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-secondary/30"
              >
                <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-accent text-background">
                    COVER
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    onClick={() => moveImage(i, 'left')}
                    disabled={i === 0}
                    className="w-7 h-7 rounded-full glass-strong flex items-center justify-center disabled:opacity-30"
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => removeImage(i)}
                    className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center text-white"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => moveImage(i, 'right')}
                    disabled={i === images.length - 1}
                    className="w-7 h-7 rounded-full glass-strong flex items-center justify-center disabled:opacity-30"
                    title="Move right"
                  >
                    →
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Drop zone / Upload button */}
      {images.length < maxImages && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInput.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            dragOver
              ? 'border-accent bg-accent/10'
              : 'border-border hover:border-accent/50 hover:bg-secondary/30'
          }`}
        >
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
              <p className="text-sm text-muted-foreground">Uploading & processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-luxe-gradient flex items-center justify-center">
                <Upload className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-medium">
                {images.length === 0 ? 'Upload product images' : 'Add more images'}
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click · PNG, JPG, WEBP · Max 10MB each
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual URL input (fallback) */}
      <details className="mt-3">
        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
          Or paste image URL manually
        </summary>
        <div className="flex gap-2 mt-2">
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border focus:border-accent outline-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const val = (e.target as HTMLInputElement).value
                if (val && images.length < maxImages) {
                  onChange([...images, val])
                  ;(e.target as HTMLInputElement).value = ''
                }
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              const input = (e.target as HTMLElement).parentElement?.querySelector('input')
              if (input && input.value) {
                onChange([...images, input.value])
                input.value = ''
              }
            }}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </details>
    </div>
  )
}
