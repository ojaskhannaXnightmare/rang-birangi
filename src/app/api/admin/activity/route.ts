import { NextResponse } from 'next/server'
import { COLLECTIONS, findMany, findById } from '@/lib/supabase-db'
import { requireAdmin } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    await requireAdmin()
    const logs = await findMany<any>(COLLECTIONS.ACTIVITY_LOGS, {
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit: 50,
    })
    for (const log of logs) {
      if (log.userId) {
        log.user = await findById<any>(COLLECTIONS.USERS, log.userId)
      }
    }
    return NextResponse.json({ logs: serializeDates(logs) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
