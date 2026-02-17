'use client'

import { useState, useEffect } from 'react'
import EmptyState from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function AccessRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/business/access-requests?status=PENDING')
      const data = await res.json()
      setRequests(data.accessRequests || [])
    } catch {
      toast.error('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/business/access-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      if (!res.ok) {
        toast.error('Action failed')
        return
      }
      toast.success(action === 'approve' ? 'Access approved!' : 'Access rejected')
      fetchRequests()
    } catch {
      toast.error('Action failed')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Access Requests</h1>
        <p className="text-surface-500 mt-1">Approve or deny caller requests to work your leads</p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon="🔑"
          title="No pending requests"
          description="When callers request access to your lead pools, they'll appear here."
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req: any) => (
            <div key={req.id} className="card flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-surface-900">{req.caller?.displayName}</h3>
                <p className="text-sm text-surface-500">
                  Pool: {req.leadPool?.name}
                  {req.message && ` — "${req.message}"`}
                </p>
                <div className="flex gap-3 mt-1 text-xs text-surface-400">
                  {req.caller?.tier && <span>Tier: {req.caller.tier}</span>}
                  {req.caller?.avgRating > 0 && <span>Rating: {req.caller.avgRating.toFixed(1)}</span>}
                  {req.caller?.totalAppointments > 0 && <span>{req.caller.totalAppointments} appointments</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(req.id, 'approve')}
                  className="btn-primary text-sm !py-2 !px-4"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction(req.id, 'reject')}
                  className="btn-secondary text-sm !py-2 !px-4"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
