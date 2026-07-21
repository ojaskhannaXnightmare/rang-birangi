import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name, phone } = await req.json()

    if (action === 'register') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
      }
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
      const user = await db.user.create({
        data: {
          email,
          passwordHash: hashPassword(password),
          name: name || null,
          phone: phone || null,
          role: 'CUSTOMER',
        },
      })
      await db.cart.create({ data: { userId: user.id } })
      await db.wishlist.create({ data: { userId: user.id } })
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
      const user = await db.user.findUnique({ where: { email } })
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
