import { NextResponse } from 'next/server'
import { COLLECTIONS, findMany } from '@/lib/firestore-db'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    const settings = await findMany<any>(COLLECTIONS.SETTINGS)
    const obj: Record<string, string> = {}
    for (const s of settings) obj[s.key] = s.value
    return NextResponse.json({ settings: obj })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
