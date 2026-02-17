import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { TIER_CONFIG, PLATFORM_FEE } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const body = await req.json()
    const { leadId, scheduledAt, notes } = body

    if (!leadId || !scheduledAt) {
      return NextResponse.json({ error: 'leadId and scheduledAt are required' }, { status: 400 })
    }

    // Get the lead and its business
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { business: true },
    })
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get caller tier
    const caller = await prisma.caller.findUnique({
      where: { id: callerId },
    })
    if (!caller) {
      return NextResponse.json({ error: 'Caller not found' }, { status: 404 })
    }

    const payoutAmount = lead.business.defaultPayoutAmount
    const totalCharge = payoutAmount + PLATFORM_FEE

    const appointment = await prisma.appointment.create({
      data: {
        leadId,
        businessId: lead.businessId,
        callerId,
        scheduledAt: new Date(scheduledAt),
        callerTier: caller.tier,
        payoutAmount,
        platformFee: PLATFORM_FEE,
        totalCharge,
        notes,
      },
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error: any) {
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const where: any = role === 'BUSINESS' ? { businessId } : { callerId }
    if (status) where.status = status

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          lead: { select: { id: true, name: true, email: true, company: true } },
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
