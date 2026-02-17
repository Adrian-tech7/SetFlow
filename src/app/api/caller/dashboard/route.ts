import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { TIER_CONFIG, type TierKey } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const caller = await prisma.caller.findUnique({
      where: { id: callerId },
    })

    if (!caller) {
      return NextResponse.json({ error: 'Caller not found' }, { status: 404 })
    }

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      earningsThisWeek,
      earningsThisMonth,
      earningsAllTime,
      pendingAppointments,
      recentAppointments,
    ] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          callerId,
          status: 'COMPLETED',
          paidAt: { gte: startOfWeek },
        },
        _sum: { callerPayout: true },
      }),
      prisma.payment.aggregate({
        where: {
          callerId,
          status: 'COMPLETED',
          paidAt: { gte: startOfMonth },
        },
        _sum: { callerPayout: true },
      }),
      prisma.payment.aggregate({
        where: {
          callerId,
          status: 'COMPLETED',
        },
        _sum: { callerPayout: true },
      }),
      prisma.appointment.count({
        where: {
          callerId,
          status: 'PENDING_VERIFICATION',
        },
      }),
      prisma.appointment.findMany({
        where: { callerId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          lead: {
            select: { name: true },
          },
          business: {
            select: { companyName: true },
          },
          payment: {
            select: { callerPayout: true, status: true },
          },
        },
      }),
    ])

    // Tier progress: show current stats vs next tier requirements
    const currentTier = caller.tier as TierKey
    const tierOrder: TierKey[] = ['BASIC', 'ADVANCED', 'ELITE']
    const currentTierIndex = tierOrder.indexOf(currentTier)
    const nextTier = currentTierIndex < tierOrder.length - 1
      ? tierOrder[currentTierIndex + 1]
      : null

    const tierProgress = {
      currentTier,
      currentTierLabel: TIER_CONFIG[currentTier].label,
      nextTier,
      nextTierLabel: nextTier ? TIER_CONFIG[nextTier].label : null,
      currentStats: {
        leadsWorked: caller.totalLeadsWorked,
        conversionRate: caller.conversionRate,
        avgRating: caller.avgRating,
        disputeRate: caller.disputeRate,
      },
      nextTierRequirements: nextTier
        ? TIER_CONFIG[nextTier].requirements
        : null,
    }

    return NextResponse.json({
      currentTier,
      tierProgress,
      totalLeadsWorked: caller.totalLeadsWorked,
      totalAppointments: caller.totalAppointments,
      conversionRate: caller.conversionRate,
      avgRating: caller.avgRating,
      earningsThisWeek: earningsThisWeek._sum.callerPayout || 0,
      earningsThisMonth: earningsThisMonth._sum.callerPayout || 0,
      earningsAllTime: earningsAllTime._sum.callerPayout || 0,
      pendingAppointments,
      recentActivity: recentAppointments.map((appt) => ({
        id: appt.id,
        leadName: appt.lead.name,
        businessName: appt.business.companyName,
        status: appt.status,
        scheduledAt: appt.scheduledAt,
        payout: appt.payment?.callerPayout || appt.payoutAmount,
        paymentStatus: appt.payment?.status || null,
        createdAt: appt.createdAt,
      })),
    })
  } catch (error) {
    console.error('Caller dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
