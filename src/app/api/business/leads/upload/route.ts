import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parse } from 'csv-parse/sync'
import { leadUploadSchema } from '@/lib/validations'

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
    const poolId = formData.get('poolId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!poolId) {
      return NextResponse.json({ error: 'Pool ID is required' }, { status: 400 })
    }

    // Verify the pool belongs to this business
    const pool = await prisma.leadPool.findFirst({
      where: { id: poolId, businessId },
    })

    if (!pool) {
      return NextResponse.json({ error: 'Lead pool not found' }, { status: 404 })
    }

    const text = await file.text()
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    const leads: any[] = []
    const errors: { row: number; message: string }[] = []

    for (let i = 0; i < records.length; i++) {
      const record = records[i]

      // Flexible column mapping
      const mapped = {
        name: record.Name || record.name || record['Full Name'] || record.full_name || '',
        email: record.Email || record.email || record.EMAIL || '',
        phone: record.Phone || record.phone || record.PHONE || record.phone_number || '',
        company: record.Company || record.company || record.COMPANY || record.organization || '',
        industry: record.Industry || record.industry || '',
        source: record.Source || record.source || '',
        notes: record.Notes || record.notes || '',
      }

      const result = leadUploadSchema.safeParse(mapped)

      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message).join(', ')
        errors.push({ row: i + 2, message: messages })
        continue
      }

      leads.push({
        businessId,
        leadPoolId: poolId,
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        company: result.data.company,
        industry: result.data.industry || null,
        source: result.data.source || null,
        notes: result.data.notes || null,
        status: 'AVAILABLE',
      })
    }

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'No valid leads found in CSV', errors, imported: 0, total: records.length },
        { status: 400 }
      )
    }

    const created = await prisma.lead.createMany({ data: leads })

    // Increment business totalLeadsUploaded
    await prisma.business.update({
      where: { id: businessId },
      data: { totalLeadsUploaded: { increment: created.count } },
    })

    return NextResponse.json({
      imported: created.count,
      errors: errors.slice(0, 50),
      total: records.length,
    })
  } catch (error) {
    console.error('Lead upload error:', error)
    return NextResponse.json({ error: 'Failed to upload leads' }, { status: 500 })
  }
}
