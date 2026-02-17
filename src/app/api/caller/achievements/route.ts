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

    const achievements = await prisma.achievement.findMany({
      where: { callerId },
      orderBy: { unlockedAt: 'desc' },
    })

    // Define all possible achievements for progress display
    const allAchievements = [
      { type: 'APPOINTMENTS_10', label: 'First 10', description: 'Booked 10 verified appointments', threshold: 10 },
      { type: 'APPOINTMENTS_50', label: 'Power Closer', description: 'Booked 50 verified appointments', threshold: 50 },
      { type: 'APPOINTMENTS_100', label: 'Century Club', description: 'Booked 100 verified appointments', threshold: 100 },
      { type: 'APPOINTMENTS_250', label: 'Elite Performer', description: 'Booked 250 verified appointments', threshold: 250 },
      { type: 'APPOINTMENTS_500', label: 'Legend', description: 'Booked 500 verified appointments', threshold: 500 },
    ]

    const caller = await prisma.caller.findUnique({
      where: { id: callerId },
      select: { totalAppointments: true },
    })

    const unlockedTypes = new Set(achievements.map((a) => a.type))

    const achievementsWithProgress = allAchievements.map((def) => {
      const unlocked = achievements.find((a) => a.type === def.type)
      return {
        type: def.type,
        label: def.label,
        description: def.description,
        threshold: def.threshold,
        unlocked: !!unlocked,
        unlockedAt: unlocked?.unlockedAt || null,
        progress: Math.min(
          (caller?.totalAppointments || 0) / def.threshold,
          1
        ),
        currentCount: caller?.totalAppointments || 0,
      }
    })

    return NextResponse.json({
      achievements: achievementsWithProgress,
      totalUnlocked: unlockedTypes.size,
      totalAvailable: allAchievements.length,
    })
  } catch (error) {
    console.error('Caller achievements error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    )
  }
}
