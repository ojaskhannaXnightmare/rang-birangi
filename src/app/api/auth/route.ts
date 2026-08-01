import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findOne, create, findById,
} from '@/lib/firestore-db'
import { hashPassword, verifyPassword, createSession } from '@/lib/auth'

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
      const user = await findOne<any>(COLLECTIONS.USERS, [
        { field: 'email', op: '==', value: email },
      ])
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
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
