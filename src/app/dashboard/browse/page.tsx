'use client'

import { useState, useEffect } from 'react'
import TierBadge from '@/components/ui/TierBadge'
import EmptyState from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function BrowsePage() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/caller/browse')
      .then((r) => r.json())
      .then((data) => setBusinesses(data.businesses || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const requestAccess = async (businessId: string) => {
    try {
      const res = await fetch('/api/caller/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Request failed')
        return
      }
      toast.success('Access requested!')
    } catch {
      toast.error('Request failed')
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Browse Leads</h1>
        <p className="text-surface-500 mt-1">Find businesses with leads available for calling</p>
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No leads available"
          description="No businesses have uploaded leads yet. Check back soon!"
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz: any) => (
            <div key={biz.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-surface-900 text-lg">{biz.companyName}</h3>
                  {biz.industry && <p className="text-surface-500 text-sm">{biz.industry}</p>}
                </div>
                <TierBadge tier={biz.tier} size="sm" />
              </div>
              {biz.description && (
                <p className="text-surface-600 text-sm mb-4 line-clamp-2">{biz.description}</p>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-surface-100">
                <div className="text-sm">
                  <span className="text-surface-500">Available: </span>
                  <span className="font-semibold text-surface-900">{biz.availableLeads} leads</span>
                </div>
                <button onClick={() => requestAccess(biz.id)} className="btn-primary text-sm !py-2 !px-4">
                  Request Access
                </button>
              </div>
              {biz.avgRating > 0 && (
                <div className="mt-3 text-sm text-surface-500">
                  ⭐ {biz.avgRating.toFixed(1)} avg rating
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
