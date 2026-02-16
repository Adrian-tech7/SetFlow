'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const [connecting, setConnecting] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
  }, [])

  const connectStripe = async () => {
    setConnecting(true)
    try {
      const res = await fetch('/api/stripe/connect', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error('Failed to start Stripe onboarding')
      }
    } catch {
      toast.error('Connection failed')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500 mt-1">Manage your account and payment settings</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Profile */}
        <div className="card">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Profile</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-surface-500">Name</span>
              <span className="font-medium text-surface-900">{session?.user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Email</span>
              <span className="font-medium text-surface-900">{session?.user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Role</span>
              <span className="font-medium text-surface-900">{role === 'CALLER' ? 'Appointment Setter' : 'Business'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-500">Tier</span>
              <span className="font-medium text-surface-900">{stats?.tier || 'Basic'}</span>
            </div>
          </div>
        </div>

        {/* Stripe */}
        <div className="card">
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Payment Settings</h2>
          {stats?.stripeOnboarded ? (
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-medium text-green-800">Stripe Connected</p>
                <p className="text-sm text-green-600">
                  {role === 'BUSINESS' ? 'You can pay for verified appointments.' : 'You can receive payouts for appointments set.'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl mb-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium text-yellow-800">Stripe Not Connected</p>
                  <p className="text-sm text-yellow-600">
                    Connect Stripe to {role === 'BUSINESS' ? 'enable payments for appointments' : 'receive payouts'}.
                  </p>
                </div>
              </div>
              <button onClick={connectStripe} disabled={connecting} className="btn-primary">
                {connecting ? 'Connecting...' : '🔗 Connect Stripe Account'}
              </button>
            </div>
          )}
        </div>

        {/* Booking Link (Business only) */}
        {role === 'BUSINESS' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-surface-900 mb-4">Booking Link</h2>
            <p className="text-surface-500 text-sm mb-4">
              This is where callers will book appointments. Use your Calendly, Cal.com, or any scheduling tool link.
            </p>
            <input
              type="url"
              className="input"
              placeholder="https://calendly.com/your-link"
              defaultValue=""
            />
            <button className="btn-primary mt-4 text-sm">Save Booking Link</button>
          </div>
        )}
      </div>
    </div>
  )
}
