import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    const { businessId, leadIds } = await req.json()

    if (!businessId || !leadIds?.length) {
      return NextResponse.json({ error: 'Missing businessId or leadIds' }, { status: 400 })
    }

    // Verify caller has Stripe connected
    const caller = await prisma.caller.findUnique({ where: { id: callerId } })
    if (!caller?.stripeOnboarded) {
      return NextResponse.json(
        { error: 'Connect your Stripe account first' },
        { status: 403 }
      )
    }

    // Verify leads belong to business and are available
    const leads = await prisma.lead.findMany({
      where: {
        id: { in: leadIds },
        businessId,
        status: 'AVAILABLE',
      },
    })

    if (leads.length === 0) {
      return NextResponse.json({ error: 'No available leads found' }, { status: 404 })
    }

    // Create lead assignments for the caller
    const assignments = await prisma.leadAssignment.createMany({
      data: leads.map((lead) => ({
        leadId: lead.id,
        callerId,
        status: 'ASSIGNED' as const,
      })),
      skipDuplicates: true,
    })

    return NextResponse.json({
      success: true,
      requested: assignments.count,
      message: 'Access request sent. Waiting for business approval.',
    })
  } catch (error) {
    console.error('Request access error:', error)
    return NextResponse.json({ error: 'Failed to request access' }, { status: 500 })
  }
}
