import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getAccountStatus } from '@/lib/stripe'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    const userId = (session.user as any).id

    if (role !== 'BUSINESS' && role !== 'CALLER') {
      return NextResponse.json({ error: 'Only businesses and callers have Stripe accounts' }, { status: 403 })
    }

    // Get stripeAccountId from business or caller
    let stripeAccountId: string | null = null

    if (role === 'BUSINESS') {
      const business = await prisma.business.findUnique({ where: { userId } })
      stripeAccountId = business?.stripeAccountId ?? null
    } else {
      const caller = await prisma.caller.findUnique({ where: { userId } })
      stripeAccountId = caller?.stripeAccountId ?? null
    }

    if (!stripeAccountId) {
      return NextResponse.json({
        connected: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      })
    }

    // Get account status from Stripe
    const status = await getAccountStatus(stripeAccountId)

    // If fully onboarded, update stripeOnboarded to true
    const fullyOnboarded = status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted

    if (fullyOnboarded) {
      if (role === 'BUSINESS') {
        await prisma.business.update({
          where: { userId },
          data: { stripeOnboarded: true },
        })
      } else {
        await prisma.caller.update({
          where: { userId },
          data: { stripeOnboarded: true },
        })
      }
    }

    return NextResponse.json({
      connected: true,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      onboarded: fullyOnboarded,
    })
  } catch (error) {
    console.error('Stripe status check error:', error)
    return NextResponse.json({ error: 'Failed to check Stripe status' }, { status: 500 })
  }
}
