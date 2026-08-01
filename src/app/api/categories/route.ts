import { NextResponse } from 'next/server'
import { COLLECTIONS, findMany } from '@/lib/supabase-db'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    const categories = await findMany<any>(COLLECTIONS.CATEGORIES, {
      where: [{ field: 'isActive', op: '==', value: true }],
      orderBy: { field: 'sortOrder', direction: 'asc' },
    })
    return NextResponse.json({ categories: serializeDates(categories) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
