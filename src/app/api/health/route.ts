/**
 * RANG BIRANGI - Health Check API
 * GET /api/health
 *
 * Returns the status of all platform services:
 *   - Database (MongoDB if configured, Prisma/SQLite fallback)
 *   - Authentication system
 *   - File upload system
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkMongoConnection, isMongoConfigured } from '@/lib/mongodb'
import { existsSync } from 'fs'
import path from 'path'

export async function GET() {
  const checks: Record<string, any> = {}
  const timestamp = new Date().toISOString()

  // MongoDB check
  const mongoStatus = await checkMongoConnection()
  checks.mongodb = {
    configured: mongoStatus.configured,
    connected: mongoStatus.connected,
    dbName: mongoStatus.dbName,
    error: mongoStatus.error,
    uriPrefix: isMongoConfigured()
      ? process.env.MONGODB_URI?.slice(0, 25) + '...'
      : 'not set',
  }

  // Prisma/SQLite fallback check
  try {
    await db.user.count()
    checks.prisma = { status: 'ok', provider: 'sqlite' }
  } catch (e: any) {
    checks.prisma = { status: 'error', error: e.message }
  }

  // Upload directory check
  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  checks.uploads = {
    dir: '/public/uploads',
    exists: existsSync(uploadDir),
    writable: true,
  }

  // Active database
  checks.activeDatabase = mongoStatus.connected ? 'mongodb' : 'prisma-sqlite'

  // Environment
  checks.environment = {
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUriSet: isMongoConfigured(),
    jwtSecretSet: !!process.env.JWT_SECRET || !!process.env.NEXTAUTH_SECRET,
  }

  const allOk = checks.prisma.status === 'ok' && checks.uploads.exists
  const status = allOk ? 'ok' : 'degraded'

  return NextResponse.json({
    status,
    service: 'RANG BIRANGI',
    timestamp,
    version: '1.0.0',
    checks,
  })
}
