/**
 * RANG BIRANGI - Image Upload API (Firebase Storage)
 * POST /api/admin/upload
 *
 * Uploads product images to Firebase Storage.
 * Processes with sharp (resize max 1200x1200, convert to webp).
 *
 * On Vercel/serverless: Firebase Storage is REQUIRED (no local filesystem).
 * In local dev: Falls back to /public/uploads/ if Firebase Storage fails.
 *
 * Returns: { url, filename, size, mimeType, storage }
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

// Detect if we're on Vercel/serverless (read-only filesystem)
const IS_VERCEL = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME

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

    // PRIMARY: Try Firebase Storage
    if (isFirebaseConfigured()) {
      try {
        const bucket = getStorageBucket()
        const fileRef = bucket.file(storagePath)

        await fileRef.save(processed, {
          metadata: {
            contentType: 'image/webp',
            cacheControl: 'public, max-age=31536000, immutable',
          },
        })

        // Make the file publicly readable
        await fileRef.makePublic()

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
        console.error('Firebase Storage upload failed:', e.message)

        // If we're on Vercel, we CANNOT fall back to local filesystem
        if (IS_VERCEL) {
          return NextResponse.json({
            error: `Firebase Storage upload failed: ${e.message}. Make sure Firebase Storage is enabled and the service account has permission.`,
          }, { status: 500 })
        }
        // In local dev, fall through to local fallback
        console.log('Falling back to local filesystem (dev only)')
      }
    } else if (IS_VERCEL) {
      // No Firebase configured + on Vercel = cannot upload
      return NextResponse.json({
        error: 'Image upload requires Firebase Storage. Set FIREBASE_SERVICE_ACCOUNT env var on Vercel.',
      }, { status: 500 })
    }

    // FALLBACK: local filesystem (dev only — won't work on Vercel)
    try {
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
    } catch (localErr: any) {
      console.error('Local upload also failed:', localErr.message)
      return NextResponse.json({
        error: `Upload failed: ${localErr.message}`,
      }, { status: 500 })
    }
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
      } catch (e: any) {
        if (IS_VERCEL) {
          return NextResponse.json({ error: e.message }, { status: 500 })
        }
      }
    }

    // Fallback local (dev only)
    if (!IS_VERCEL) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      const filepath = path.join(uploadDir, safe)
      if (existsSync(filepath)) {
        const { unlink } = await import('fs/promises')
        await unlink(filepath)
      }
    }
    return NextResponse.json({ success: true, storage: 'local' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
