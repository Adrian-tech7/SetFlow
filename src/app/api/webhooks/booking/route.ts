import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { runFraudChecks } from '@/lib/fraud'
import { chargeBusinessAndPayCaller } from '@/lib/stripe'
import { notifyAppointmentVerified } from '@/lib/notifications'
import { updateCallerStats, recalculateCallerTier } from '@/lib/tier'

export const dynamic = 'force-dynamic'

interface BookingWebhookPayload {
  event_type: string
  payload: {
    email: string
    phone: string
    event_name: string
    scheduled_time: string
    status: string
    booking_id: string
  }
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Parse webhook payload
    const body: BookingWebhookPayload = await req.json()
    const { event_type, payload } = body

    if (!payload?.email && !payload?.phone) {
      return NextResponse.json(
        { verified: false, reason: 'Missing email and phone in webhook payload' },
        { status: 200 }
      )
    }

    if (!payload?.scheduled_time || !payload?.booking_id) {
      return NextResponse.json(
        { verified: false, reason: 'Missing scheduled_time or booking_id in webhook payload' },
        { status: 200 }
      )
    }

    // Step 2: Find lead by email OR phone match
    const lead = await prisma.lead.findFirst({
      where: {
        OR: [
          ...(payload.email ? [{ email: payload.email }] : []),
          ...(payload.phone ? [{ phone: payload.phone }] : []),
        ],
      },
      include: {
        business: {
          include: { user: true },
        },
        leadPool: true,
      },
    })

    // Step 3: Verify lead exists and belongs to a business
    if (!lead) {
      return NextResponse.json(
        { verified: false, reason: 'Lead not found in database' },
        { status: 200 }
      )
    }

    if (!lead.business) {
      return NextResponse.json(
        { verified: false, reason: 'Lead does not belong to any business' },
        { status: 200 }
      )
    }

    // Step 4: Find active caller assignment for the lead
    const leadAssignment = await prisma.leadAssignment.findFirst({
      where: {
        leadId: lead.id,
        status: { in: ['ASSIGNED', 'CONTACTED', 'FOLLOW_UP'] },
      },
      include: {
        caller: {
          include: { user: true },
        },
      },
    })

    if (!leadAssignment) {
      return NextResponse.json(
        { verified: false, reason: 'No active caller assignment found for this lead' },
        { status: 200 }
      )
    }

    // Step 5: Verify appointment status is confirmed/scheduled
    const webhookStatus = payload.status?.toLowerCase()
    if (!['confirmed', 'scheduled', 'active', 'booked'].includes(webhookStatus)) {
      return NextResponse.json(
        { verified: false, reason: `Appointment status "${payload.status}" is not confirmed/scheduled` },
        { status: 200 }
      )
    }

    // Step 6: Verify appointment time is not backdated (within 7-day window)
    const scheduledTime = new Date(payload.scheduled_time)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    if (scheduledTime < sevenDaysAgo) {
      return NextResponse.json(
        { verified: false, reason: 'Appointment time is too far in the past (>7 days)' },
        { status: 200 }
      )
    }

    // Step 7: Check for duplicate appointment bookings
    const duplicateAppointment = await prisma.appointment.findFirst({
      where: {
        leadId: lead.id,
        businessId: lead.businessId,
        scheduledAt: scheduledTime,
        status: { in: ['PENDING_VERIFICATION', 'VERIFIED', 'COMPLETED'] },
      },
    })

    if (duplicateAppointment) {
      return NextResponse.json(
        { verified: false, reason: 'Duplicate appointment booking detected' },
        { status: 200 }
      )
    }

    // Step 8: Run fraud checks
    const fraudResult = await runFraudChecks({
      callerId: leadAssignment.callerId,
      businessId: lead.businessId,
      leadEmail: lead.email,
      leadPhone: lead.phone,
      scheduledAt: scheduledTime,
    })

    // Step 9: If fraud checks fail with high severity, reject
    if (!fraudResult.passed && fraudResult.alerts.length > 2) {
      console.error('Fraud checks failed with high severity:', fraudResult.alerts)
      return NextResponse.json(
        { verified: false, reason: 'Fraud checks failed', alerts: fraudResult.alerts },
        { status: 200 }
      )
    }

    // Step 10: All checks passed - process the appointment
    const caller = leadAssignment.caller

    // Get the lead pool's payout amount
    const payoutAmount = lead.leadPool?.payoutAmount ?? lead.business.defaultPayoutAmount
    const platformFee = 25
    const totalCharge = payoutAmount + platformFee

    // Create appointment record
    const appointment = await prisma.appointment.create({
      data: {
        leadId: lead.id,
        businessId: lead.businessId,
        callerId: caller.id,
        bookingId: payload.booking_id,
        scheduledAt: scheduledTime,
        status: 'PENDING_VERIFICATION',
        webhookPayload: body as any,
        callerTier: caller.tier,
        payoutAmount,
        platformFee,
        totalCharge,
      },
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        businessId: lead.businessId,
        callerId: caller.id,
        totalAmount: totalCharge,
        platformFee,
        callerPayout: payoutAmount,
        status: 'PENDING',
      },
    })

    // Initiate Stripe charge
    try {
      if (lead.business.stripeCustomerId && caller.stripeAccountId) {
        const paymentIntent = await chargeBusinessAndPayCaller(
          lead.business.stripeCustomerId,
          caller.stripeAccountId,
          totalCharge,
          payoutAmount,
          {
            appointmentId: appointment.id,
            paymentId: payment.id,
            businessId: lead.businessId,
            callerId: caller.id,
            callerStripeId: caller.stripeAccountId,
            callerPayout: payoutAmount.toString(),
          }
        )

        // Update payment status to PROCESSING with Stripe PI ID
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PROCESSING',
            stripePaymentIntentId: paymentIntent.id,
          },
        })
      }
    } catch (stripeError) {
      console.error('Stripe charge failed:', stripeError)
      // Payment stays as PENDING; Stripe webhook will handle retries
    }

    // Update lead status to CONVERTED
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: 'CONVERTED' },
    })

    // Send notifications
    await notifyAppointmentVerified(
      lead.business.user.id,
      caller.user.id,
      appointment.id,
      lead.name,
      payoutAmount,
      totalCharge
    )

    // Update caller stats and recalculate tier
    await updateCallerStats(caller.id)
    await recalculateCallerTier(caller.id)

    return NextResponse.json(
      { verified: true, appointmentId: appointment.id },
      { status: 200 }
    )
  } catch (error) {
    // Step 11: Log error on failure
    console.error('Booking webhook error:', error)
    return NextResponse.json(
      { verified: false, reason: 'Internal server error during verification' },
      { status: 200 }
    )
  }
}
