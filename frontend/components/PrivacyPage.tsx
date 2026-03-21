import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-brand-cream">
      <div id="pagetop-header" className="bg-brand-blue text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif mb-3">
          Privacy Policy
        </h1>
        <p className="text-brand-teal-light text-lg max-w-xl mx-auto">
          We take your privacy seriously.
        </p>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-sm text-gray-500 mb-10">Effective date: March 20, 2026</p>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Who We Are</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            VI Markets is a community platform for artisan, farmer, craft &amp; community markets and vendors across Vancouver Island and the Gulf Islands. VI Markets operates as a sole proprietorship based in British Columbia, Canada.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Privacy inquiries:{' '}
            <a href="mailto:hello@vimarkets.ca" className="text-brand-blue hover:underline">hello@vimarkets.ca</a>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">What Information We Collect</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            We collect personal information only when you provide it to us directly. This includes:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              { label: 'Account registration', detail: 'your name and email address' },
              { label: 'Profile information', detail: 'details you choose to add to your market or vendor profile, including images, descriptions, location, and contact information' },
              { label: 'Newsletter signup', detail: 'your first name, email address, and city' },
              { label: 'Communications', detail: 'any messages you send to us at hello@vimarkets.ca' },
            ].map(({ label, detail }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                <span><strong>{label}:</strong> {detail}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            We do not collect payment information directly. Payment processing is handled by a third-party provider (Stripe) and is subject to their privacy policy.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">How We Use Your Information</h2>
          <p className="text-gray-700 leading-relaxed mb-4">We use your personal information to:</p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Create and manage your VI Markets account',
              'Display your market or vendor profile to the public',
              'Send you newsletters or platform updates you have opted into',
              'Respond to your questions and support requests',
              'Improve the platform and fix technical issues',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            We do not sell your personal information. We do not share it with third parties except as described in this policy.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Third-Party Services</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            VI Markets uses the following third-party services that may process your personal information:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              { name: 'Firebase (Google)', desc: 'account authentication, database, and file storage' },
              { name: 'Google Analytics', desc: 'anonymous usage and traffic analytics to help us understand how the platform is used' },
              { name: 'Brevo', desc: 'email newsletter delivery' },
              { name: 'Vercel', desc: 'frontend hosting' },
              { name: 'Render', desc: 'backend hosting' },
              { name: 'Stripe', desc: 'payment processing (Phase 2, not yet active)' },
            ].map(({ name, desc }) => (
              <li key={name} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                <span><strong>{name}</strong> — {desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Each of these services has its own privacy policy. We encourage you to review them if you have concerns. You can opt out of Google Analytics tracking at{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue hover:underline"
            >
              tools.google.com/dlpage/gaoptout
            </a>.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Session, Storage &amp; Cookies</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            VI Markets uses browser storage (including local storage and session tokens) to maintain your login session. This is essential for the app to function.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">
            Google Analytics sets cookies in your browser to collect anonymous data about how visitors use the site — including pages visited, time spent, and general traffic patterns. This data is aggregated and does not identify you personally. You can opt out at{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-blue hover:underline"
            >
              tools.google.com/dlpage/gaoptout
            </a>.
          </p>
          <p className="text-gray-700 leading-relaxed">
            We do not use advertising or behavioural tracking cookies. Follows, favourites, and account preferences are stored securely in your VI Markets account, not in your browser.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Your Rights Under BC's PIPA</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            As a BC-based platform, VI Markets is governed by the Personal Information Protection Act (PIPA). You have the right to:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Request access to the personal information we hold about you',
              'Request corrections to inaccurate information',
              'Withdraw consent for non-essential uses of your information',
              'Request deletion of your account and associated data',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:hello@vimarkets.ca" className="text-brand-blue hover:underline">hello@vimarkets.ca</a>.
            {' '}We will respond within 30 days.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Children's Privacy</h2>
          <p className="text-gray-700 leading-relaxed">
            VI Markets is intended for users who are 18 years of age or older. We do not knowingly collect personal information from minors.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Changes to This Policy</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy from time to time. When we do, we will update the effective date at the top of this page. Continued use of VI Markets after changes are posted constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Contact</h2>
          <p className="text-gray-700 leading-relaxed">
            For any privacy-related questions or requests:{' '}
            <a href="mailto:hello@vimarkets.ca" className="text-brand-blue hover:underline">hello@vimarkets.ca</a>
          </p>
        </section>
      </div>
    </main>
  );
};

export default PrivacyPage;
