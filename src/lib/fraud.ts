import prisma from '@/lib/prisma'

export async function runFraudChecks(appointmentData: {
  callerId: string
  businessId: string
  leadEmail: string
  leadPhone: string
  scheduledAt: Date
}) {
  const alerts: string[] = []

  const caller = await prisma.caller.findUnique({
    where: { id: appointmentData.callerId },
    include: { user: true },
  })

  if (!caller) return { passed: false, alerts: ['Caller not found'] }

  // 24-hour cooling period check
  if (caller.coolingPeriodEnds && new Date() < caller.coolingPeriodEnds) {
    alerts.push('Caller is still in cooling period (24h after account creation)')
    return { passed: false, alerts }
  }

  // Check for duplicate appointment on same lead
  const duplicateAppointment = await prisma.appointment.findFirst({
    where: {
      lead: {
        OR: [
          { email: appointmentData.leadEmail },
          { phone: appointmentData.leadPhone },
        ],
      },
      businessId: appointmentData.businessId,
      status: { in: ['PENDING_VERIFICATION', 'VERIFIED', 'COMPLETED'] },
    },
  })

  if (duplicateAppointment) {
    alerts.push('Duplicate appointment detected for this lead')
  }

  // Check same lead booked by multiple callers
  const multiCallerBookings = await prisma.appointment.count({
    where: {
      lead: {
        OR: [
          { email: appointmentData.leadEmail },
          { phone: appointmentData.leadPhone },
        ],
      },
      businessId: appointmentData.businessId,
      callerId: { not: appointmentData.callerId },
      status: { in: ['PENDING_VERIFICATION', 'VERIFIED'] },
    },
  })

  if (multiCallerBookings > 0) {
    alerts.push('Same lead booked by multiple callers')
  }

  // Email domain check - caller can't book with their own email domain
  if (caller.user.email && appointmentData.leadEmail) {
    const callerDomain = caller.user.email.split('@')[1]
    const leadDomain = appointmentData.leadEmail.split('@')[1]
    if (callerDomain === leadDomain) {
      alerts.push('Lead email domain matches caller email domain')
    }
  }

  // Check for >80% appointments between same business-caller pair
  const totalCallerAppointments = await prisma.appointment.count({
    where: { callerId: appointmentData.callerId, status: { in: ['VERIFIED', 'COMPLETED'] } },
  })
  const pairAppointments = await prisma.appointment.count({
    where: {
      callerId: appointmentData.callerId,
      businessId: appointmentData.businessId,
      status: { in: ['VERIFIED', 'COMPLETED'] },
    },
  })

  if (totalCallerAppointments > 5 && pairAppointments / totalCallerAppointments > 0.8) {
    alerts.push('Over 80% of caller appointments are with the same business - possible collusion')
  }

  // Check for burst activity (10+ in first day)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentAppointments = await prisma.appointment.count({
    where: {
      callerId: appointmentData.callerId,
      createdAt: { gte: oneDayAgo },
    },
  })

  if (recentAppointments >= 10) {
    alerts.push('Caller has 10+ appointments in the last 24 hours - unusual activity')
  }

  // Backdated appointment check
  const now = new Date()
  if (appointmentData.scheduledAt < now) {
    alerts.push('Appointment time is in the past')
  }

  // Create fraud alerts if any
  for (const alert of alerts) {
    await prisma.fraudAlert.create({
      data: {
        type: 'APPOINTMENT_VERIFICATION',
        severity: alerts.length > 2 ? 'high' : 'medium',
        description: alert,
        businessId: appointmentData.businessId,
        callerId: appointmentData.callerId,
        data: { appointmentData },
      },
    })
  }

  return {
    passed: alerts.length === 0,
    alerts,
  }
}

export async function checkBusinessDisputeRate(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } })
  if (!business) return

  const totalAppointments = await prisma.appointment.count({
    where: { businessId },
  })
  const totalDisputes = await prisma.dispute.count({
    where: { businessId },
  })

  if (totalAppointments > 10 && totalDisputes / totalAppointments > 0.2) {
    await prisma.fraudAlert.create({
      data: {
        type: 'HIGH_DISPUTE_RATE',
        severity: 'high',
        description: `Business ${business.companyName} has >20% dispute rate`,
        businessId,
        data: { totalAppointments, totalDisputes, rate: totalDisputes / totalAppointments },
      },
    })
  }

  if (business.falseDisputeCount >= 3) {
    await prisma.fraudAlert.create({
      data: {
        type: 'FALSE_DISPUTES',
        severity: 'high',
        description: `Business ${business.companyName} has ${business.falseDisputeCount} false disputes - account review required`,
        businessId,
      },
    })
  }
}
