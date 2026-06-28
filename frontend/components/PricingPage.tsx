import React from 'react';

interface PricingPageProps {
  onBack: () => void;
  onSignup: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onSignup }) => {
  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <div id="pagetop-header" className="bg-brand-blue text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-normal font-serif mb-3">
          Jump in early. Lock in your rate.
        </h1>
        <p className="text-brand-teal-light text-lg max-w-2xl mx-auto leading-relaxed">
          VI Markets Network is live and growing. Phase 1 is all about discoverability — get your profile out
          there, connect with markets, and be found by shoppers across Vancouver Island. Phase 2 is in
          development now: vendor applications, market scheduling, and notifications drop in beta by early
          fall 2026. Join now and lock in introductory pricing before it all goes live.
        </p>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Tier cards */}
        <div className="mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col">
              <h3 className="text-xl font-serif font-normal text-brand-blue mb-0.5">Free</h3>
              <p className="text-sm text-gray-500 mb-3">Forever</p>
              <div className="mb-4">
                <span className="text-3xl font-extrabold text-gray-900">$0</span>
                <span className="text-sm text-gray-500 ml-1">/forever</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600 flex-grow">
                {[
                  'Directory listing & public profile',
                  'Up to 3 gallery photos + logo',
                  'Connect to up to 3 markets',
                  '"Markets I Attend" profile section',
                  'In-app notifications',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand-gold mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl border-2 border-brand-blue p-6 flex flex-col relative shadow-md">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                Introductory Rate
              </span>
              <h3 className="text-xl font-serif font-normal text-brand-blue mb-3">Pro</h3>
              <div className="mb-1">
                <span className="text-2xl font-extrabold text-brand-blue">$30 CAD</span>
                <span className="text-sm text-gray-500 ml-1">/ 6 months + GST</span>
              </div>
              <div className="mb-1">
                <span className="text-2xl font-extrabold text-brand-blue">$50 CAD</span>
                <span className="text-sm text-gray-500 ml-1">/ 12 months + GST</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">Save $10 with a 12-month term</p>
              <ul className="space-y-2 text-sm text-gray-600 flex-grow">
                {[
                  'Everything in Free',
                  'Unlimited gallery photos + logo',
                  'Unlimited market connections',
                  '"Markets I Attend" profile section',
                  'Priority search placement (Phase 2)',
                  'Email notifications (Phase 2)',
                  'Vendor applications (Phase 2)',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-brand-blue mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={onSignup}
                className="mt-6 bg-brand-blue text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-blue/90 transition-colors"
              >
                Get Pro Access
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6 max-w-xl mx-auto">
            All prices in CAD, plus applicable tax. Introductory pricing is locked in for life as long as your
            membership stays active — let it lapse and the rate cannot be reinstated. Founding beta members
            have lifetime Pro access at no charge.
          </p>

          <div className="text-center mt-10">
            <button
              onClick={onSignup}
              className="bg-brand-gold text-white px-8 py-3 rounded-full font-semibold text-lg hover:bg-brand-gold/90 transition-colors"
            >
              Join Free
            </button>
          </div>
        </div>

        {/* Phase 2 preview */}
        <div className="bg-brand-cream rounded-2xl p-8 mb-14">
          <h2 className="text-2xl font-serif font-normal text-brand-blue text-center mb-3">
            More is coming.
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            We're building a full suite of tools for market organizers and vendors. Pro members get early
            access to everything as it rolls out — Phase 2 drops in beta by early fall 2026.
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
