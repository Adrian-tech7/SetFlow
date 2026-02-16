'use client'

import { useState, useEffect } from 'react'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/business/leads')
      const data = await res.json()
      setLeads(data.leads || [])
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeads() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/business/leads/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Upload failed')
        return
      }

      toast.success(`Imported ${data.imported} leads!`)
      fetchLeads()
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">My Leads</h1>
          <p className="text-surface-500 mt-1">{leads.length} total leads</p>
        </div>
        <label className="btn-primary cursor-pointer">
          {uploading ? 'Uploading...' : '📤 Upload CSV'}
          <input type="file" accept=".csv" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No leads yet"
          description="Upload a CSV file with your leads to get started. Callers will request access to work them."
        />
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-surface-500 uppercase">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {leads.map((lead: any) => (
                <tr key={lead.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-surface-900">
                    {lead.firstName} {lead.lastName}
                  </td>
                  <td className="px-6 py-4 text-sm text-surface-600">{lead.company || '—'}</td>
                  <td className="px-6 py-4 text-sm text-surface-600">{lead.email || '—'}</td>
                  <td className="px-6 py-4"><StatusBadge status={lead.status} /></td>
                  <td className="px-6 py-4 text-sm text-surface-600">
                    {lead.assignedTo?.displayName || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
