import { NextRequest, NextResponse } from 'next/server'
import {
  COLLECTIONS, findMany, create, update, remove,
} from '@/lib/firestore-db'
import { getSession } from '@/lib/auth'
import { serializeDates } from '@/lib/helpers'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const addresses = await findMany<any>(COLLECTIONS.ADDRESSES, {
      where: [{ field: 'userId', op: '==', value: session.id }],
    })
    // Sort: default first, then by createdAt desc (in-memory)
    addresses.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1
      if (!a.isDefault && b.isDefault) return 1
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0
      return bTime - aTime
    })
    return NextResponse.json({ addresses: serializeDates(addresses) })
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
      // Unset other defaults
      const existing = await findMany<any>(COLLECTIONS.ADDRESSES, [
        { field: 'userId', op: '==', value: session.id },
        { field: 'isDefault', op: '==', value: true },
      ])
      for (const a of existing) {
        await update(COLLECTIONS.ADDRESSES, a.id, { isDefault: false })
      }
    }
    const address = await create<any>(COLLECTIONS.ADDRESSES, {
      userId: session.id,
      fullName, phone, email: email || null, houseNo, building: building || null,
      street, area: area || null, landmark: landmark || null,
      city, state, pincode, isDefault: !!isDefault,
    })
    return NextResponse.json({ address: serializeDates(address) })
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
      const existing = await findMany<any>(COLLECTIONS.ADDRESSES, [
        { field: 'userId', op: '==', value: session.id },
        { field: 'isDefault', op: '==', value: true },
      ])
      for (const a of existing) {
        if (a.id !== id) await update(COLLECTIONS.ADDRESSES, a.id, { isDefault: false })
      }
    }
    const address = await update<any>(COLLECTIONS.ADDRESSES, id, updates)
    return NextResponse.json({ address: serializeDates(address) })
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
    await remove(COLLECTIONS.ADDRESSES, id)
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
