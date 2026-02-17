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
    const period = searchParams.get('period') || 'month'

    // Determine date filter based on period
    const now = new Date()
    let dateFilter: Date | null = null

    if (period === 'week') {
      dateFilter = new Date(now)
      dateFilter.setDate(now.getDate() - now.getDay())
      dateFilter.setHours(0, 0, 0, 0)
    } else if (period === 'month') {
      dateFilter = new Date(now.getFullYear(), now.getMonth(), 1)
    }
    // period === 'all' => no date filter

    const appointmentWhere: any = {
      status: { in: ['VERIFIED', 'COMPLETED'] },
    }
    if (dateFilter) {
      appointmentWhere.createdAt = { gte: dateFilter }
    }

    // Get all callers with their appointment counts in the period
    const callers = await prisma.caller.findMany({
      where: {
        user: { isActive: true },
      },
      select: {
        id: true,
        displayName: true,
        tier: true,
        conversionRate: true,
        avgRating: true,
        _count: {
          select: {
            appointments: {
              where: appointmentWhere,
            },
          },
        },
      },
    })

    // Sort by appointment count descending
    const ranked = callers
      .map((caller) => ({
        id: caller.id,
        displayName: caller.displayName,
        tier: caller.tier,
        appointments: caller._count.appointments,
        conversionRate: caller.conversionRate,
        avgRating: caller.avgRating,
      }))
      .sort((a, b) => b.appointments - a.appointments)

    const top20 = ranked.slice(0, 20).map((caller, index) => ({
      rank: index + 1,
      ...caller,
    }))

    // Find current caller's rank
    const currentCallerIndex = ranked.findIndex((c) => c.id === callerId)
    const currentCallerRank = currentCallerIndex >= 0
      ? {
          rank: currentCallerIndex + 1,
          ...ranked[currentCallerIndex],
        }
      : null

    return NextResponse.json({
      period,
      leaderboard: top20,
      currentCaller: currentCallerRank,
      totalCallers: ranked.length,
    })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
