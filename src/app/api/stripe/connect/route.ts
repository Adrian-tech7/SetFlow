import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createConnectedAccount, createAccountLink } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = (session.user as any).role
    const userId = (session.user as any).id
    const email = session.user.email!

    const type = role === 'BUSINESS' ? 'business' : 'caller'
    const account = await createConnectedAccount(email, type)

    // Save Stripe account ID
    if (role === 'BUSINESS') {
      await prisma.business.update({
        where: { userId },
        data: { stripeAccountId: account.id },
      })
    } else {
      await prisma.caller.update({
        where: { userId },
        data: { stripeAccountId: account.id },
      })
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`
    const accountLink = await createAccountLink(account.id, returnUrl)

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Stripe connect error:', error)
    return NextResponse.json({ error: 'Failed to create Stripe account' }, { status: 500 })
  }
}
