import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  bookingLink: z.string().url('Must be a valid URL').optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        bookingLink: true,
        bookingWebhookUrl: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error) {
    console.error('Business settings GET error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    const body = await req.json()
    const parsed = updateSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: { bookingLink: parsed.data.bookingLink },
      select: { bookingLink: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Business settings PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
