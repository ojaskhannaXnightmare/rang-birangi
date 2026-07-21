import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const addresses = await db.address.findMany({
      where: { userId: session.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ addresses })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { fullName, phone, email, houseNo, building, street, area, landmark, city, state, pincode, isDefault } = body

    if (isDefault) {
      await db.address.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      })
    }
    const address = await db.address.create({
      data: {
        userId: session.id,
        fullName, phone, email, houseNo, building, street, area, landmark, city, state, pincode,
        isDefault: !!isDefault,
      },
    })
    return NextResponse.json({ address })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await req.json()
    const { id, ...updates } = body

    if (updates.isDefault) {
      await db.address.updateMany({
        where: { userId: session.id, isDefault: true },
        data: { isDefault: false },
      })
    }
    const address = await db.address.update({
      where: { id },
      data: updates,
    })
    return NextResponse.json({ address })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.address.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
