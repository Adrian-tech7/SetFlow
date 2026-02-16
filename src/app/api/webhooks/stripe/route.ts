import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import prisma from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        const stripeId = account.id
        const isOnboarded = account.charges_enabled && account.payouts_enabled

        // Update business or caller
        const business = await prisma.business.findFirst({
          where: { stripeAccountId: stripeId },
        })
        if (business) {
          await prisma.business.update({
            where: { id: business.id },
            data: { stripeOnboarded: isOnboarded },
          })
        } else {
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

      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent
        const appointmentId = pi.metadata.appointmentId

        if (appointmentId) {
          await prisma.payment.update({
            where: { appointmentId },
            data: {
              status: 'COMPLETED',
              stripePaymentIntentId: pi.id,
              paidAt: new Date(),
            },
          })

          // Transfer caller payout
          const callerPayout = parseFloat(pi.metadata.callerPayout || '0')
          const callerStripeId = pi.metadata.callerStripeId

          if (callerPayout > 0 && callerStripeId) {
            const transfer = await stripe.transfers.create({
              amount: Math.round(callerPayout * 100),
              currency: 'usd',
              destination: callerStripeId,
              metadata: { appointmentId },
            })

            await prisma.payment.update({
              where: { appointmentId },
              data: { stripeTransferId: transfer.id },
            })
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent
        const appointmentId = pi.metadata.appointmentId
        if (appointmentId) {
          await prisma.payment.update({
            where: { appointmentId },
            data: { status: 'FAILED' },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

export const config = {
  api: { bodyParser: false },
}
