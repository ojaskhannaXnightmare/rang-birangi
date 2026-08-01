import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, update, create, remove,
} from '@/lib/firestore-db'
import { requireAdmin } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    await requireAdmin()
    const banners = await findMany<any>(COLLECTIONS.BANNERS, {
      orderBy: { field: 'sortOrder', direction: 'asc' },
    })
    return NextResponse.json({ banners: serializeDates(banners) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const banner = await create<any>(COLLECTIONS.BANNERS, body)
    return NextResponse.json({ banner: serializeDates(banner) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin()
    const { id, ...updates } = await req.json()
    const banner = await update<any>(COLLECTIONS.BANNERS, id, updates)
    return NextResponse.json({ banner: serializeDates(banner) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await remove(COLLECTIONS.BANNERS, id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
