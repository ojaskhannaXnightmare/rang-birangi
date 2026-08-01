/**
 * RANG BIRANGI - Firebase Admin SDK Initialization
 *
 * Reads Firebase service account from environment variables.
 * Works on Vercel — set these in your Vercel project settings:
 *
 * Either set FIREBASE_SERVICE_ACCOUNT (full JSON as string)
 * OR set individual fields:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (with \n escapes preserved)
 *
 * Plus the client config (safe to expose):
 *   NEXT_PUBLIC_FIREBASE_API_KEY
 *   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 *   NEXT_PUBLIC_FIREBASE_PROJECT_ID
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 *   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 *   NEXT_PUBLIC_FIREBASE_APP_ID
 */
import admin from 'firebase-admin'
import { cert, getApps, initializeApp, App } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { getStorage, Storage } from 'firebase-admin/storage'

function getServiceAccount(): { projectId: string; clientEmail: string; privateKey: string } | null {
  // Option 1: Full JSON in one env var (recommended for Vercel)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      // CRITICAL: Vercel stores env vars as single lines, so `\n` in the private key
      // becomes literal `\n` text. Replace with actual newlines.
      const privateKey = (parsed.private_key || '').replace(/\\n/g, '\n')
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey,
      }
    } catch {
      // fall through to option 2
    }
  }

  // Option 2: Individual env vars
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal \n with actual newlines (Vercel stores env as single line)
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  }

  return null
}

let app: App | null = null
let dbInstance: Firestore | null = null
let storageInstance: Storage | null = null

export function isFirebaseConfigured(): boolean {
  return getServiceAccount() !== null
}

export function getFirebaseApp(): App {
  if (app) return app
  if (getApps().length > 0) {
    app = getApps()[0]!
    return app
  }
  const serviceAccount = getServiceAccount()
  if (!serviceAccount) {
    throw new Error(
      'Firebase not configured. Set FIREBASE_SERVICE_ACCOUNT or ' +
      'FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in your environment.'
    )
  }
  app = initializeApp({
    credential: cert({
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
    }),
    projectId: serviceAccount.projectId,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ||
      `${serviceAccount.projectId}.appspot.com`,
  })
  return app
}

export function getDb(): Firestore {
  if (dbInstance) return dbInstance
  dbInstance = getFirestore(getFirebaseApp())
  // Use server timestamps for createdAt/updatedAt
  return dbInstance
}

export function getStorageBucket() {
  if (storageInstance) return storageInstance.bucket()
  storageInstance = getStorage(getFirebaseApp())
  return storageInstance.bucket()
}

/**
 * Check Firebase connection for /api/health
 */
export async function checkFirebaseConnection(): Promise<{
  configured: boolean
  connected: boolean
  projectId?: string
  error?: string
}> {
  if (!isFirebaseConfigured()) {
    return { configured: false, connected: false }
  }
  try {
    const db = getDb()
    // Simple read to test connection
    await db.collection('__health__').doc('ping').get()
    return {
      configured: true,
      connected: true,
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    }
  } catch (e: any) {
    return {
      configured: true,
      connected: false,
      projectId: process.env.FIREBASE_PROJECT_ID,
      error: e.message,
    }
  }
}
