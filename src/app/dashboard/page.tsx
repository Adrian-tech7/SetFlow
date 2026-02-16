'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import StatCard from '@/components/ui/StatCard'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const name = session?.user?.name || 'there'

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Welcome back, {name}</h1>
        <p className="text-surface-500 mt-1">
          {role === 'BUSINESS' ? 'Manage your leads and track appointments' : 'Find leads and start setting appointments'}
        </p>
      </div>

      {role === 'BUSINESS' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Leads" value={stats?.totalLeads || 0} icon="📋" />
          <StatCard label="Available Leads" value={stats?.availableLeads || 0} icon="✅" />
          <StatCard label="Verified Appointments" value={stats?.verifiedAppointments || 0} icon="📅" />
          <StatCard label="Total Spent" value={formatCurrency(stats?.totalSpent || 0)} icon="💳" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Active Leads" value={stats?.activeLeads || 0} icon="📋" />
          <StatCard label="Appointments Set" value={stats?.verifiedAppointments || 0} icon="📅" />
          <StatCard label="Total Earnings" value={formatCurrency(stats?.totalEarnings || 0)} icon="💰" />
          <StatCard label="Avg Rating" value={stats?.avgRating?.toFixed(1) || '0.0'} icon="⭐" />
        </div>
      )}

      {!stats?.stripeOnboarded && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-yellow-800 font-semibold mb-2">⚠️ Connect Your Stripe Account</h3>
          <p className="text-yellow-700 text-sm mb-4">
            You need to connect Stripe to {role === 'BUSINESS' ? 'pay for appointments' : 'receive payouts'}.
          </p>
          <a href="/dashboard/settings" className="btn-primary text-sm !py-2 !px-4 !bg-yellow-600 hover:!bg-yellow-700">
            Go to Settings
          </a>
        </div>
      )}
    </div>
  )
}
