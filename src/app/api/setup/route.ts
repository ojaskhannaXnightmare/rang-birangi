/**
 * RANG BIRANGI - One-time Setup Endpoint
 * POST /api/setup
 *
 * Creates the admin user with credentials:
 *   Email: admin@rangbirangi.com
 *   Password: RB_1122
 *
 * This endpoint is idempotent — if admin already exists, it just updates the password.
 * Call this ONCE after deploying to seed the admin user.
 *
 * After setup, this endpoint can be safely deleted or left (it's harmless).
 */
import { NextRequest, NextResponse } from 'next/server'
import { COLLECTIONS, findOne, create, update } from '@/lib/firestore-db'
import crypto from 'crypto'

function hashPassword(s: string): string {
  return crypto.createHash('sha256').update(s + 'rangbirangi_salt').digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    // Optional: require a setup secret to prevent random people from calling this
    const body = await req.json().catch(() => ({}))
    const setupSecret = body.secret || process.env.SETUP_SECRET

    // If SETUP_SECRET is set in env, require it
    if (process.env.SETUP_SECRET && setupSecret !== process.env.SETUP_SECRET) {
      return NextResponse.json({ error: 'Invalid setup secret' }, { status: 403 })
    }

    const ADMIN_EMAIL = 'admin@rangbirangi.com'
    const ADMIN_PASSWORD = 'RB_1122'

    // Check if admin already exists
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
        message: 'Admin user updated',
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

    // Also create cart + wishlist (just in case admin wants to test)
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
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/setup',
    method: 'POST',
    description: 'Creates the admin user (admin@rangbirangi.com / RB_1122)',
    usage: 'curl -X POST https://your-app.vercel.app/api/setup',
  })
}
