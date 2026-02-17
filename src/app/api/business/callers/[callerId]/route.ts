import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export async function GET(
  req: NextRequest,
  { params }: { params: { callerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const caller = await prisma.caller.findUnique({
      where: { id: params.callerId },
      select: {
        id: true,
        displayName: true,
        bio: true,
        location: true,
        timezone: true,
        salesExperience: true,
        nicheExpertise: true,
        tier: true,
        conversionRate: true,
        avgRating: true,
        totalAppointments: true,
        totalLeadsWorked: true,
        totalEarnings: true,
        createdAt: true,
      },
    })

    if (!caller) {
      return NextResponse.json({ error: 'Caller not found' }, { status: 404 })
    }

    // Business-specific stats
    const [businessAppointments, businessLeadsWorked, businessRatings, callerNote] =
      await Promise.all([
        prisma.appointment.count({
          where: {
            callerId: params.callerId,
            businessId,
            status: { in: ['VERIFIED', 'COMPLETED'] },
          },
        }),
        prisma.leadAssignment.count({
          where: {
            callerId: params.callerId,
            lead: { businessId },
          },
        }),
        prisma.rating.aggregate({
          where: {
            callerId: params.callerId,
            businessId,
          },
          _avg: { score: true },
          _count: true,
        }),
        prisma.callerNote.findUnique({
          where: {
            businessId_callerId: {
              businessId,
              callerId: params.callerId,
            },
          },
        }),
      ])

    const businessConversionRate =
      businessLeadsWorked > 0 ? businessAppointments / businessLeadsWorked : 0

    return NextResponse.json({
      ...caller,
      businessStats: {
        appointments: businessAppointments,
        leadsWorked: businessLeadsWorked,
        conversionRate: businessConversionRate,
        avgRating: businessRatings._avg.score || 0,
        totalRatings: businessRatings._count,
      },
      privateNote: callerNote?.note || null,
    })
  } catch (error) {
    console.error('Caller detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch caller details' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { callerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const { note } = body

    if (typeof note !== 'string') {
      return NextResponse.json({ error: 'Note must be a string' }, { status: 400 })
    }

    const callerNote = await prisma.callerNote.upsert({
      where: {
        businessId_callerId: {
          businessId,
          callerId: params.callerId,
        },
      },
      update: { note },
      create: {
        businessId,
        callerId: params.callerId,
        note,
      },
    })

    return NextResponse.json({ callerNote })
  } catch (error) {
    console.error('Caller note error:', error)
    return NextResponse.json({ error: 'Failed to save caller note' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { callerId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    // Revoke all access requests for this caller from this business
    await prisma.accessRequest.updateMany({
      where: {
        businessId,
        callerId: params.callerId,
        status: { in: ['APPROVED', 'PENDING'] },
      },
      data: { status: 'REVOKED', respondedAt: new Date() },
    })

    // Notify the caller
    const caller = await prisma.caller.findUnique({
      where: { id: params.callerId },
      select: { userId: true },
    })

    if (caller) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { companyName: true },
      })

      await createNotification(
        caller.userId,
        'ACCESS_REVOKED',
        'Access Revoked',
        `${business?.companyName || 'A business'} has revoked your access to their lead pools.`,
        { businessId }
      )
    }

    return NextResponse.json({ message: 'Caller access revoked successfully' })
  } catch (error) {
    console.error('Caller revoke error:', error)
    return NextResponse.json({ error: 'Failed to revoke caller access' }, { status: 500 })
  }
}
