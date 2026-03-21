import React, { useState } from 'react';

interface PricingPageProps {
  onBack: () => void;
  onSignup: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onSignup }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const monthly = { standard: 5, pro: 12 };
  const annual = { standard: 45, pro: 108 };
  const prices = billingCycle === 'monthly' ? monthly : annual;
  const period = billingCycle === 'monthly' ? '/mo' : '/yr';

  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <div id="pagetop-header" className="bg-brand-blue text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif mb-3">
          Simple, Honest Pricing
        </h1>
        <p className="text-brand-teal-light text-lg max-w-xl mx-auto">
          VI Markets Network is currently in invite-only beta. Founding members get free access — forever.
        </p>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Beta callout */}
        <div className="border-2 border-brand-gold bg-brand-cream rounded-2xl p-8 text-center mb-14">
          <p className="text-2xl font-bold text-brand-blue mb-3">🌿 Thanks for joining us. We're thrilled to have you here.</p>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Everyone who joins during our founding beta gets free access for life — no subscription required,
            no expiry date. As the platform grows and paid tiers activate, your access stays free. Always.
          </p>
        </div>

        {/* Pricing tiers */}
        <div className="mb-14">
          <p className="text-center text-gray-600 mb-6 max-w-2xl mx-auto">
            Paid memberships launch after beta. Here's what's coming — and what you'll be locked in at if you join now.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-brand-blue text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-brand-blue text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              Annual
              <span className="ml-1.5 bg-brand-gold text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                save 25%
              </span>
            </button>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
              <h3 className="text-xl font-serif text-brand-blue mb-1">Free</h3>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-gray-900">$0</span>
                <span className="text-sm text-gray-500 ml-1">/forever</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 flex-grow">
                {[
                  'Directory listing & public profile',
                  '1 photo',
                  'Connect to up to 3 markets',
                  'Calendar visibility 1 month out',
                  'In-app notifications only',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand-gold mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Standard */}
            <div className="bg-white rounded-2xl border-2 border-brand-blue p-6 flex flex-col relative shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Most Popular
              </span>
              <h3 className="text-xl font-serif text-brand-blue mb-1">Standard</h3>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-brand-blue">${prices.standard}</span>
                <span className="text-sm text-gray-500 ml-1">{period}</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 flex-grow">
                {[
                  'Full profile & unlimited photos',
                  'Priority search placement',
                  'Full calendar visibility',
                  'In-app + email notifications',
                  'Up to 3 market applications/month (Phase 2)',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand-blue mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
              <h3 className="text-xl font-serif text-brand-blue mb-1">Pro</h3>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-gray-900">${prices.pro}</span>
                <span className="text-sm text-gray-500 ml-1">{period}</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 flex-grow">
                {[
                  'Everything in Standard',
                  'Up to 10 market applications/month (Phase 2)',
                  'Push notifications (Phase 2)',
                  'Early access to all new features',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand-gold mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6">
            All prices in CAD. Annual plans save 25%. Founding beta members pay $0 — forever.
          </p>

          <div className="text-center mt-10">
            <button
              onClick={onSignup}
              className="bg-brand-gold text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-brand-gold/90 transition-colors"
            >
              Claim Your Spot
            </button>
          </div>
        </div>

        {/* Phase 2 preview */}
        <div className="bg-brand-cream rounded-2xl p-8 mb-14">
          <h2 className="text-2xl font-serif text-brand-blue text-center mb-3">
            More is coming.
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            We're building a full suite of tools for market organizers and vendors. Beta members get early
            access to everything as it rolls out.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: '📋',
                label: 'Vendor Applications',
                desc: 'Apply to markets directly through the platform',
              },
              {
                icon: '📅',
                label: 'Market Scheduling',
                desc: 'Manage recurring events, exceptions, and seasons',
              },
              {
                icon: '🔔',
                label: 'Notifications',
                desc: 'Email, push, and in-app alerts for what matters to you',
              },
              {
                icon: '📊',
                label: 'Analytics',
                desc: "See who's viewing your profile and how you're being found",
              },
            ].map((feature) => (
              <div key={feature.label} className="flex items-start gap-4 bg-white rounded-xl p-5 border border-gray-100">
                <span className="text-3xl flex-shrink-0">{feature.icon}</span>
                <div>
                  <p className="font-bold text-brand-blue">{feature.label}</p>
                  <p className="text-sm text-gray-600 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Closing */}
        <p className="text-center text-sm text-gray-500">
          Questions? Contact us at{' '}
          <a href="mailto:hello@vimarkets.ca" className="text-brand-blue hover:underline">
            hello@vimarkets.ca
          </a>
        </p>
      </div>
    </main>
  );
};

export default PricingPage;
