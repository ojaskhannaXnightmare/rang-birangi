import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const banners = await db.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ banners })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
