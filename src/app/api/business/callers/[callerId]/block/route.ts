import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: { callerId: string } }
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

    const body = await req.json().catch(() => ({}))
    const reason = body.reason || null

    // Check if already blocked
    const existingBlock = await prisma.blockedCaller.findUnique({
      where: {
        businessId_callerId: {
          businessId,
          callerId: params.callerId,
        },
      },
    })

    if (existingBlock) {
      return NextResponse.json({ error: 'Caller is already blocked' }, { status: 409 })
    }

    // Create block record and revoke all access in a transaction
    await prisma.$transaction([
      prisma.blockedCaller.create({
        data: {
          businessId,
          callerId: params.callerId,
          reason,
        },
      }),
      prisma.accessRequest.updateMany({
        where: {
          businessId,
          callerId: params.callerId,
          status: { in: ['APPROVED', 'PENDING'] },
        },
        data: { status: 'REVOKED', respondedAt: new Date() },
      }),
    ])

    // Notify the caller
    const caller = await prisma.caller.findUnique({
      where: { id: params.callerId },
      select: { userId: true },
    })

    if (caller) {
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { companyName: true },
      })

      await createNotification(
        caller.userId,
        'ACCESS_REVOKED',
        'Access Blocked',
        `${business?.companyName || 'A business'} has blocked you from their lead pools.`,
        { businessId, reason }
      )
    }

    return NextResponse.json({ message: 'Caller blocked successfully' })
  } catch (error) {
    console.error('Block caller error:', error)
    return NextResponse.json({ error: 'Failed to block caller' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { callerId: string } }
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

    const existingBlock = await prisma.blockedCaller.findUnique({
      where: {
        businessId_callerId: {
          businessId,
          callerId: params.callerId,
        },
      },
    })

    if (!existingBlock) {
      return NextResponse.json({ error: 'Caller is not blocked' }, { status: 404 })
    }

    await prisma.blockedCaller.delete({
      where: {
        businessId_callerId: {
          businessId,
          callerId: params.callerId,
        },
      },
    })

    return NextResponse.json({ message: 'Caller unblocked successfully' })
  } catch (error) {
    console.error('Unblock caller error:', error)
    return NextResponse.json({ error: 'Failed to unblock caller' }, { status: 500 })
  }
}
