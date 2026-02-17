'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role
  const [connecting, setConnecting] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [bookingLink, setBookingLink] = useState('')
  const [savingLink, setSavingLink] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)

    if (role === 'BUSINESS') {
      fetch('/api/business/settings')
        .then((r) => r.json())
        .then((data) => {
          if (data.bookingLink) setBookingLink(data.bookingLink)
        })
        .catch(console.error)
    }
  }, [role])

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

  const saveBookingLink = async () => {
    if (!bookingLink) {
      toast.error('Please enter a booking link')
      return
    }

    setSavingLink(true)
    try {
      const res = await fetch('/api/business/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingLink }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Booking link saved')
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Failed to save booking link')
    } finally {
      setSavingLink(false)
    }
  }

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/booking`
    : ''

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    toast.success('Copied to clipboard')
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
              value={bookingLink}
              onChange={(e) => setBookingLink(e.target.value)}
            />
            <button
              onClick={saveBookingLink}
              disabled={savingLink}
              className="btn-primary mt-4 text-sm"
            >
              {savingLink ? 'Saving...' : 'Save Booking Link'}
            </button>
          </div>
        )}

        {/* Webhook URL (Business only) */}
        {role === 'BUSINESS' && (
          <div className="card">
            <h2 className="text-lg font-semibold text-surface-900 mb-4">Webhook Integration</h2>
            <p className="text-surface-500 text-sm mb-4">
              Add this webhook URL to your scheduling tool (Calendly, Cal.com, etc.) so SetFlow automatically detects when appointments are booked and processes payments.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="input flex-1 font-mono text-sm"
                value={webhookUrl}
                readOnly
              />
              <button
                onClick={copyWebhookUrl}
                className="btn-primary text-sm whitespace-nowrap"
              >
                Copy
              </button>
            </div>
            <div className="mt-4 p-4 bg-surface-50 rounded-xl">
              <p className="text-sm font-medium text-surface-700 mb-2">Setup Instructions:</p>
              <ol className="text-sm text-surface-500 space-y-1 list-decimal list-inside">
                <li>Go to your scheduling tool&apos;s webhook/integration settings</li>
                <li>Add a new webhook and paste the URL above</li>
                <li>Subscribe to &quot;booking created&quot; or &quot;invitee created&quot; events</li>
                <li>Save — SetFlow will now auto-verify appointments and process payments</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
