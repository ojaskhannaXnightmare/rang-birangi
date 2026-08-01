import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, findOne, create, update,
} from '@/lib/supabase-db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const settings = await findMany<any>(COLLECTIONS.SETTINGS)
    const obj: Record<string, string> = {}
    for (const s of settings) obj[s.key] = s.value
    return NextResponse.json({ settings: obj })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { settings } = await req.json()
    for (const [key, value] of Object.entries(settings)) {
      const existing = await findOne<any>(COLLECTIONS.SETTINGS, [
        { field: 'key', op: '==', value: key },
      ])
      if (existing) {
        await update(COLLECTIONS.SETTINGS, existing.id, { value: String(value) })
      } else {
        await create(COLLECTIONS.SETTINGS, { key, value: String(value) })
      }
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
