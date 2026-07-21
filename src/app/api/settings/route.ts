import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const settings = await db.setting.findMany()
    const obj: Record<string, string> = {}
    for (const s of settings) obj[s.key] = s.value
    return NextResponse.json({ settings: obj })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
