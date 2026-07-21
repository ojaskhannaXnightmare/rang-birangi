import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ categories })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
