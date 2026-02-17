import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      earningsThisWeek,
      earningsThisMonth,
      earningsAllTime,
      pendingBalance,
      recentPayments,
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
      // Pending balance: verified appointments not yet paid
      prisma.appointment.aggregate({
        where: {
          callerId,
          status: { in: ['VERIFIED', 'COMPLETED'] },
          payment: {
            OR: [
              { status: { in: ['PENDING', 'PROCESSING'] } },
              { is: null },
            ],
          },
        },
        _sum: { payoutAmount: true },
      }),
      prisma.payment.findMany({
        where: {
          callerId,
          status: 'COMPLETED',
        },
        include: {
          appointment: {
            select: {
              id: true,
              scheduledAt: true,
              status: true,
              lead: {
                select: {
                  name: true,
                  company: true,
                },
              },
              business: {
                select: {
                  companyName: true,
                },
              },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        take: 20,
      }),
    ])

    // Earnings by month for the last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    const monthlyPayments = await prisma.payment.findMany({
      where: {
        callerId,
        status: 'COMPLETED',
        paidAt: { gte: sixMonthsAgo },
      },
      select: {
        callerPayout: true,
        paidAt: true,
      },
    })

    const earningsByMonth: { month: string; year: number; earnings: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthStr = d.toLocaleString('en-US', { month: 'short' })
      const year = d.getFullYear()
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

      const total = monthlyPayments
        .filter((p) => {
          if (!p.paidAt) return false
          const paidAt = new Date(p.paidAt)
          return paidAt >= monthStart && paidAt <= monthEnd
        })
        .reduce((sum, p) => sum + p.callerPayout, 0)

      earningsByMonth.push({ month: monthStr, year, earnings: total })
    }

    return NextResponse.json({
      earningsThisWeek: earningsThisWeek._sum.callerPayout || 0,
      earningsThisMonth: earningsThisMonth._sum.callerPayout || 0,
      earningsAllTime: earningsAllTime._sum.callerPayout || 0,
      pendingBalance: pendingBalance._sum.payoutAmount || 0,
      recentPayments: recentPayments.map((payment) => ({
        id: payment.id,
        callerPayout: payment.callerPayout,
        paidAt: payment.paidAt,
        status: payment.status,
        appointment: {
          id: payment.appointment.id,
          scheduledAt: payment.appointment.scheduledAt,
          status: payment.appointment.status,
          leadName: payment.appointment.lead.name,
          leadCompany: payment.appointment.lead.company,
          businessName: payment.appointment.business.companyName,
        },
      })),
      earningsByMonth,
    })
  } catch (error) {
    console.error('Caller earnings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
}
