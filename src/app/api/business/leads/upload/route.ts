import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parse } from 'csv-parse/sync'
import { leadUploadSchema } from '@/lib/validations'
import { randomUUID } from 'crypto'

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

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    const batchId = randomUUID()
    const leads = []
    const errors = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]
      // Map common CSV column names
      const mapped = {
        firstName: record.firstName || record.first_name || record['First Name'] || '',
        lastName: record.lastName || record.last_name || record['Last Name'] || '',
        email: record.email || record.Email || '',
        phone: record.phone || record.Phone || record.phone_number || '',
        company: record.company || record.Company || record.organization || '',
        title: record.title || record.Title || record.job_title || '',
        source: record.source || record.Source || '',
        notes: record.notes || record.Notes || '',
      }

      try {
        const validated = leadUploadSchema.parse(mapped)
        leads.push({
          ...validated,
          businessId,
          batchId,
          email: validated.email || null,
          phone: validated.phone || null,
          company: validated.company || null,
          title: validated.title || null,
          source: validated.source || null,
          notes: validated.notes || null,
        })
      } catch {
        errors.push({ row: i + 2, data: record })
      }
    }

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found in CSV', errors },
        { status: 400 }
      )
    }

    const created = await prisma.lead.createMany({ data: leads })

    // Update business lead count
    await prisma.business.update({
      where: { id: businessId },
      data: { totalLeadsUploaded: { increment: created.count } },
    })

    return NextResponse.json({
      success: true,
      imported: created.count,
      failed: errors.length,
      batchId,
      errors: errors.slice(0, 10), // Show first 10 errors
    })
  } catch (error: any) {
    console.error('Lead upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload leads' },
      { status: 500 }
    )
  }
}
