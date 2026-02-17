import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '25')))
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = {
      callerId,
    }

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.scheduledAt = {}
      if (dateFrom) {
        where.scheduledAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.scheduledAt.lte = new Date(dateTo)
      }
    }

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          lead: {
            select: {
              id: true,
              name: true,
              email: true,
              company: true,
            },
          },
          business: {
            select: {
              companyName: true,
            },
          },
          payment: {
            select: {
              id: true,
              callerPayout: true,
              status: true,
              paidAt: true,
            },
          },
          dispute: {
            select: {
              id: true,
              status: true,
              reason: true,
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
    ])

    return NextResponse.json({
      appointments: appointments.map((appt) => ({
        id: appt.id,
        scheduledAt: appt.scheduledAt,
        status: appt.status,
        payoutAmount: appt.payoutAmount,
        callerTier: appt.callerTier,
        notes: appt.notes,
        createdAt: appt.createdAt,
        lead: appt.lead,
        businessName: appt.business.companyName,
        payment: appt.payment
          ? {
              id: appt.payment.id,
              callerPayout: appt.payment.callerPayout,
              status: appt.payment.status,
              paidAt: appt.payment.paidAt,
            }
          : null,
        dispute: appt.dispute
          ? {
              id: appt.dispute.id,
              status: appt.dispute.status,
              reason: appt.dispute.reason,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Caller appointments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
