/**
 * RANG BIRANGI - Image Upload API
 * POST /api/admin/upload
 *
 * Accepts multipart/form-data with a "file" field (image/png, image/jpeg, image/webp).
 * Processes with sharp (resize to max 1200x1200, convert to webp for size optimization).
 * Saves to /public/uploads/{timestamp}-{random}.webp
 * Returns { url, filename, size }
 *
 * In production, swap this with Cloudinary:
 *   cloudinary.uploader.upload(file, { folder: 'rangbirangi/products' })
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import sharp from 'sharp'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
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

    // Ensure upload dir exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Process image with sharp
    const buffer = Buffer.from(await file.arrayBuffer())
    const processed = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer()

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.webp`
    const filepath = path.join(UPLOAD_DIR, filename)
    await writeFile(filepath, processed)

    const url = `/uploads/${filename}`

    return NextResponse.json({
      url,
      filename,
      originalName: file.name,
      size: processed.length,
      mimeType: 'image/webp',
    })
  } catch (e: any) {
    console.error('upload error', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/upload?filename=xxx.webp
 * Removes an uploaded file (used when admin removes an image from product).
 */
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    if (!filename) {
      return NextResponse.json({ error: 'filename required' }, { status: 400 })
    }

    // Prevent path traversal
    const safe = path.basename(filename)
    const filepath = path.join(UPLOAD_DIR, safe)
    if (!existsSync(filepath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const { unlink } = await import('fs/promises')
    await unlink(filepath)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
