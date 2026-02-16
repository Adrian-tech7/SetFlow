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
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
            <span className="text-primary-300 text-sm font-medium">Built for AI Agencies</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Your AI Solution Sells Itself.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
              You Just Need More Demos.
            </span>
          </h1>
          <p className="text-xl text-surface-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SetFlow connects AI agencies with independent appointment setters who book qualified demos 
            with businesses that need your services. Pay only when a meeting is verified. No retainers. No SDR salaries.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register?role=business" className="btn-primary text-lg !py-4 !px-8">
              I Run an AI Agency
            </Link>
            <Link href="/register?role=caller" className="btn-secondary text-lg !py-4 !px-8 !bg-surface-800 !border-surface-700 !text-white hover:!bg-surface-700">
              I Set Appointments
            </Link>
          </div>
          <p className="text-surface-500 text-sm mt-6">Join 50+ AI agencies launching this month</p>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">The AI Agency Bottleneck</h2>
            <div className="space-y-4 text-surface-400">
              <p className="flex items-start gap-3">
                <span className="text-red-400 text-xl mt-0.5">✕</span>
                You&apos;re spending 60% of your time prospecting instead of building AI solutions
              </p>
              <p className="flex items-start gap-3">
                <span className="text-red-400 text-xl mt-0.5">✕</span>
                Hiring an SDR costs $4-5K/month with no guarantee they perform
              </p>
              <p className="flex items-start gap-3">
                <span className="text-red-400 text-xl mt-0.5">✕</span>
                Lead gen agencies charge $3K+ retainers regardless of results
              </p>
              <p className="flex items-start gap-3">
                <span className="text-red-400 text-xl mt-0.5">✕</span>
                Cold leads go stale while you&apos;re busy delivering for current clients
              </p>
            </div>
          </div>
          <div className="bg-surface-900 border border-surface-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-6">SetFlow Fixes This</h3>
            <div className="space-y-4 text-surface-400">
              <p className="flex items-start gap-3">
                <span className="text-accent-400 text-xl mt-0.5">✓</span>
                Independent setters work YOUR leads on commission — no salary, no retainer
              </p>
              <p className="flex items-start gap-3">
                <span className="text-accent-400 text-xl mt-0.5">✓</span>
                Pay only when an appointment is verified and confirmed
              </p>
              <p className="flex items-start gap-3">
                <span className="text-accent-400 text-xl mt-0.5">✓</span>
                Stripe handles all payments automatically — no invoicing headaches
              </p>
              <p className="flex items-start gap-3">
                <span className="text-accent-400 text-xl mt-0.5">✓</span>
                You focus on delivering AI solutions. We fill your calendar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">How It Works</h2>
        <p className="text-surface-400 text-center mb-16 text-lg">From signup to booked demos in under a week</p>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Upload Your Leads',
              desc: 'Drop in your prospect CSV — businesses that need AI solutions. We help you organize and tier them.',
              icon: '📋',
            },
            {
              step: '02',
              title: 'Setters Request Access',
              desc: 'Vetted appointment setters browse your leads and request permission to start calling.',
              icon: '🙋',
            },
            {
              step: '03',
              title: 'Demos Get Booked',
              desc: 'Setters call your leads, pitch your AI services, and book demos on YOUR calendar link.',
              icon: '📅',
            },
            {
              step: '04',
              title: 'Pay Per Result',
              desc: 'Appointment verified? Payment splits automatically via Stripe. No manual invoicing.',
              icon: '💰',
            },
          ].map((item) => (
            <div key={item.step} className="bg-surface-900 border border-surface-800 rounded-2xl p-8">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-primary-400 text-sm font-mono mb-2">Step {item.step}</div>
              <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
              <p className="text-surface-400 leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof / Use Cases */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-16">Built for AI Agencies Like Yours</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              type: 'AI Automation Agency',
              desc: 'You build Make/n8n/Zapier workflows for businesses. You need 20+ demos/month to hit your revenue goals. SetFlow gets them booked.',
              icon: '⚡',
            },
            {
              type: 'AI Chatbot Agency',
              desc: 'You build AI chatbots for dentists, plumbers, and service businesses. Every local business is a potential client — you just need someone calling them.',
              icon: '🤖',
            },
            {
              type: 'AI Voice Agent Company',
              desc: 'You sell AI phone answering and appointment booking. The irony? You need humans to book YOUR demos. Let SetFlow handle that.',
              icon: '📞',
            },
          ].map((item) => (
            <div key={item.type} className="bg-surface-900 border border-surface-800 rounded-2xl p-8">
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{item.type}</h3>
              <p className="text-surface-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-white text-center mb-4">Simple, Pay-Per-Result Pricing</h2>
        <p className="text-surface-400 text-center mb-16 text-lg">No monthly fees. No contracts. Pay only when demos are booked.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { tier: 'Starter', charge: '$75', payout: '$50', fee: '$25', desc: 'Perfect for agencies just starting to scale', color: 'surface-400', badge: '🟢' },
            { tier: 'Growth', charge: '$100', payout: '$75', fee: '$25', desc: 'For agencies booking 20+ demos/month', color: 'primary-400', badge: '🔵' },
            { tier: 'Scale', charge: '$125', payout: '$100', fee: '$25', desc: 'Premium setters for high-ticket AI services', color: 'accent-400', badge: '⚡' },
          ].map((t) => (
            <div key={t.tier} className={`bg-surface-900 border rounded-2xl p-8 text-center ${t.tier === 'Growth' ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-surface-800'}`}>
              {t.tier === 'Growth' && (
                <div className="text-primary-400 text-xs font-bold uppercase tracking-wider mb-4">Most Popular</div>
              )}
              <div className="text-3xl mb-3">{t.badge}</div>
              <h3 className={`text-2xl font-bold text-${t.color} mb-2`}>{t.tier}</h3>
              <p className="text-surface-500 text-sm mb-6">{t.desc}</p>
              <div className="space-y-3 text-surface-300">
                <p>Per appointment: <span className="text-white font-semibold">{t.charge}</span></p>
                <p>Setter earns: <span className="text-white font-semibold">{t.payout}</span></p>
                <p className="text-surface-500 text-sm">Platform fee: {t.fee}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-surface-500 mt-8 text-sm">
          Compare: hiring an SDR at $4,500/month who books 15 meetings = $300/meeting. SetFlow = $75-125/meeting. Do the math.
        </p>
      </section>

      {/* For Setters */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-surface-900 border border-surface-800 rounded-3xl p-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-primary-400 text-sm font-bold uppercase tracking-wider mb-4">For Appointment Setters</div>
              <h2 className="text-3xl font-bold text-white mb-4">Get Paid to Book Demos for AI Companies</h2>
              <p className="text-surface-400 leading-relaxed mb-6">
                No salary cap. No boss. No commute. Pick your leads, set your hours, and earn $50-100 
                every time you book a verified appointment. Top setters are projected to earn $5K-10K/month.
              </p>
              <Link href="/register?role=caller" className="btn-accent inline-block">
                Start Setting Today
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Pick your own leads', desc: 'Browse available lead lists and choose what fits your skills' },
                { label: 'Work when you want', desc: 'No shifts, no minimums. Dial on your schedule.' },
                { label: 'Get paid fast', desc: 'Stripe payouts hit your account within days of verification.' },
                { label: 'Level up', desc: 'Top performers unlock higher-paying Elite tier assignments.' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-accent-400 mt-1">✓</span>
                  <div>
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-surface-500 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Stop Prospecting. Start Closing.</h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            You didn&apos;t start an AI agency to spend your days cold calling. Let SetFlow fill your calendar so you can focus on what you do best.
          </p>
          <Link href="/register" className="bg-white text-surface-900 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-surface-100 transition-colors inline-block">
            Get Early Access — It&apos;s Free
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
