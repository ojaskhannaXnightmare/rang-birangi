import { NextResponse } from 'next/server'
import { COLLECTIONS, findMany } from '@/lib/supabase-db'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    const banners = await findMany<any>(COLLECTIONS.BANNERS, {
      where: [{ field: 'isActive', op: '==', value: true }],
      orderBy: { field: 'sortOrder', direction: 'asc' },
    })
    return NextResponse.json({ banners: serializeDates(banners) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
