import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const [
      totalLeads,
      activeLeads,
      totalAppointments,
      verifiedAppointments,
      totalSpentAgg,
      avgRatingAgg,
      activeCallers,
      activePools,
      costPerAppointmentData,
      recentAppointments,
    ] = await Promise.all([
      prisma.lead.count({ where: { businessId } }),
      prisma.lead.count({ where: { businessId, status: 'AVAILABLE' } }),
      prisma.appointment.count({ where: { businessId } }),
      prisma.appointment.count({
        where: { businessId, status: { in: ['VERIFIED', 'COMPLETED'] } },
      }),
      prisma.payment.aggregate({
        where: { businessId, status: 'COMPLETED' },
        _sum: { totalAmount: true },
      }),
      prisma.rating.aggregate({
        where: { businessId },
        _avg: { score: true },
      }),
      prisma.accessRequest.findMany({
        where: { businessId, status: 'APPROVED' },
        distinct: ['callerId'],
        select: { callerId: true },
      }),
      prisma.leadPool.count({ where: { businessId, status: 'ACTIVE' } }),
      prisma.appointment.groupBy({
        by: ['callerTier'],
        where: { businessId, status: { in: ['VERIFIED', 'COMPLETED'] } },
        _avg: { totalCharge: true },
        _count: true,
      }),
      prisma.appointment.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          lead: { select: { name: true } },
          caller: { select: { displayName: true } },
          payment: { select: { status: true, totalAmount: true } },
        },
      }),
    ])

    const totalSpent = totalSpentAgg._sum.totalAmount || 0
    const avgRating = avgRatingAgg._avg.score || 0
    const conversionRate = totalLeads > 0 ? totalAppointments / totalLeads : 0

    // Cost per appointment by tier
    const costPerAppointment: Record<string, { avgCost: number; count: number }> = {}
    for (const row of costPerAppointmentData) {
      costPerAppointment[row.callerTier] = {
        avgCost: row._avg.totalCharge || 0,
        count: row._count,
      }
    }

    // Caller leaderboard: top 5 callers by appointments for this business
    const callerLeaderboardRaw = await prisma.appointment.groupBy({
      by: ['callerId'],
      where: { businessId, status: { in: ['VERIFIED', 'COMPLETED'] } },
      _count: true,
      orderBy: { _count: { callerId: 'desc' } },
      take: 5,
    })

    const callerIds = callerLeaderboardRaw.map((c) => c.callerId)
    const callerDetails = callerIds.length > 0
      ? await prisma.caller.findMany({
          where: { id: { in: callerIds } },
          select: {
            id: true,
            displayName: true,
            tier: true,
            conversionRate: true,
            avgRating: true,
          },
        })
      : []

    const callerMap = new Map(callerDetails.map((c) => [c.id, c]))

    // Get per-caller leads worked for this business to compute per-business conversion rate
    const callerLeadsWorked = callerIds.length > 0
      ? await prisma.leadAssignment.groupBy({
          by: ['callerId'],
          where: {
            callerId: { in: callerIds },
            lead: { businessId },
          },
          _count: true,
        })
      : []
    const callerLeadsMap = new Map(callerLeadsWorked.map((c) => [c.callerId, c._count]))

    const callerLeaderboard = callerLeaderboardRaw.map((row) => {
      const caller = callerMap.get(row.callerId)
      const leadsWorked = callerLeadsMap.get(row.callerId) || 0
      return {
        displayName: caller?.displayName || 'Unknown',
        tier: caller?.tier || 'BASIC',
        appointments: row._count,
        conversionRate: leadsWorked > 0 ? row._count / leadsWorked : 0,
        avgRating: caller?.avgRating || 0,
      }
    })

    const formattedRecentAppointments = recentAppointments.map((appt) => ({
      id: appt.id,
      leadName: appt.lead.name,
      callerName: appt.caller.displayName,
      status: appt.status,
      amount: appt.totalCharge,
      scheduledAt: appt.scheduledAt,
      paymentStatus: appt.payment?.status || null,
    }))

    return NextResponse.json({
      totalLeads,
      activeLeads,
      totalAppointments,
      verifiedAppointments,
      totalSpent,
      avgRating,
      conversionRate,
      activeCallers: activeCallers.length,
      activePools,
      costPerAppointment,
      callerLeaderboard,
      recentAppointments: formattedRecentAppointments,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
