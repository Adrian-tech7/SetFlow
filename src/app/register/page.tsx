'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role')?.toUpperCase() === 'CALLER' ? 'CALLER' : 'BUSINESS'

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: defaultRole,
    companyName: '',
    displayName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
        return
      }

      toast.success('Account created! Signing you in...')
      // Auto sign in
      const { signIn } = await import('next-auth/react')
      await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      router.push('/dashboard')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-white font-bold text-2xl">SetFlow</span>
        </Link>
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-surface-400 mt-2">Start in under 2 minutes</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-900 border border-surface-800 rounded-2xl p-8 space-y-5">
        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3">
          {(['BUSINESS', 'CALLER'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setForm({ ...form, role })}
              className={`py-3 px-4 rounded-xl border-2 font-medium transition-all ${
                form.role === role
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600'
              }`}
            >
              {role === 'BUSINESS' ? 'I Have Leads' : 'I Set Appts'}
            </button>
          ))}
        </div>

        <div>
          <label className="label text-surface-300">Full Name</label>
          <input
            type="text"
            className="input !bg-surface-800 !border-surface-700 !text-white"
            placeholder="John Smith"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label text-surface-300">Email</label>
          <input
            type="email"
            className="input !bg-surface-800 !border-surface-700 !text-white"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="label text-surface-300">Password</label>
          <input
            type="password"
            className="input !bg-surface-800 !border-surface-700 !text-white"
            placeholder="Min 8 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
          />
        </div>

        {form.role === 'BUSINESS' && (
          <div>
            <label className="label text-surface-300">Company Name</label>
            <input
              type="text"
              className="input !bg-surface-800 !border-surface-700 !text-white"
              placeholder="Acme Inc."
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            />
          </div>
        )}

        {form.role === 'CALLER' && (
          <div>
            <label className="label text-surface-300">Display Name</label>
            <input
              type="text"
              className="input !bg-surface-800 !border-surface-700 !text-white"
              placeholder="How clients will see you"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-surface-400 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4 py-12">
      <Suspense fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <RegisterForm />
      </Suspense>
    </div>
  )
}
