import prisma from '@/lib/prisma'
import { calculateTier, TIER_CONFIG, type TierKey } from '@/lib/utils'

export async function recalculateCallerTier(callerId: string) {
  const caller = await prisma.caller.findUnique({ where: { id: callerId } })
  if (!caller) return null

  const newTier = calculateTier({
    totalLeadsWorked: caller.totalLeadsWorked,
    conversionRate: caller.conversionRate,
    avgRating: caller.avgRating,
    disputeRate: caller.disputeRate,
  })

  if (newTier !== caller.tier) {
    await prisma.caller.update({
      where: { id: callerId },
      data: { tier: newTier },
    })

    const user = await prisma.user.findFirst({ where: { caller: { id: callerId } } })
    if (user) {
      const oldLabel = TIER_CONFIG[caller.tier as TierKey].label
      const newLabel = TIER_CONFIG[newTier].label
      const promoted = tierRank(newTier) > tierRank(caller.tier as TierKey)

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'TIER_CHANGE',
          title: promoted ? 'Tier Promotion!' : 'Tier Update',
          message: promoted
            ? `Congratulations! You've been promoted from ${oldLabel} to ${newLabel}.`
            : `Your tier has changed from ${oldLabel} to ${newLabel}. Keep improving your stats!`,
          data: { oldTier: caller.tier, newTier },
        },
      })

      await checkMilestones(callerId, caller.totalAppointments)
    }

    return newTier
  }

  return caller.tier
}

function tierRank(tier: TierKey): number {
  return tier === 'ELITE' ? 3 : tier === 'ADVANCED' ? 2 : 1
}

async function checkMilestones(callerId: string, totalAppointments: number) {
  const milestones = [
    { count: 10, type: 'APPOINTMENTS_10', label: 'First 10', description: 'Booked 10 verified appointments' },
    { count: 50, type: 'APPOINTMENTS_50', label: 'Power Closer', description: 'Booked 50 verified appointments' },
    { count: 100, type: 'APPOINTMENTS_100', label: 'Century Club', description: 'Booked 100 verified appointments' },
    { count: 250, type: 'APPOINTMENTS_250', label: 'Elite Performer', description: 'Booked 250 verified appointments' },
    { count: 500, type: 'APPOINTMENTS_500', label: 'Legend', description: 'Booked 500 verified appointments' },
  ]

  for (const milestone of milestones) {
    if (totalAppointments >= milestone.count) {
      const exists = await prisma.achievement.findFirst({
        where: { callerId, type: milestone.type },
      })
      if (!exists) {
        await prisma.achievement.create({
          data: {
            callerId,
            type: milestone.type,
            label: milestone.label,
            description: milestone.description,
          },
        })
      }
    }
  }
}

export async function updateCallerStats(callerId: string) {
  const caller = await prisma.caller.findUnique({ where: { id: callerId } })
  if (!caller) return

  const totalLeadsWorked = await prisma.leadAssignment.count({
    where: { callerId },
  })

  const totalAppointments = await prisma.appointment.count({
    where: { callerId, status: { in: ['VERIFIED', 'COMPLETED'] } },
  })

  const disputeCount = await prisma.dispute.count({
    where: { callerId, status: 'VALID' },
  })

  const totalAllAppointments = await prisma.appointment.count({
    where: { callerId },
  })

  const noShowCount = await prisma.appointment.count({
    where: { callerId, status: 'NO_SHOW' },
  })

  const showUpEligible = totalAppointments + noShowCount
  const showUpRate = showUpEligible > 0 ? totalAppointments / showUpEligible : 0

  const conversionRate = totalLeadsWorked > 0 ? totalAppointments / totalLeadsWorked : 0
  const disputeRate = totalAllAppointments > 0 ? disputeCount / totalAllAppointments : 0

  const earnings = await prisma.payment.aggregate({
    where: { callerId, status: 'COMPLETED' },
    _sum: { callerPayout: true },
  })

  const ratings = await prisma.rating.aggregate({
    where: { callerId },
    _avg: { score: true },
  })

  await prisma.caller.update({
    where: { id: callerId },
    data: {
      totalLeadsWorked,
      totalAppointments,
      conversionRate,
      showUpRate,
      avgRating: ratings._avg.score || 0,
      totalEarnings: earnings._sum.callerPayout || 0,
      disputeRate,
      disputeCount,
    },
  })

  await recalculateCallerTier(callerId)
}
