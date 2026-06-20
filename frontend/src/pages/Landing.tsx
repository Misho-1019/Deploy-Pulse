import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import ThemeToggle from '../components/ThemeToggle';
import * as billingApi from '../api/billing';

const FEATURES = [
  {
    title: 'Keep Alive',
    description: 'Prevent your free-tier Render, Railway, and Heroku apps from sleeping with periodic pings.',
    icon: (
      <svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Uptime Monitoring',
    description: 'Track uptime percentages and response times. Know instantly when something goes wrong.',
    icon: (
      <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: 'Email Alerts',
    description: 'Get notified the moment a service goes down. No more discovering downtime from customers.',
    icon: (
      <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    title: 'Incident History',
    description: 'Review past outages with detailed timelines. See exactly when issues occurred and how long they lasted.',
    icon: (
      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Response Charts',
    description: 'Visualize response time trends. Spot performance degradation before your users do.',
    icon: (
      <svg className="w-6 h-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
  },
  {
    title: 'Simple Setup',
    description: 'Add a URL, pick a mode, and you are done. No complex configuration or infrastructure knowledge required.',
    icon: (
      <svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    cta: 'Upgrade',
    href: '/app/settings?plan=starter',
    featured: true,
  },
  {
    name: 'Pro',
    price: '$15',
    period: '/mo',
    features: ['100 monitors', '1-minute checks', 'Slack + Email alerts', 'Status pages', 'SSL monitoring'],
    cta: 'Upgrade',
    href: '/app/settings?plan=pro',
  },
];

export default function Landing() {
  const { token } = useAuth();
  const { data: billing } = useQuery({
    queryKey: ['billing'],
    queryFn: () => billingApi.getBillingStatus(),
    enabled: !!token,
    staleTime: 60_000,
  });

  const userPlan = billing?.plan || 'FREE';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <span className="text-xl font-bold">DeployPulse</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {token ? (
              <Button asChild>
                <Link to="/app">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Button asChild>
                  <Link to="/register">Sign up free</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Never wake a sleeping app again
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            DeployPulse pings your free-tier apps to prevent sleep on Render, Railway, and Heroku.
            Plus uptime monitoring, alerts, and analytics.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/register">Start monitoring for free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No credit card required. 3 monitors free forever.</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/50 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">
            Everything you need to keep your apps alive
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card rounded-xl border border-border p-6">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground mb-12">Three simple steps to keep your apps awake.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Add a URL', desc: 'Enter the URL of your app or API endpoint.' },
              { step: '2', title: 'Choose a mode', desc: 'Keep Alive to prevent sleep, or Full Monitoring for uptime tracking.' },
              { step: '3', title: 'Relax', desc: 'DeployPulse pings your app on schedule. You get alerts if something breaks.' },
            ].map((s) => (
              <div key={s.step}>
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-muted/50 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Start free. Upgrade when you need more.
          </p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map((plan) => {
              const isCurrentPlan = token && userPlan === plan.name.toUpperCase();

              return (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 transition-all duration-200 ${
                  isCurrentPlan
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20 scale-[1.02]'
                    : 'border-border bg-card hover:border-primary/30 hover:shadow-md hover:ring-1 hover:ring-primary/10 hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {isCurrentPlan && (
                    <Badge variant="default" className="text-[10px] px-1.5">Current</Badge>
                  )}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>Current Plan</Button>
                ) : plan.cta === 'Start Free' && !token ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/register">{plan.cta}</Link>
                  </Button>
                ) : plan.cta === 'Start Free' && token ? (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/app">Dashboard</Link>
                  </Button>
                ) : (
                  <Button className="w-full" variant={plan.featured ? 'default' : 'outline'} asChild>
                    <Link to={token ? plan.href : `/register?redirect=${encodeURIComponent('/app/settings?plan=' + plan.name.toLowerCase())}`}>
                      {token ? (userPlan === 'FREE' ? plan.cta : plan.name === 'Starter' && userPlan === 'PRO' ? 'Downgrade' : 'Upgrade') : 'Get Started'}
                    </Link>
                  </Button>
                )}
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>DeployPulse &mdash; Keep your apps alive. Built for indie developers.</p>
        </div>
      </footer>
    </div>
  );
}
