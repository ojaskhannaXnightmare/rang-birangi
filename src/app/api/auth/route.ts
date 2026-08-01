import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, create,
} from '@/lib/firestore-db'
import { hashPassword, verifyPassword, createSession } from '@/lib/auth'

const ADMIN_EMAIL = 'admin@rangbirangi.com'
const ADMIN_PASSWORD = 'RB_1122'
const ADMIN_NAME = 'RANG BIRANGI Admin'
const ADMIN_PHONE = '9559974558'

/**
 * Auto-create the admin user if it doesn't exist yet.
 * This makes the first login "just work" without needing to call /api/setup.
 */
async function ensureAdminUser() {
  try {
    const existing = await findOne<any>(COLLECTIONS.USERS, [
      { field: 'email', op: '==', value: ADMIN_EMAIL },
    ])
    if (existing) return existing

    // Create admin user with default credentials
    const admin = await create<any>(COLLECTIONS.USERS, {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: 'ADMIN',
      phone: ADMIN_PHONE,
      status: 'ACTIVE',
      avatarUrl: null,
    })
    // Create cart + wishlist for admin too
    await create(COLLECTIONS.CART, { userId: admin.id, items: [] })
    await create(COLLECTIONS.WISHLIST, { userId: admin.id, items: [] })
    console.log('Admin user auto-created on first login attempt')
    return admin
  } catch (e) {
    console.error('Failed to auto-create admin:', e)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name, phone } = await req.json()

    if (action === 'register') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
      }
      const existing = await findOne<any>(COLLECTIONS.USERS, [
        { field: 'email', op: '==', value: email },
      ])
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
      const user = await create<any>(COLLECTIONS.USERS, {
        email,
        passwordHash: hashPassword(password),
        name: name || null,
        phone: phone || null,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        avatarUrl: null,
      })
      await create(COLLECTIONS.CART, { userId: user.id, items: [] })
      await create(COLLECTIONS.WISHLIST, { userId: user.id, items: [] })
      await createSession(user.id)
      return NextResponse.json({
        id: user.id, email: user.email, name: user.name,
        role: user.role, phone: user.phone,
      })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
      }

      let user = await findOne<any>(COLLECTIONS.USERS, [
        { field: 'email', op: '==', value: email },
      ])

      // AUTO-CREATE ADMIN: If someone tries to login as admin@rangbirangi.com
      // and the user doesn't exist, auto-create it with the default password.
      // This makes the first admin login "just work".
      if (!user && email === ADMIN_EMAIL) {
        user = await ensureAdminUser()
      }

      if (!user) {
        return NextResponse.json({
          error: 'No account found with this email. Please register first.',
        }, { status: 401 })
      }

      if (!verifyPassword(password, user.passwordHash)) {
        // Special case: if this is the admin email and the password is RB_1122,
        // but the stored hash doesn't match, force-update the password.
        // This handles cases where the admin was created with an old password.
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          const { update } = await import('@/lib/firestore-db')
          await update(COLLECTIONS.USERS, user.id, {
            passwordHash: hashPassword(ADMIN_PASSWORD),
            role: 'ADMIN',
            status: 'ACTIVE',
          })
          // Re-fetch the updated user
          user = await findOne<any>(COLLECTIONS.USERS, [
            { field: 'email', op: '==', value: email },
          ])
          if (!user) {
            return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 })
          }
        } else {
          return NextResponse.json({
            error: 'Incorrect password. Please try again.',
          }, { status: 401 })
        }
      }

      if (user.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
      }
      await createSession(user.id)
      return NextResponse.json({
        id: user.id, email: user.email, name: user.name,
        role: user.role, phone: user.phone,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e: any) {
    console.error('auth error', e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}
