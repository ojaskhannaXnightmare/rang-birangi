/**
 * RANG BIRANGI - Supabase Admin Client
 *
 * Server-side Supabase client using the service role key.
 * Bypasses Row Level Security (RLS) — for server use only.
 *
 * Environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL — https://jrjpnomlvthbhpqpwfio.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY — sb_secret_xxx (service role, server-only)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — sb_publishable_xxx (public, client-safe)
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

let client: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SERVICE_ROLE_KEY.length > 0 && SUPABASE_URL.startsWith('http')
}

export function getSupabase(): SupabaseClient {
  if (client) return client
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.'
    )
  }
  client = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  return client
}

/**
 * Check Supabase connection for /api/health
 */
export async function checkSupabaseConnection(): Promise<{
  configured: boolean
  connected: boolean
  url?: string
  error?: string
}> {
  if (!isSupabaseConfigured()) {
    return { configured: false, connected: false }
  }
  try {
    const supabase = getSupabase()
    // Simple query to test connection
    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1)
    if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
      // PGRST116 = no rows, 42P01 = table doesn't exist yet
      // Both are OK for health check (means connection works)
      throw error
    }
    return {
      configured: true,
      connected: true,
      url: SUPABASE_URL,
    }
  } catch (e: any) {
    return {
      configured: true,
      connected: false,
      url: SUPABASE_URL,
      error: e.message,
    }
  }
}

/**
 * Get the Supabase Storage bucket name for product images
 */
export const STORAGE_BUCKET = 'rangbirangi'
