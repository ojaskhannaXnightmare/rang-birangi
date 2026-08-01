/**
 * RANG BIRANGI - Image Upload API (Firebase Storage)
 * POST /api/admin/upload
 *
 * - Accepts multipart/form-data with "file" field (image/png, image/jpeg, image/webp, image/gif)
 * - Processes with sharp (resize max 1200x1200, convert to webp)
 * - Uploads to Firebase Storage bucket at path: rangbirangi/{timestamp}-{random}.webp
 * - Returns { url, filename, size, mimeType }
 *
 * Works on Vercel — no local filesystem dependency.
 *
 * FALLBACK: If Firebase Storage fails (e.g., bucket not configured),
 * saves to /public/uploads/ locally. This fallback only works in dev
 * (won't persist on Vercel serverless). Always configure Firebase Storage
 * for production.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { isFirebaseConfigured, getStorageBucket } from '@/lib/firebase-admin'
import sharp from 'sharp'
import crypto from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

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

    // Try Firebase Storage first
    if (isFirebaseConfigured()) {
      try {
        const bucket = getStorageBucket()
        const fileRef = bucket.file(storagePath)
        await fileRef.save(processed, {
          metadata: {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=31536000, immutable',
          },
          public: true,
        })
        // Public URL
        const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`
        return NextResponse.json({
          url,
          filename,
          originalName: file.name,
          size: processed.length,
          mimeType: 'image/webp',
          storage: 'firebase',
        })
      } catch (e: any) {
        console.error('Firebase Storage upload failed, falling back to local:', e.message)
        // Fall through to local
      }
    }

    // Fallback: local filesystem (works in dev only)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, processed)
    const url = `/uploads/${filename}`

    return NextResponse.json({
      url,
      filename,
      originalName: file.name,
      size: processed.length,
      mimeType: 'image/webp',
      storage: 'local',
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
    const safe = path.basename(filename)

    // Try Firebase Storage
    if (isFirebaseConfigured()) {
      try {
        const bucket = getStorageBucket()
        const storagePath = `rangbirangi/${safe}`
        await bucket.file(storagePath).delete({ ignoreNotFound: true })
        return NextResponse.json({ success: true, storage: 'firebase' })
      } catch {
        // Fall through
      }
    }

    // Fallback local
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const filepath = path.join(uploadDir, safe)
    if (existsSync(filepath)) {
      const { unlink } = await import('fs/promises')
      await unlink(filepath)
    }
    return NextResponse.json({ success: true, storage: 'local' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
