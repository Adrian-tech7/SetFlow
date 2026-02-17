import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { poolId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const pool = await prisma.leadPool.findFirst({
      where: { id: params.poolId, businessId },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignments: {
              include: {
                caller: {
                  select: { id: true, displayName: true, tier: true },
                },
              },
            },
          },
        },
        accessRequests: {
          include: {
            caller: {
              select: {
                id: true,
                displayName: true,
                tier: true,
                conversionRate: true,
                avgRating: true,
                totalAppointments: true,
                nicheExpertise: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...pool,
      leadCount: pool.leads.length,
      availableLeadCount: pool.leads.filter((l) => l.status === 'AVAILABLE').length,
      activeCallerCount: pool.accessRequests.filter((ar) => ar.status === 'APPROVED').length,
    })
  } catch (error) {
    console.error('Lead pool detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch lead pool' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { poolId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const pool = await prisma.leadPool.findFirst({
      where: { id: params.poolId, businessId },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, description, payoutAmount, status, maxCallers, tags } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (payoutAmount !== undefined) {
      if (payoutAmount < 25 || payoutAmount > 500) {
        return NextResponse.json({ error: 'Payout amount must be between $25 and $500' }, { status: 400 })
      }
      updateData.payoutAmount = payoutAmount
    }
    if (maxCallers !== undefined) updateData.maxCallers = maxCallers
    if (tags !== undefined) updateData.tags = tags

    if (status !== undefined && status !== pool.status) {
      updateData.status = status
      // If pausing or freezing, no additional side effects needed beyond the status change
      // The status itself prevents new access requests and lead assignments
    }

    const updatedPool = await prisma.leadPool.update({
      where: { id: params.poolId },
      data: updateData,
    })

    return NextResponse.json({ pool: updatedPool })
  } catch (error) {
    console.error('Lead pool update error:', error)
    return NextResponse.json({ error: 'Failed to update lead pool' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { poolId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const pool = await prisma.leadPool.findFirst({
      where: { id: params.poolId, businessId },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 })
    }

    // Check for active appointments linked to leads in this pool
    const activeAppointments = await prisma.appointment.count({
      where: {
        lead: { leadPoolId: params.poolId },
        status: { in: ['PENDING_VERIFICATION', 'VERIFIED'] },
      },
    })

    if (activeAppointments > 0) {
      // Soft-freeze instead of deleting
      await prisma.leadPool.update({
        where: { id: params.poolId },
        data: { status: 'FROZEN' },
      })

      return NextResponse.json({
        message: 'Pool has active appointments and has been frozen instead of deleted',
        frozen: true,
      })
    }

    await prisma.leadPool.delete({
      where: { id: params.poolId },
    })

    return NextResponse.json({ message: 'Lead pool deleted successfully' })
  } catch (error) {
    console.error('Lead pool delete error:', error)
    return NextResponse.json({ error: 'Failed to delete lead pool' }, { status: 500 })
  }
}
