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
    if (!session?.user || (session.user as any).role !== 'CALLER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const callerId = (session.user as any).callerId
    if (!callerId) {
      return NextResponse.json({ error: 'Caller profile not found' }, { status: 403 })
    }

    const { poolId } = params

    // Verify caller has APPROVED access to this pool
    const accessRequest = await prisma.accessRequest.findFirst({
      where: {
        leadPoolId: poolId,
        callerId,
        status: 'APPROVED',
      },
    })

    if (!accessRequest) {
      return NextResponse.json(
        { error: 'You do not have approved access to this pool' },
        { status: 403 }
      )
    }

    // Fetch pool details with leads assigned to this caller
    const pool = await prisma.leadPool.findUnique({
      where: { id: poolId },
      include: {
        business: {
          select: {
            companyName: true,
            bookingLink: true,
            industry: true,
          },
        },
      },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 })
    }

    // Get leads assigned to this caller in this pool
    const leadAssignments = await prisma.leadAssignment.findMany({
      where: {
        callerId,
        lead: {
          leadPoolId: poolId,
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
            industry: true,
            notes: true,
            tags: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    })

    return NextResponse.json({
      pool: {
        id: pool.id,
        name: pool.name,
        industry: pool.industry,
        description: pool.description,
        payoutAmount: pool.payoutAmount,
        tags: pool.tags,
        status: pool.status,
        businessName: pool.business.companyName,
        bookingLink: pool.business.bookingLink,
        businessIndustry: pool.business.industry,
      },
      leads: leadAssignments.map((assignment) => ({
        assignmentId: assignment.id,
        assignmentStatus: assignment.status,
        callerNotes: assignment.callerNotes,
        assignedAt: assignment.assignedAt,
        lead: assignment.lead,
      })),
      totalLeads: leadAssignments.length,
    })
  } catch (error) {
    console.error('Pool detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pool details' },
      { status: 500 }
    )
  }
}
