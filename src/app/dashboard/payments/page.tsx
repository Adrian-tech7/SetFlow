'use client'

import { useState, useEffect } from 'react'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import EmptyState from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const [stats, setStats] = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/stats').then((r) => r.json()),
      fetch('/api/appointments').then((r) => r.json()),
    ])
      .then(([s, a]) => {
        setStats(s)
        setAppointments(a.appointments || [])
      })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Payments</h1>
        <p className="text-surface-500 mt-1">Track your appointment costs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Spent" value={formatCurrency(stats?.totalSpent || 0)} icon="💳" />
        <StatCard label="Total Appointments" value={stats?.totalAppointments || 0} icon="📅" />
        <StatCard label="Verified" value={stats?.verifiedAppointments || 0} icon="✅" />
      </div>

      <h2 className="text-lg font-semibold text-surface-900 mb-4">Payment History</h2>
      {appointments.length === 0 ? (
        <EmptyState
          icon="💳"
          title="No payments yet"
          description="Payments will appear here when callers book verified appointments."
        />
      ) : (
        <div className="space-y-3">
          {appointments.map((appt: any) => (
            <div key={appt.id} className="card flex items-center justify-between">
              <div>
                <h3 className="font-medium text-surface-900">{appt.leadFirstName} {appt.leadLastName}</h3>
                <p className="text-sm text-surface-500">
                  {appt.caller?.displayName} · {formatDateTime(appt.scheduledAt)}
                </p>
              </div>
              <div className="text-right">
                <div className="font-bold text-surface-900">{formatCurrency(appt.businessCharge)}</div>
                <StatusBadge status={appt.payment?.status || appt.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
