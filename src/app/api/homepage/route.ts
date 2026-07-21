import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const sections = await db.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ sections })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
