import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    const { assignmentIds, action } = await req.json()

    if (!assignmentIds?.length || !['approve', 'deny'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    if (action === 'approve') {
      await prisma.$transaction([
        prisma.leadAssignment.updateMany({
          where: {
            id: { in: assignmentIds },
            businessId,
          },
          data: { isActive: true },
        }),
        prisma.lead.updateMany({
          where: {
            assignments: {
              some: {
                id: { in: assignmentIds },
                businessId,
              },
            },
          },
          data: { status: 'ASSIGNED' },
        }),
      ])
    } else {
      await prisma.leadAssignment.deleteMany({
        where: {
          id: { in: assignmentIds },
          businessId,
        },
      })
    }

    return NextResponse.json({
      success: true,
      action,
      count: assignmentIds.length,
    })
  } catch (error) {
    console.error('Approve access error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
