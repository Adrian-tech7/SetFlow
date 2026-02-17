import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    const { businessId } = await req.json()

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 })
    }

    // Check caller is not blocked by this business
    const blocked = await prisma.blockedCaller.findUnique({
      where: {
        businessId_callerId: { businessId, callerId },
      },
    })

    if (blocked) {
      return NextResponse.json({ error: 'You are blocked by this business' }, { status: 403 })
    }

    // Find active lead pools for this business
    const pools = await prisma.leadPool.findMany({
      where: {
        businessId,
        status: 'ACTIVE',
      },
      include: {
        business: {
          include: { user: { select: { id: true } } },
        },
        _count: {
          select: {
            accessRequests: { where: { status: 'APPROVED' } },
          },
        },
      },
    })

    if (pools.length === 0) {
      return NextResponse.json({ error: 'No active lead pools found for this business' }, { status: 404 })
    }

    // Check for existing pending or approved requests across all pools
    const existingRequests = await prisma.accessRequest.findMany({
      where: {
        callerId,
        businessId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      select: { leadPoolId: true, status: true },
    })

    const existingPoolIds = new Set(existingRequests.map((r) => r.leadPoolId))

    // Filter to pools without existing requests and that aren't full
    const eligiblePools = pools.filter(
      (pool) => !existingPoolIds.has(pool.id) && pool._count.accessRequests < pool.maxCallers
    )

    if (eligiblePools.length === 0) {
      const hasPending = existingRequests.some((r) => r.status === 'PENDING')
      return NextResponse.json(
        { error: hasPending ? 'You already have pending requests for this business' : 'All pools are full or you already have access' },
        { status: 409 }
      )
    }

    // Create access requests for all eligible pools
    const created = await Promise.all(
      eligiblePools.map((pool) =>
        prisma.accessRequest.create({
          data: {
            leadPoolId: pool.id,
            callerId,
            businessId,
          },
        })
      )
    )

    // Notify business
    const caller = await prisma.caller.findUnique({
      where: { id: callerId },
      select: { displayName: true },
    })

    const businessUserId = pools[0].business.user.id
    await createNotification(
      businessUserId,
      'ACCESS_REQUESTED',
      'New Access Request',
      `${caller?.displayName || 'A caller'} has requested access to ${created.length} lead pool(s).`,
      { callerId, businessId }
    )

    return NextResponse.json({
      success: true,
      requested: created.length,
      message: 'Access request sent. Waiting for business approval.',
    })
  } catch (error) {
    console.error('Request access error:', error)
    return NextResponse.json({ error: 'Failed to request access' }, { status: 500 })
  }
}
