import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const accessRequests = await prisma.accessRequest.findMany({
      where: { callerId },
      include: {
        leadPool: {
          select: {
            id: true,
            name: true,
            industry: true,
            payoutAmount: true,
            status: true,
          },
        },
        business: {
          select: {
            companyName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      accessRequests: accessRequests.map((request) => ({
        id: request.id,
        status: request.status,
        message: request.message,
        respondedAt: request.respondedAt,
        createdAt: request.createdAt,
        pool: {
          id: request.leadPool.id,
          name: request.leadPool.name,
          industry: request.leadPool.industry,
          payoutAmount: request.leadPool.payoutAmount,
          status: request.leadPool.status,
        },
        businessName: request.business.companyName,
      })),
    })
  } catch (error) {
    console.error('Caller access requests error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch access requests' },
      { status: 500 }
    )
  }
}
