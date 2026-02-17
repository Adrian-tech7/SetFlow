import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const status = searchParams.get('status')
    const poolId = searchParams.get('poolId')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '25')))

    // Exclude leads from businesses that have blocked this caller
    const blockedByBusinesses = await prisma.blockedCaller.findMany({
      where: { callerId },
      select: { businessId: true },
    })
    const blockedBusinessIds = blockedByBusinesses.map((b) => b.businessId)

    const where: any = {
      callerId,
      ...(blockedBusinessIds.length > 0 && {
        lead: { business: { id: { notIn: blockedBusinessIds } } },
      }),
    }

    if (status) {
      where.status = status
    }

    if (poolId) {
      where.lead = {
        ...where.lead,
        leadPoolId: poolId,
      }
    }

    if (search) {
      where.lead = {
        ...where.lead,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }
    }

    const [assignments, total] = await Promise.all([
      prisma.leadAssignment.findMany({
        where,
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
              leadPool: {
                select: {
                  id: true,
                  name: true,
                  payoutAmount: true,
                  business: {
                    select: {
                      companyName: true,
                      bookingLink: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.leadAssignment.count({ where }),
    ])

    return NextResponse.json({
      leads: assignments.map((assignment) => ({
        assignmentId: assignment.id,
        assignmentStatus: assignment.status,
        callerNotes: assignment.callerNotes,
        assignedAt: assignment.assignedAt,
        lead: {
          id: assignment.lead.id,
          name: assignment.lead.name,
          email: assignment.lead.email,
          phone: assignment.lead.phone,
          company: assignment.lead.company,
          industry: assignment.lead.industry,
          notes: assignment.lead.notes,
          tags: assignment.lead.tags,
          status: assignment.lead.status,
        },
        poolName: assignment.lead.leadPool?.name || null,
        poolId: assignment.lead.leadPool?.id || null,
        payoutAmount: assignment.lead.leadPool?.payoutAmount || null,
        businessName: assignment.lead.leadPool?.business.companyName || null,
        bookingLink: assignment.lead.leadPool?.business.bookingLink || null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Caller leads error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
