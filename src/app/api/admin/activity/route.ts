import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET() {
  try {
    await requireAdmin()
    const logs = await db.activityLog.findMany({
      take: 50,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ logs })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
