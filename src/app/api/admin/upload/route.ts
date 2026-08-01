/**
 * RANG BIRANGI - Image Upload API (Supabase Storage)
 * POST /api/admin/upload
 *
 * Uploads product images to Supabase Storage bucket 'rangbirangi'.
 * Processes with sharp (resize max 1200x1200, convert to webp).
 *
 * Returns: { url, filename, size, mimeType, storage }
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { isSupabaseConfigured, getSupabase, STORAGE_BUCKET } from '@/lib/supabase-admin'
import sharp from 'sharp'
import crypto from 'crypto'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Process image with sharp
    const buffer = Buffer.from(await file.arrayBuffer())
    const processed = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`
    const storagePath = `rangbirangi/${filename}`

    // Upload to Supabase Storage
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        error: 'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      }, { status: 500 })
    }

    const supabase = getSupabase()

    const { error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, processed, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload failed:', uploadError.message)
      return NextResponse.json({
        error: `Upload failed: ${uploadError.message}. Make sure the 'rangbirangi' storage bucket exists (run supabase-schema.sql).`,
      }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(storagePath)

    return NextResponse.json({
      url: urlData.publicUrl,
      filename,
      originalName: file.name,
      size: processed.length,
      mimeType: 'image/webp',
      storage: 'supabase',
    })
  } catch (e: any) {
    console.error('upload error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    if (!filename) {
      return NextResponse.json({ error: 'filename required' }, { status: 400 })
    }
    const safe = filename.split('/').pop() || filename
    const storagePath = `rangbirangi/${safe}`

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .remove([storagePath])

    if (error) {
      console.error('Delete error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, storage: 'supabase' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
