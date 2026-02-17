import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { notifyAccessResponse } from '@/lib/notifications'

// Legacy endpoint - redirects to /api/business/access-requests PATCH logic
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

    const { requestId, action } = await req.json()

    if (!requestId || !['approve', 'deny', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const normalizedAction = action === 'deny' ? 'reject' : action

    const accessRequest = await prisma.accessRequest.findFirst({
      where: { id: requestId, businessId, status: 'PENDING' },
      include: {
        caller: {
          include: { user: { select: { id: true } } },
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

    if (normalizedAction === 'approve') {
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED', respondedAt: new Date() },
      })

      const availableLeads = await prisma.lead.findMany({
        where: { leadPoolId: accessRequest.leadPoolId, status: 'AVAILABLE' },
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

      await notifyAccessResponse(
        accessRequest.caller.user.id,
        business?.companyName || 'Business',
        accessRequest.leadPool.name,
        true
      )

      return NextResponse.json({ success: true, action: 'approve', leadsAssigned: availableLeads.length })
    } else {
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED', respondedAt: new Date() },
      })

      await notifyAccessResponse(
        accessRequest.caller.user.id,
        business?.companyName || 'Business',
        accessRequest.leadPool.name,
        false
      )

      return NextResponse.json({ success: true, action: 'reject' })
    }
  } catch (error) {
    console.error('Approve access error:', error)
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 })
  }
}
