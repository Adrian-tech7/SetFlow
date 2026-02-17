import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { updateLeadStatusSchema } from '@/lib/validations'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { leadId: string } }
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

    const { leadId } = params
    const body = await req.json()

    const parsed = updateLeadStatusSchema.safeParse({ ...body, leadId })
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { status, notes } = parsed.data

    // Verify caller is assigned to this lead
    const assignment = await prisma.leadAssignment.findFirst({
      where: {
        leadId,
        callerId,
      },
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this lead' },
        { status: 403 }
      )
    }

    // Update lead assignment status and caller notes
    const updateData: any = {
      status,
    }
    if (notes !== undefined) {
      updateData.callerNotes = notes
    }

    const updatedAssignment = await prisma.leadAssignment.update({
      where: { id: assignment.id },
      data: updateData,
    })

    // Update the lead's own status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    })

    // If marking CONTACTED, increment caller's totalLeadsWorked
    if (status === 'CONTACTED') {
      await prisma.caller.update({
        where: { id: callerId },
        data: {
          totalLeadsWorked: { increment: 1 },
        },
      })
    }

    return NextResponse.json({
      success: true,
      assignment: {
        id: updatedAssignment.id,
        leadId: updatedAssignment.leadId,
        status: updatedAssignment.status,
        callerNotes: updatedAssignment.callerNotes,
        updatedAt: updatedAssignment.updatedAt,
      },
    })
  } catch (error) {
    console.error('Update lead status error:', error)
    return NextResponse.json(
      { error: 'Failed to update lead status' },
      { status: 500 }
    )
  }
}
