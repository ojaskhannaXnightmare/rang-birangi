'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Loader2, Plus, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const [urlInput, setUrlInput] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (fileArray.length === 0) {
      toast({
        title: 'No images selected',
        description: 'Please select image files (PNG, JPG, WEBP, GIF).',
        variant: 'destructive',
      })
      return
    }

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

        // Handle non-JSON responses (e.g., 404 HTML page)
        const contentType = res.headers.get('content-type') || ''
        if (!contentType.includes('application/json')) {
          const text = await res.text()
          toast({
            title: `Upload failed: ${file.name}`,
            description: `Server returned ${res.status}. The upload API may not be deployed. ${text.slice(0, 100)}`,
            variant: 'destructive',
          })
          continue
        }

        const data = await res.json()
        if (res.ok && data.url) {
          uploaded.push(data.url)
        } else {
          toast({
            title: `Upload failed: ${file.name}`,
            description: data.error || 'Unknown error',
            variant: 'destructive',
          })
        }
      }
      if (uploaded.length > 0) {
        onChange([...images, ...uploaded])
        toast({ title: `${uploaded.length} image(s) uploaded successfully` })
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
    e.stopPropagation()
    setDragOver(false)
    if (e.dataTransfer.files) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const openFilePicker = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fileInput.current?.click()
  }, [])

  const removeImage = async (idx: number) => {
    const url = images[idx]
    const filename = url.split('/').pop()
    if (filename && url.includes('/uploads/')) {
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

  const addUrl = () => {
    const url = urlInput.trim()
    if (!url) {
      toast({ title: 'Please enter a URL', variant: 'destructive' })
      return
    }
    if (images.length >= maxImages) {
      toast({ title: 'Maximum reached', variant: 'destructive' })
      return
    }
    // Basic URL validation
    try {
      new URL(url)
    } catch {
      toast({ title: 'Invalid URL', description: 'Please enter a valid image URL', variant: 'destructive' })
      return
    }
    onChange([...images, url])
    setUrlInput('')
    toast({ title: 'Image URL added' })
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
                {/* Remove button - always visible on mobile, hover on desktop */}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(i) }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X className="h-3 w-3" />
                </button>
                {/* Reorder buttons - visible on mobile */}
                <div className="absolute bottom-1 inset-x-1 flex justify-between sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveImage(i, 'left') }}
                    disabled={i === 0}
                    className="w-6 h-6 rounded-full glass-strong flex items-center justify-center disabled:opacity-30 text-xs"
                    title="Move left"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveImage(i, 'right') }}
                    disabled={i === images.length - 1}
                    className="w-6 h-6 rounded-full glass-strong flex items-center justify-center disabled:opacity-30 text-xs"
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
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false) }}
          onDrop={handleDrop}
          onClick={openFilePicker}
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
            onChange={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (e.target.files) handleFiles(e.target.files)
            }}
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
                Tap to browse · PNG, JPG, WEBP · Max 10MB
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual URL input (fallback) */}
      <div className="mt-3">
        <details>
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            Or paste image URL manually
          </summary>
          <div className="flex gap-2 mt-2">
            <Input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-secondary/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addUrl()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUrl}
            >
              <Link2 className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
        </details>
      </div>
    </div>
  )
}
