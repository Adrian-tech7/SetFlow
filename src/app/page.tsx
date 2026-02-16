import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-surface-950">
      {/* Nav */}
      <nav className="border-b border-surface-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-bold text-xl">SetFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-surface-400 hover:text-white transition-colors font-medium">
              Log In
            </Link>
            <Link href="/register" className="btn-primary text-sm !py-2.5 !px-5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
            <span className="text-primary-300 text-sm font-medium">Now in Beta</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Turn Unused Leads Into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
              Booked Appointments
            </span>
          </h1>
          <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The marketplace that connects businesses sitting on leads they can&apos;t call
            with independent appointment setters hungry to work. Pay only for verified appointments.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register?role=business" className="btn-primary text-lg !py-4 !px-8">
              I Have Leads
            </Link>
            <Link href="/register?role=caller" className="btn-secondary text-lg !py-4 !px-8 !bg-surface-800 !border-surface-700 !text-white hover:!bg-surface-700">
              I Set Appointments
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-16">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Upload Your Leads',
              desc: 'Businesses upload their unused lead lists via CSV. Set your tier and booking link.',
              icon: '📋',
            },
            {
              step: '02',
              title: 'Callers Get to Work',
              desc: 'Verified appointment setters request access, get approved, and start calling.',
              icon: '📞',
            },
            {
              step: '03',
              title: 'Get Paid Per Appointment',
              desc: 'When an appointment is booked and verified, payment splits automatically via Stripe.',
              icon: '💰',
            },
          ].map((item) => (
            <div key={item.step} className="bg-surface-900 border border-surface-800 rounded-2xl p-8">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-primary-400 text-sm font-mono mb-2">Step {item.step}</div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-surface-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Simple Pricing</h2>
        <p className="text-surface-400 text-center mb-16 text-lg">Pay per verified appointment. No monthly fees.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { tier: 'Basic', charge: '$75', payout: '$50', fee: '$25', color: 'surface-400', badge: '🟢' },
            { tier: 'Advanced', charge: '$100', payout: '$75', fee: '$25', color: 'primary-400', badge: '🔵' },
            { tier: 'Elite', charge: '$125', payout: '$100', fee: '$25', color: 'accent-400', badge: '⚡' },
          ].map((t) => (
            <div key={t.tier} className="bg-surface-900 border border-surface-800 rounded-2xl p-8 text-center">
              <div className="text-3xl mb-3">{t.badge}</div>
              <h3 className={`text-2xl font-bold text-${t.color} mb-6`}>{t.tier}</h3>
              <div className="space-y-3 text-surface-300">
                <p>Business pays: <span className="text-white font-semibold">{t.charge}</span></p>
                <p>Caller earns: <span className="text-white font-semibold">{t.payout}</span></p>
                <p>Platform fee: <span className="text-surface-500">{t.fee}</span></p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Setting?</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Whether you have leads gathering dust or you&apos;re ready to dial, SetFlow connects you.
          </p>
          <Link href="/register" className="bg-white text-surface-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-surface-100 transition-colors inline-block">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-800 mt-10">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <span className="text-surface-500 text-sm">&copy; 2026 SetFlow. All rights reserved.</span>
          <div className="flex gap-6 text-surface-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
