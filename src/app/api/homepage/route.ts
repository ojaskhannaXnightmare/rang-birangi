import { NextResponse } from 'next/server'
import { COLLECTIONS, findMany } from '@/lib/firestore-db'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    const sections = await findMany<any>(COLLECTIONS.HOMEPAGE_SECTIONS, {
      orderBy: { field: 'sortOrder', direction: 'asc' },
    })
    return NextResponse.json({ sections: serializeDates(sections) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
