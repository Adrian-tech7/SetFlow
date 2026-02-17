import prisma from '@/lib/prisma'

type NotificationType =
  | 'APPOINTMENT_VERIFIED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_SENT'
  | 'PAYMENT_FAILED'
  | 'TIER_CHANGE'
  | 'ACCESS_APPROVED'
  | 'ACCESS_REJECTED'
  | 'ACCESS_REVOKED'
  | 'ACCESS_REQUESTED'
  | 'DISPUTE_CREATED'
  | 'DISPUTE_RESOLVED'
  | 'ACCOUNT_PAUSED'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'LEAD_POOL_FROZEN'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      data: data || undefined,
    },
  })
}

export async function notifyAppointmentVerified(
  businessUserId: string,
  callerUserId: string,
  appointmentId: string,
  leadName: string,
  payoutAmount: number,
  totalCharge: number
) {
  await Promise.all([
    createNotification(
      callerUserId,
      'PAYMENT_RECEIVED',
      'Appointment Verified - Payment Incoming!',
      `Your appointment with ${leadName} has been verified. $${payoutAmount} payout incoming.`,
      { appointmentId, amount: payoutAmount }
    ),
    createNotification(
      businessUserId,
      'APPOINTMENT_VERIFIED',
      'Appointment Verified',
      `Appointment with ${leadName} has been verified. Charged $${totalCharge}.`,
      { appointmentId, amount: totalCharge }
    ),
  ])
}

export async function notifyPaymentFailed(businessUserId: string, amount: number) {
  await createNotification(
    businessUserId,
    'PAYMENT_FAILED',
    'Payment Failed - Action Required',
    `A payment of $${amount} failed. Your account will be paused. You have 48 hours to update your payment method.`,
    { amount, deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() }
  )
}

export async function notifyAccessResponse(
  callerUserId: string,
  businessName: string,
  poolName: string,
  approved: boolean
) {
  await createNotification(
    callerUserId,
    approved ? 'ACCESS_APPROVED' : 'ACCESS_REJECTED',
    approved ? 'Access Approved!' : 'Access Request Rejected',
    approved
      ? `${businessName} has approved your access to "${poolName}". Start working those leads!`
      : `${businessName} has rejected your access to "${poolName}".`,
    { businessName, poolName }
  )
}
