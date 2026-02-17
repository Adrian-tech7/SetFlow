import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { leadPoolSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = { businessId }
    if (status) where.status = status

    const pools = await prisma.leadPool.findMany({
      where,
      include: {
        _count: {
          select: {
            leads: true,
            accessRequests: { where: { status: 'APPROVED' } } as any,
          },
        },
        leads: {
          select: { status: true },
        },
        accessRequests: {
          where: { status: 'APPROVED' },
          select: { callerId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const formattedPools = pools.map((pool) => ({
      id: pool.id,
      name: pool.name,
      industry: pool.industry,
      description: pool.description,
      payoutAmount: pool.payoutAmount,
      status: pool.status,
      maxCallers: pool.maxCallers,
      expiresAt: pool.expiresAt,
      tags: pool.tags,
      createdAt: pool.createdAt,
      updatedAt: pool.updatedAt,
      leadCount: pool.leads.length,
      availableLeadCount: pool.leads.filter((l) => l.status === 'AVAILABLE').length,
      activeCallerCount: new Set(pool.accessRequests.map((ar) => ar.callerId)).size,
    }))

    return NextResponse.json({ pools: formattedPools })
  } catch (error) {
    console.error('Lead pools list error:', error)
    return NextResponse.json({ error: 'Failed to fetch lead pools' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    if (!businessId) {
      return NextResponse.json({ error: 'Business profile not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = leadPoolSchema.parse(body)

    const pool = await prisma.leadPool.create({
      data: {
        businessId,
        name: data.name,
        industry: data.industry as any,
        description: data.description,
        payoutAmount: data.payoutAmount,
        maxCallers: data.maxCallers || 5,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        tags: data.tags || [],
      },
    })

    return NextResponse.json({ pool }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Lead pool create error:', error)
    return NextResponse.json({ error: 'Failed to create lead pool' }, { status: 500 })
  }
}
