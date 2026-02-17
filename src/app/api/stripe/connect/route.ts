import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createConnectedAccount, createAccountLink, createCustomer } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    const userId = (session.user as any).id
    const email = session.user.email!

    if (role !== 'BUSINESS' && role !== 'CALLER') {
      return NextResponse.json({ error: 'Only businesses and callers can connect Stripe' }, { status: 403 })
    }

    // Check if already has a Stripe account
    if (role === 'BUSINESS') {
      const business = await prisma.business.findUnique({ where: { userId } })
      if (business?.stripeAccountId) {
        // Ensure business also has a Stripe Customer for payments
        if (!business.stripeCustomerId) {
          const customer = await createCustomer(email, business.companyName, {
            businessId: business.id,
            userId,
          })
          await prisma.business.update({
            where: { id: business.id },
            data: { stripeCustomerId: customer.id },
          })
        }
        // Generate new onboarding link for existing account
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
        const accountLink = await createAccountLink(business.stripeAccountId, returnUrl)
        return NextResponse.json({ url: accountLink.url })
      }
    } else {
      const caller = await prisma.caller.findUnique({ where: { userId } })
      if (caller?.stripeAccountId) {
        // Generate new onboarding link for existing account
        const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
        const accountLink = await createAccountLink(caller.stripeAccountId, returnUrl)
        return NextResponse.json({ url: accountLink.url })
      }
    }

    // Create connected account
    const type = role === 'BUSINESS' ? 'business' : 'caller'
    const account = await createConnectedAccount(email, type as 'business' | 'caller')

    // Save Stripe account ID + create Customer for businesses
    if (role === 'BUSINESS') {
      const business = await prisma.business.findUnique({ where: { userId } })
      const customer = await createCustomer(email, business?.companyName || '', {
        businessId: business?.id || '',
        userId,
      })
      await prisma.business.update({
        where: { userId },
        data: {
          stripeAccountId: account.id,
          stripeCustomerId: customer.id,
        },
      })
    } else {
      await prisma.caller.update({
        where: { userId },
        data: { stripeAccountId: account.id },
      })
    }

    // Generate onboarding link
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
    const accountLink = await createAccountLink(account.id, returnUrl)

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe connect error:', error)
    return NextResponse.json({ error: 'Failed to create Stripe account' }, { status: 500 })
  }
}
