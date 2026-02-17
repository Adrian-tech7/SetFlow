import { NextRequest, NextResponse } from 'next/server'
import { stripe, transferToCaller } from '@/lib/stripe'
import { notifyPaymentFailed } from '@/lib/notifications'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // ─── Account Updated ────────────────────────────────
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const stripeId = account.id
        const isOnboarded =
          account.charges_enabled &&
          account.payouts_enabled &&
          account.details_submitted

        // Try to find as business first
        const business = await prisma.business.findFirst({
          where: { stripeAccountId: stripeId },
        })

        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: { stripeOnboarded: isOnboarded },
          })
        } else {
          // Try as caller
          const caller = await prisma.caller.findFirst({
            where: { stripeAccountId: stripeId },
          })

          if (caller) {
            await prisma.caller.update({
              where: { id: caller.id },
              data: { stripeOnboarded: isOnboarded },
            })
          }
        }
        break
      }

      // ─── Payment Intent Succeeded ───────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent

        // Find payment by stripePaymentIntentId
        const payment = await prisma.payment.findFirst({
          where: { stripePaymentIntentId: pi.id },
          include: {
            appointment: true,
          },
        })

        if (!payment) {
          console.error('Payment not found for PaymentIntent:', pi.id)
          break
        }

        // Mark payment COMPLETED, set paidAt
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
          },
        })

        // Transfer to caller
        const caller = await prisma.caller.findUnique({
          where: { id: payment.callerId },
        })

        if (caller?.stripeAccountId) {
          try {
            const transfer = await transferToCaller(
              payment.callerPayout,
              caller.stripeAccountId,
              {
                appointmentId: payment.appointmentId,
                paymentId: payment.id,
              }
            )

            await prisma.payment.update({
              where: { id: payment.id },
              data: { stripeTransferId: transfer.id },
            })
          } catch (transferError) {
            console.error('Caller transfer failed:', transferError)
          }
        }

        // Update appointment status to VERIFIED, set verifiedAt
        await prisma.appointment.update({
          where: { id: payment.appointmentId },
          data: {
            status: 'VERIFIED',
            verifiedAt: new Date(),
          },
        })

        // Update business totalSpent and totalAppointments
        await prisma.business.update({
          where: { id: payment.businessId },
          data: {
            totalSpent: { increment: payment.totalAmount },
            totalAppointments: { increment: 1 },
          },
        })

        // Update caller totalEarnings
        await prisma.caller.update({
          where: { id: payment.callerId },
          data: {
            totalEarnings: { increment: payment.callerPayout },
          },
        })

        break
      }

      // ─── Payment Intent Failed ──────────────────────────
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent

        // Find payment by stripePaymentIntentId
        const payment = await prisma.payment.findFirst({
          where: { stripePaymentIntentId: pi.id },
        })

        if (!payment) {
          console.error('Payment not found for failed PaymentIntent:', pi.id)
          break
        }

        // Mark payment FAILED, set failedAt
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
          },
        })

        // Find business and set paymentFailedAt to now (48-hour countdown)
        const business = await prisma.business.findUnique({
          where: { id: payment.businessId },
          include: { user: true },
        })

        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: { paymentFailedAt: new Date() },
          })

          // Update user accountStatus to PAUSED
          await prisma.user.update({
            where: { id: business.userId },
            data: { accountStatus: 'PAUSED' },
          })

          // Freeze all business lead pools
          await prisma.leadPool.updateMany({
            where: { businessId: business.id },
            data: { status: 'FROZEN' },
          })

          // Notify business of payment failure
          await notifyPaymentFailed(business.userId, payment.totalAmount)
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
