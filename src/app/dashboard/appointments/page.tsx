'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import StatusBadge from '@/components/ui/StatusBadge'
import TierBadge from '@/components/ui/TierBadge'
import EmptyState from '@/components/ui/EmptyState'
import { formatDateTime, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AppointmentsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/appointments')
      .then((r) => r.json())
      .then((data) => setAppointments(data.appointments || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Appointments</h1>
        <p className="text-surface-500 mt-1">{appointments.length} total appointments</p>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No appointments yet"
          description={role === 'BUSINESS' ? 'Appointments will appear here when callers book them.' : 'Start calling leads to book appointments.'}
        />
      ) : (
        <div className="space-y-4">
          {appointments.map((appt: any) => (
            <div key={appt.id} className="card flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-surface-900">
                    {appt.lead?.name || 'Unknown Lead'}
                  </h3>
                  <StatusBadge status={appt.status} />
                  <TierBadge tier={appt.callerTier} size="sm" />
                </div>
                <div className="flex items-center gap-4 text-sm text-surface-500">
                  <span>📅 {formatDateTime(appt.scheduledAt)}</span>
                  {role === 'BUSINESS' && <span>📞 {appt.caller?.displayName}</span>}
                  {role === 'CALLER' && <span>🏢 {appt.business?.companyName}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-surface-900">
                  {formatCurrency(role === 'BUSINESS' ? appt.totalCharge : appt.payoutAmount)}
                </div>
                <div className="text-xs text-surface-500">
                  {role === 'BUSINESS' ? 'charge' : 'payout'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
