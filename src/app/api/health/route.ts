/**
 * RANG BIRANGI - Health Check API
 * GET /api/health
 *
 * Returns the status of all platform services:
 *   - Firebase (Firestore + Storage)
 *   - Upload system
 */
import { NextResponse } from 'next/server'
import { checkFirebaseConnection, isFirebaseConfigured } from '@/lib/firebase-admin'

export async function GET() {
  const checks: Record<string, any> = {}
  const timestamp = new Date().toISOString()

  // Firebase check
  const firebaseStatus = await checkFirebaseConnection()
  checks.firebase = {
    configured: firebaseStatus.configured,
    connected: firebaseStatus.connected,
    projectId: firebaseStatus.projectId,
    error: firebaseStatus.error,
  }

  // Environment
  checks.environment = {
    nodeEnv: process.env.NODE_ENV || 'development',
    firebaseConfigured: isFirebaseConfigured(),
    publicFirebaseSet: !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  }

  const allOk = checks.firebase.connected
  const status = allOk ? 'ok' : (isFirebaseConfigured() ? 'degraded' : 'not-configured')

  return NextResponse.json({
    status,
    service: 'RANG BIRANGI',
    database: 'Firebase Firestore',
    timestamp,
    version: '2.0.0',
    checks,
  })
}
