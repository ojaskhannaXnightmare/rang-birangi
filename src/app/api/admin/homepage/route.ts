import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, update, create,
} from '@/lib/supabase-db'
import { requireAdmin } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    await requireAdmin()
    const sections = await findMany<any>(COLLECTIONS.HOMEPAGE_SECTIONS, {
      orderBy: { field: 'sortOrder', direction: 'asc' },
    })
    return NextResponse.json({ sections: serializeDates(sections) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { id, isEnabled, sortOrder, title, subtitle } = await req.json()
    const updateData: any = {}
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle

    const section = await update<any>(COLLECTIONS.HOMEPAGE_SECTIONS, id, updateData)

    await create(COLLECTIONS.ACTIVITY_LOGS, {
      userId: session.id,
      action: 'HOMEPAGE_UPDATED',
      entity: 'homepage',
      entityId: id,
      metadata: updateData,
    })

    return NextResponse.json({ section: serializeDates(section) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
