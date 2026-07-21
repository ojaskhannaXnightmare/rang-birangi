import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const sections = await db.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
    })
    return NextResponse.json({ sections })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin()
    const { id, isEnabled, sortOrder, title, subtitle } = await req.json()
    const update: any = {}
    if (isEnabled !== undefined) update.isEnabled = isEnabled
    if (sortOrder !== undefined) update.sortOrder = sortOrder
    if (title !== undefined) update.title = title
    if (subtitle !== undefined) update.subtitle = subtitle

    const section = await db.homepageSection.update({ where: { id }, data: update })

    await db.activityLog.create({
      data: {
        userId: session.id,
        action: 'HOMEPAGE_UPDATED',
        entity: 'homepage',
        entityId: id,
        metadata: JSON.stringify(update),
      },
    })

    return NextResponse.json({ section })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
