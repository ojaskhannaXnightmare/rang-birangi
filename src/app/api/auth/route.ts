import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, create,
} from '@/lib/supabase-db'
import { hashPassword, verifyPassword, createSession } from '@/lib/auth'

const ADMIN_EMAIL = 'admin@rangbirangi.com'
const ADMIN_PASSWORD = 'RB_1122'
const ADMIN_NAME = 'RANG BIRANGI Admin'
const ADMIN_PHONE = '9559974558'

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name, phone } = await req.json()

    if (action === 'register') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
      }

      let existing: any = null
      try {
        existing = await findOne<any>(COLLECTIONS.USERS, [
          { field: 'email', op: '==', value: email },
        ])
      } catch (e: any) {
        const errMsg = (e?.message || '').toLowerCase()
        if (errMsg.includes('could not find the table') || errMsg.includes('schema cache') || errMsg.includes('pgrst205')) {
          return NextResponse.json({
            error: 'Database not set up yet. Click the red banner at the top and run the SQL in Supabase SQL Editor.',
          }, { status: 500 })
        }
        return NextResponse.json({ error: e.message }, { status: 500 })
      }
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
      // Create cart + wishlist (non-blocking — if they fail, user is still created)
      try { await create(COLLECTIONS.CART, { userId: user.id, items: [] }) } catch {}
      try { await create(COLLECTIONS.WISHLIST, { userId: user.id, items: [] }) } catch {}
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

      let user: any = null
      try {
        user = await findOne<any>(COLLECTIONS.USERS, [
          { field: 'email', op: '==', value: email },
        ])
      } catch (e: any) {
        const errMsg = (e?.message || '').toLowerCase()
        if (errMsg.includes('could not find the table') || errMsg.includes('schema cache') || errMsg.includes('pgrst205')) {
          return NextResponse.json({
            error: 'Database not set up yet. Click the red banner at the top and run the SQL in Supabase SQL Editor.',
          }, { status: 500 })
        }
        return NextResponse.json({ error: e.message }, { status: 500 })
      }

      // AUTO-CREATE ADMIN: If someone tries to login as admin@rangbirangi.com
      // and the user doesn't exist, auto-create it.
      if (!user && email === ADMIN_EMAIL) {
        try {
          user = await create<any>(COLLECTIONS.USERS, {
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            passwordHash: hashPassword(ADMIN_PASSWORD),
            role: 'ADMIN',
            phone: ADMIN_PHONE,
            status: 'ACTIVE',
            avatarUrl: null,
          })
          await create(COLLECTIONS.CART, { userId: user.id, items: [] })
          await create(COLLECTIONS.WISHLIST, { userId: user.id, items: [] })
          console.log('Admin user auto-created on first login attempt')
        } catch (e: any) {
          return NextResponse.json({ error: `Failed to create admin: ${e.message}` }, { status: 500 })
        }
      }

      if (!user) {
        return NextResponse.json({
          error: 'No account found with this email. Please register first.',
        }, { status: 401 })
      }

      if (!verifyPassword(password, user.passwordHash)) {
        // Special case: if admin email + RB_1122 password but hash doesn't match, force-update
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          const { update } = await import('@/lib/supabase-db')
          await update(COLLECTIONS.USERS, user.id, {
            passwordHash: hashPassword(ADMIN_PASSWORD),
            role: 'ADMIN',
            status: 'ACTIVE',
          })
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
