/**
 * RANG BIRANGI - Database Status Check
 * GET /api/db-status
 *
 * Checks if the Supabase database has the required tables.
 * Returns { ready: boolean, missingTables: string[] }
 */
import { NextResponse } from 'next/server'
import { isSupabaseConfigured, getSupabase } from '@/lib/supabase-admin'

const REQUIRED_TABLES = [
  'users', 'categories', 'products', 'orders', 'order_items',
  'payments', 'shipments', 'cart', 'cart_items', 'wishlist',
  'wishlist_items', 'reviews', 'banners', 'homepage_sections',
  'settings', 'activity_logs', 'sessions', 'addresses',
]

export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        ready: false,
        configured: false,
        error: 'Supabase not configured. Add env vars on Vercel.',
        missingTables: REQUIRED_TABLES,
      })
    }

    const supabase = getSupabase()
    const missingTables: string[] = []
    let testPassed = false

    // Test by trying to query each table
    for (const table of REQUIRED_TABLES) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1)

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01' || error.message.includes('Could not find the table')) {
          missingTables.push(table)
        }
      } else {
        testPassed = true
      }
    }

    return NextResponse.json({
      ready: missingTables.length === 0,
      configured: true,
      testPassed,
      missingTables,
      totalTables: REQUIRED_TABLES.length,
      existingTables: REQUIRED_TABLES.length - missingTables.length,
    })
  } catch (e: any) {
    return NextResponse.json({
      ready: false,
      configured: isSupabaseConfigured(),
      error: e.message,
      missingTables: REQUIRED_TABLES,
    }, { status: 500 })
  }
}
