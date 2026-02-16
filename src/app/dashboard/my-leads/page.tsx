'use client'

import { useState, useEffect } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function MyLeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/caller/browse')
      .then((r) => r.json())
      .then((data) => setLeads(data.businesses || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">My Assignments</h1>
        <p className="text-surface-500 mt-1">Leads assigned to you for calling</p>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No assignments yet"
          description="Browse available leads and request access to start working."
          action={{ label: 'Browse Leads', href: '/dashboard/browse' }}
        />
      ) : (
        <div className="space-y-4">
          {leads.map((biz: any) => (
            <div key={biz.id} className="card">
              <h3 className="font-semibold text-surface-900">{biz.companyName}</h3>
              <p className="text-sm text-surface-500">{biz.industry} · {biz.availableLeads} leads available</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
