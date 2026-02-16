import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { appointmentSchema } from '@/lib/validations'
import { TIER_CONFIG } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    const body = await req.json()
    const data = appointmentSchema.parse(body)
    const { businessId } = body

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID required' }, { status: 400 })
    }

    // Get business tier
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    })
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const tierConfig = TIER_CONFIG[business.tier]

    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        callerId,
        leadFirstName: data.leadFirstName,
        leadLastName: data.leadLastName,
        leadEmail: data.leadEmail,
        leadPhone: data.leadPhone,
        scheduledAt: new Date(data.scheduledAt),
        tier: business.tier,
        businessCharge: tierConfig.businessCharge,
        callerPayout: tierConfig.callerPayout,
        platformFee: tierConfig.platformFee,
        notes: data.notes,
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('Create appointment error:', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    const businessId = (session.user as any).businessId
    const callerId = (session.user as any).callerId

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = role === 'BUSINESS' ? { businessId } : { callerId }
    if (status) where.status = status

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          business: { select: { companyName: true } },
          caller: { select: { displayName: true } },
          payment: { select: { status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ])

    return NextResponse.json({
      appointments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('List appointments error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
