import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TIER_CONFIG } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { appointmentId, bookingData } = body

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 })
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        business: true,
        caller: true,
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.status !== 'PENDING_VERIFICATION') {
      return NextResponse.json({ error: 'Appointment already processed' }, { status: 409 })
    }

    // Verify and update appointment
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'VERIFIED',
        verifiedAt: new Date(),
        webhookPayload: bookingData || {},
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        appointmentId,
        businessId: appointment.businessId,
        callerId: appointment.callerId,
        amount: appointment.businessCharge,
        platformFee: appointment.platformFee,
        callerPayout: appointment.callerPayout,
        status: 'PENDING',
      },
    })

    // Update caller stats
    await prisma.caller.update({
      where: { id: appointment.callerId },
      data: {
        totalAppointmentsSet: { increment: 1 },
      },
    })

    // Update business stats
    await prisma.business.update({
      where: { id: appointment.businessId },
      data: {
        totalAppointments: { increment: 1 },
      },
    })

    return NextResponse.json({ success: true, appointment: updated })
  } catch (error) {
    console.error('Booking webhook error:', error)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
