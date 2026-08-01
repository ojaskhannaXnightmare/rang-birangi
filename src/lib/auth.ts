/**
 * RANG BIRANGI - Auth Utilities (Firestore-backed)
 */
import { cookies } from 'next/headers'
import crypto from 'crypto'
import {
  COLLECTIONS, findById, findOne, create, update, remove,
} from './firestore-db'

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

export async function createSession(userId: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = Date.now() + 7 * 24 * 60 * 60 * 1000

  await create(COLLECTIONS.SESSIONS, {
    token,
    userId,
    expires,
    createdAt: new Date(),
  }, `session_${token}`)

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

    const session = await findById<any>(COLLECTIONS.SESSIONS, `session_${token}`)
    if (!session) return null

    if (Date.now() > session.expires) {
      await remove(COLLECTIONS.SESSIONS, `session_${token}`)
      return null
    }

    const user = await findById<any>(COLLECTIONS.USERS, session.userId)
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
      await remove(COLLECTIONS.SESSIONS, `session_${token}`)
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
