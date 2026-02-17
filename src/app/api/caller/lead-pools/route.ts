import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { accessRequestSchema } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const industry = searchParams.get('industry')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    // Get pools where caller is blocked
    const blockedByBusinessIds = await prisma.blockedCaller.findMany({
      where: { callerId },
      select: { businessId: true },
    })
    const blockedBusinessIds = blockedByBusinessIds.map((b) => b.businessId)

    const where: any = {
      status: 'ACTIVE',
      business: {
        id: { notIn: blockedBusinessIds },
      },
    }

    if (industry) {
      where.industry = industry
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { business: { companyName: { contains: search, mode: 'insensitive' } } },
        { tags: { has: search } },
      ]
    }

    const [pools, total] = await Promise.all([
      prisma.leadPool.findMany({
        where,
        include: {
          business: {
            select: {
              companyName: true,
              avgRating: true,
            },
          },
          _count: {
            select: {
              leads: true,
              accessRequests: {
                where: { status: 'APPROVED' },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leadPool.count({ where }),
    ])

    // Filter out full pools (activeCallers >= maxCallers)
    const availablePools = pools.filter(
      (pool) => pool._count.accessRequests < pool.maxCallers
    )

    return NextResponse.json({
      pools: availablePools.map((pool) => ({
        id: pool.id,
        name: pool.name,
        industry: pool.industry,
        description: pool.description,
        payoutAmount: pool.payoutAmount,
        leadCount: pool._count.leads,
        activeCallers: pool._count.accessRequests,
        maxCallers: pool.maxCallers,
        tags: pool.tags,
        businessName: pool.business.companyName,
        businessAvgRating: pool.business.avgRating,
        createdAt: pool.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Browse lead pools error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lead pools' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = accessRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { leadPoolId, message } = parsed.data

    // Verify pool exists and is active
    const pool = await prisma.leadPool.findUnique({
      where: { id: leadPoolId },
      include: {
        business: {
          include: {
            user: { select: { id: true } },
          },
        },
        _count: {
          select: {
            accessRequests: { where: { status: 'APPROVED' } },
          },
        },
      },
    })

    if (!pool || pool.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Lead pool not found or inactive' }, { status: 404 })
    }

    // Check pool is not full
    if (pool._count.accessRequests >= pool.maxCallers) {
      return NextResponse.json({ error: 'This lead pool is full' }, { status: 409 })
    }

    // Check caller is not blocked by this business
    const blocked = await prisma.blockedCaller.findUnique({
      where: {
        businessId_callerId: {
          businessId: pool.businessId,
          callerId,
        },
      },
    })

    if (blocked) {
      return NextResponse.json(
        { error: 'You are blocked by this business' },
        { status: 403 }
      )
    }

    // Check for existing pending or approved request
    const existingRequest = await prisma.accessRequest.findFirst({
      where: {
        leadPoolId,
        callerId,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    })

    if (existingRequest) {
      return NextResponse.json(
        {
          error:
            existingRequest.status === 'PENDING'
              ? 'You already have a pending request for this pool'
              : 'You already have access to this pool',
        },
        { status: 409 }
      )
    }

    // Create access request
    const accessRequest = await prisma.accessRequest.create({
      data: {
        leadPoolId,
        callerId,
        businessId: pool.businessId,
        message: message || null,
      },
    })

    // Notify business
    const caller = await prisma.caller.findUnique({
      where: { id: callerId },
      select: { displayName: true },
    })

    await createNotification(
      pool.business.user.id,
      'ACCESS_REQUESTED',
      'New Access Request',
      `${caller?.displayName || 'A caller'} has requested access to "${pool.name}".`,
      { accessRequestId: accessRequest.id, poolId: pool.id, callerId }
    )

    return NextResponse.json({
      success: true,
      accessRequest: {
        id: accessRequest.id,
        status: accessRequest.status,
        createdAt: accessRequest.createdAt,
      },
      message: 'Access request submitted. Waiting for business approval.',
    })
  } catch (error) {
    console.error('Request pool access error:', error)
    return NextResponse.json(
      { error: 'Failed to submit access request' },
      { status: 500 }
    )
  }
}
