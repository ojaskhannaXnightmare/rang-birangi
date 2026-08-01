/**
 * RANG BIRANGI - Health Check API
 * GET /api/health
 *
 * Returns the status of all platform services:
 *   - Supabase (PostgreSQL + Storage)
 */
import { NextResponse } from 'next/server'
import { checkSupabaseConnection, isSupabaseConfigured } from '@/lib/supabase-admin'

export async function GET() {
  const checks: Record<string, any> = {}
  const timestamp = new Date().toISOString()

  // Supabase check
  const supabaseStatus = await checkSupabaseConnection()
  checks.supabase = {
    configured: supabaseStatus.configured,
    connected: supabaseStatus.connected,
    url: supabaseStatus.url,
    error: supabaseStatus.error,
  }

  // Environment
  checks.environment = {
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseConfigured: isSupabaseConfigured(),
    vercel: !!process.env.VERCEL,
  }

  const allOk = checks.supabase.connected
  const status = allOk ? 'ok' : (isSupabaseConfigured() ? 'degraded' : 'not-configured')

  return NextResponse.json({
    status,
    service: 'RANG BIRANGI',
    database: 'Supabase PostgreSQL',
    timestamp,
    version: '3.0.0',
    checks,
  })
}
