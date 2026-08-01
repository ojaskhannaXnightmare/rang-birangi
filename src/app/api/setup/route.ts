/**
 * RANG BIRANGI - Setup Endpoint
 *
 * GET /api/setup — Check if admin user exists (returns status, no side effects)
 * POST /api/setup — Create or update admin user
 *
 * Admin credentials:
 *   Email: admin@rangbirangi.com
 *   Password: RB_1122
 *
 * NOTE: The auth route (/api/auth) will also auto-create the admin user
 * on first login attempt, so calling this endpoint is OPTIONAL.
 * This endpoint exists for explicit setup/verification.
 */
import { NextRequest, NextResponse } from 'next/server'
import { COLLECTIONS, findOne, create, update } from '@/lib/supabase-db'
import crypto from 'crypto'

function hashPassword(s: string): string {
  return crypto.createHash('sha256').update(s + 'rangbirangi_salt').digest('hex')
}

const ADMIN_EMAIL = 'admin@rangbirangi.com'
const ADMIN_PASSWORD = 'RB_1122'

export async function GET() {
  try {
    const existing = await findOne<any>(COLLECTIONS.USERS, [
      { field: 'email', op: '==', value: ADMIN_EMAIL },
    ])

    if (existing) {
      return NextResponse.json({
        adminExists: true,
        email: ADMIN_EMAIL,
        role: existing.role,
        message: 'Admin user already exists. Login with admin@rangbirangi.com / RB_1122',
      })
    }

    return NextResponse.json({
      adminExists: false,
      email: ADMIN_EMAIL,
      message: 'Admin user not found. POST to /api/setup to create, or just login and it will auto-create.',
    })
  } catch (e: any) {
    return NextResponse.json({
      adminExists: false,
      error: e.message,
      hint: 'Make sure FIREBASE_SERVICE_ACCOUNT env var is set.',
    }, { status: 500 })
  }
}

export async function POST(_req: NextRequest) {
  try {
    const existing = await findOne<any>(COLLECTIONS.USERS, [
      { field: 'email', op: '==', value: ADMIN_EMAIL },
    ])

    if (existing) {
      // Update password to ensure it's RB_1122
      await update(COLLECTIONS.USERS, existing.id, {
        passwordHash: hashPassword(ADMIN_PASSWORD),
        role: 'ADMIN',
        status: 'ACTIVE',
        name: 'RANG BIRANGI Admin',
        phone: '9559974558',
      })
      return NextResponse.json({
        success: true,
        message: 'Admin user updated with new password',
        credentials: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      })
    }

    // Create admin user
    const admin = await create<any>(COLLECTIONS.USERS, {
      email: ADMIN_EMAIL,
      name: 'RANG BIRANGI Admin',
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: 'ADMIN',
      phone: '9559974558',
      status: 'ACTIVE',
      avatarUrl: null,
    })
    await create(COLLECTIONS.CART, { userId: admin.id, items: [] })
    await create(COLLECTIONS.WISHLIST, { userId: admin.id, items: [] })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      credentials: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      adminId: admin.id,
    })
  } catch (e: any) {
    console.error('setup error', e)
    return NextResponse.json({
      error: e.message,
      hint: 'Make sure FIREBASE_SERVICE_ACCOUNT env var is set on Vercel.',
    }, { status: 500 })
  }
}
