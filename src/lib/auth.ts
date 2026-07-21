/**
 * RANG BIRANGI - Auth Utilities
 * JWT-less simple cookie-based session for demo.
 * In production, replace with NextAuth + JWT.
 */
import { cookies } from 'next/headers'
import { db } from './db'
import crypto from 'crypto'

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'rangbirangi_salt').digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export interface SessionUser {
  id: string
  email: string
  name: string | null
  role: 'CUSTOMER' | 'ADMIN'
  phone: string | null
}

const SESSION_COOKIE = 'rb_session'
const SESSION_PREFIX = 'session:'

export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days

  // Store session in Setting table (key-value)
  await db.setting.upsert({
    where: { key: `${SESSION_PREFIX}${token}` },
    update: { value: JSON.stringify({ userId, expires }) },
    create: { key: `${SESSION_PREFIX}${token}`, value: JSON.stringify({ userId, expires }) },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  })
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const sessionData = await db.setting.findUnique({
      where: { key: `${SESSION_PREFIX}${token}` },
    })
    if (!sessionData) return null

    const { userId, expires } = JSON.parse(sessionData.value)
    if (Date.now() > expires) {
      await db.setting.delete({ where: { id: sessionData.id } })
      return null
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user || user.status !== 'ACTIVE') return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'CUSTOMER' | 'ADMIN',
      phone: user.phone,
    }
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    try {
      await db.setting.delete({ where: { key: `${SESSION_PREFIX}${token}` } })
    } catch {}
  }
  cookieStore.delete(SESSION_COOKIE)
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireUser()
  if (session.role !== 'ADMIN') throw new Error('Forbidden')
  return session
}
