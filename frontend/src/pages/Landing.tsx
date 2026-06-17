import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FEATURES = [
  {
    title: 'Keep Alive',
    description: 'Prevent your free-tier Render, Railway, and Heroku apps from sleeping with periodic pings.',
    icon: (
      <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Uptime Monitoring',
    description: 'Track uptime percentages and response times. Know instantly when something goes wrong.',
    icon: (
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Email Alerts',
    description: 'Get notified the moment a service goes down. No more discovering downtime from customers.',
    icon: (
      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    title: 'Incident History',
    description: 'Review past outages with detailed timelines. See exactly when issues occurred and how long they lasted.',
    icon: (
      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Response Charts',
    description: 'Visualize response time trends. Spot performance degradation before your users do.',
    icon: (
      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    title: 'Simple Setup',
    description: 'Add a URL, pick a mode, and you are done. No complex configuration or infrastructure knowledge required.',
    icon: (
      <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    features: ['3 monitors', '10-minute checks', 'Keep Alive mode', '7-day history'],
    cta: 'Start Free',
    href: '/register',
  },
  {
    name: 'Starter',
    price: '$5',
    period: '/mo',
    features: ['25 monitors', '5-minute checks', 'Email alerts', '30-day history', 'Full Monitoring'],
    cta: 'Coming Soon',
    href: '#',
    featured: true,
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/mo',
    features: ['100 monitors', '1-minute checks', 'Discord + Slack alerts', 'SSL monitoring', 'Status pages'],
    cta: 'Coming Soon',
    href: '#',
  },
];

export default function Landing() {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">DeployPulse</span>
          <div className="flex items-center gap-4">
            {token ? (
              <Link
                to="/app"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Never wake a sleeping app again
          </h1>
          <p className="mt-6 text-lg text-gray-500 max-w-xl mx-auto">
            DeployPulse pings your free-tier apps to prevent sleep on Render, Railway, and Heroku.
            Plus uptime monitoring, alerts, and analytics.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link
              to="/register"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Start monitoring for free
            </Link>
            <Link
              to="/login"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">No credit card required. 3 monitors free forever.</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            Everything you need to keep your apps alive
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-gray-500 mb-12">Three simple steps to keep your apps awake.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Add a URL', desc: 'Enter the URL of your app or API endpoint.' },
              { step: '2', title: 'Choose a mode', desc: 'Keep Alive to prevent sleep, or Full Monitoring for uptime tracking.' },
              { step: '3', title: 'Relax', desc: 'DeployPulse pings your app on schedule. You get alerts if something breaks.' },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-gray-500 text-center mb-12">
            Start free. Upgrade when you need more.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 ${
                  plan.featured
                    ? 'border-blue-300 bg-white shadow-md ring-1 ring-blue-100'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-400 text-sm">{plan.period}</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="text-green-500">&check;</span> {f}
                    </li>
                  ))}
                </ul>
                {plan.href.startsWith('/') ? (
                  <Link
                    to={plan.href}
                    className={`block w-full text-center py-2 rounded-md text-sm font-medium transition-colors ${
                      plan.featured
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="block w-full text-center py-2 rounded-md text-sm font-medium border border-gray-200 text-gray-400 cursor-not-allowed"
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          <p>DeployPulse &mdash; Keep your apps alive. Built for indie developers.</p>
        </div>
      </footer>
    </div>
  );
}
