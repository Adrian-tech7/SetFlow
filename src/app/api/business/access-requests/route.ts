import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notifyAccessResponse } from '@/lib/notifications'

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

    const accessRequests = await prisma.accessRequest.findMany({
      where,
      include: {
        caller: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            tier: true,
            conversionRate: true,
            avgRating: true,
            totalAppointments: true,
            totalLeadsWorked: true,
            nicheExpertise: true,
            salesExperience: true,
          },
        },
        leadPool: {
          select: {
            id: true,
            name: true,
            payoutAmount: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ accessRequests })
  } catch (error) {
    console.error('Access requests list error:', error)
    return NextResponse.json({ error: 'Failed to fetch access requests' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
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
    const { requestId, action } = body

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request. Provide requestId and action (approve/reject)' }, { status: 400 })
    }

    const accessRequest = await prisma.accessRequest.findFirst({
      where: { id: requestId, businessId, status: 'PENDING' },
      include: {
        caller: {
          include: {
            user: { select: { id: true } },
          },
        },
        leadPool: {
          select: { id: true, name: true },
          },
      },
    })

    if (!accessRequest) {
      return NextResponse.json({ error: 'Access request not found or already processed' }, { status: 404 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { companyName: true },
    })

    if (action === 'approve') {
      // Update access request status
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', respondedAt: new Date() },
      })

      // Create LeadAssignments for all AVAILABLE leads in that pool for this caller
      const availableLeads = await prisma.lead.findMany({
        where: {
          leadPoolId: accessRequest.leadPoolId,
          status: 'AVAILABLE',
        },
        select: { id: true },
      })

      if (availableLeads.length > 0) {
        await prisma.leadAssignment.createMany({
          data: availableLeads.map((lead) => ({
            leadId: lead.id,
            callerId: accessRequest.callerId,
            status: 'ASSIGNED' as const,
          })),
          skipDuplicates: true,
        })
      }

      // Notify caller
      await notifyAccessResponse(
        accessRequest.caller.user.id,
        business?.companyName || 'Business',
        accessRequest.leadPool.name,
        true
      )

      return NextResponse.json({
        message: 'Access request approved',
        leadsAssigned: availableLeads.length,
      })
    } else {
      // Reject
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', respondedAt: new Date() },
      })

      // Notify caller
      await notifyAccessResponse(
        accessRequest.caller.user.id,
        business?.companyName || 'Business',
        accessRequest.leadPool.name,
        false
      )

      return NextResponse.json({ message: 'Access request rejected' })
    }
  } catch (error) {
    console.error('Access request action error:', error)
    return NextResponse.json({ error: 'Failed to process access request' }, { status: 500 })
  }
}
