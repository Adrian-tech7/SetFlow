import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { disputeSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'BUSINESS') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = (session.user as any).businessId
    const body = await req.json()
    const data = disputeSchema.parse(body)

    const appointment = await prisma.appointment.findFirst({
      where: { id: data.appointmentId, businessId },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    const existing = await prisma.dispute.findUnique({
      where: { appointmentId: data.appointmentId },
    })
    if (existing) {
      return NextResponse.json({ error: 'Dispute already exists' }, { status: 409 })
    }

    const dispute = await prisma.dispute.create({
      data: {
        appointmentId: data.appointmentId,
        businessId,
        callerId: appointment.callerId,
        reason: data.reason,
        description: data.description,
        evidence: data.evidence,
      },
    })

    // Mark appointment as disputed
    await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { status: 'DISPUTED' },
    })

    // Increment business dispute count
    await prisma.business.update({
      where: { id: businessId },
      data: { disputeCount: { increment: 1 } },
    })

    return NextResponse.json({ dispute }, { status: 201 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }
    console.error('Dispute error:', error)
    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 })
  }
}
