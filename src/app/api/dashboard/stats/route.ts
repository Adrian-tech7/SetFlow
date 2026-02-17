import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    const businessId = (session.user as any).businessId
    const callerId = (session.user as any).callerId

    if (role === 'BUSINESS' && businessId) {
      const [business, totalLeads, availableLeads, appointments, verifiedAppts, payments] =
        await Promise.all([
          prisma.business.findUnique({ where: { id: businessId } }),
          prisma.lead.count({ where: { businessId } }),
          prisma.lead.count({ where: { businessId, status: 'AVAILABLE' } }),
          prisma.appointment.count({ where: { businessId } }),
          prisma.appointment.count({ where: { businessId, status: 'VERIFIED' } }),
          prisma.payment.aggregate({
            where: { businessId, status: 'COMPLETED' },
            _sum: { totalAmount: true },
          }),
        ])

      return NextResponse.json({
        totalLeads,
        availableLeads,
        totalAppointments: appointments,
        verifiedAppointments: verifiedAppts,
        totalSpent: payments._sum.totalAmount || 0,
        avgRating: business?.avgRating || 0,
        stripeOnboarded: business?.stripeOnboarded,
      })
    }

    if (role === 'CALLER' && callerId) {
      const [caller, assignments, appointments, verifiedAppts, earnings] =
        await Promise.all([
          prisma.caller.findUnique({ where: { id: callerId } }),
          prisma.leadAssignment.count({ where: { callerId } }),
          prisma.appointment.count({ where: { callerId } }),
          prisma.appointment.count({ where: { callerId, status: 'VERIFIED' } }),
          prisma.payment.aggregate({
            where: { callerId, status: 'COMPLETED' },
            _sum: { callerPayout: true },
          }),
        ])

      return NextResponse.json({
        activeLeads: assignments,
        totalAppointments: appointments,
        verifiedAppointments: verifiedAppts,
        totalEarnings: earnings._sum.callerPayout || 0,
        avgRating: caller?.avgRating || 0,
        conversionRate: caller?.conversionRate || 0,
        tier: caller?.tier,
        stripeOnboarded: caller?.stripeOnboarded,
      })
    }

    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
