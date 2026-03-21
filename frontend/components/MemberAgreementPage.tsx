import React from 'react';

const MemberAgreementPage: React.FC = () => {
  const email = <a href="mailto:hello@vimarkets.ca" className="text-brand-blue hover:underline">hello@vimarkets.ca</a>;

  return (
    <main className="min-h-screen bg-brand-cream">
      <div id="pagetop-header" className="bg-brand-blue text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif mb-3">
          Member Agreement
        </h1>
        <p className="text-brand-teal-light text-lg max-w-xl mx-auto">
          What you can expect from us — and what we expect from you.
        </p>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-sm text-gray-500 mb-10">Effective date: March 20, 2026</p>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">About This Agreement</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            This Member Agreement applies to all registered members of VI Markets (vimarkets.ca), including market organizers, vendors, and individuals on free or paid plans. It outlines what you can expect from VI Markets, what we expect from you, and how membership works.
          </p>
          <p className="text-gray-700 leading-relaxed mb-3">
            By creating an account, you agree to this agreement alongside our Terms of Use and Privacy Policy.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Questions: {email}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Membership Tiers</h2>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm text-left border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-brand-blue text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tier</th>
                  <th className="px-4 py-3 font-semibold">Monthly</th>
                  <th className="px-4 py-3 font-semibold">Annual</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100 text-gray-700">
                <tr>
                  <td className="px-4 py-3 font-medium">Free</td>
                  <td className="px-4 py-3">$0</td>
                  <td className="px-4 py-3">$0</td>
                  <td className="px-4 py-3">Always free</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Standard</td>
                  <td className="px-4 py-3">$5/mo</td>
                  <td className="px-4 py-3">$45/yr</td>
                  <td className="px-4 py-3">Save 25% annually</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Pro</td>
                  <td className="px-4 py-3">$12/mo</td>
                  <td className="px-4 py-3">$108/yr</td>
                  <td className="px-4 py-3">Save 25% annually</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-gray-700 leading-relaxed mb-3">
            All prices are in Canadian dollars. Pricing is subject to change at VI Markets' sole discretion. We will provide reasonable notice to existing members before any price changes take effect — see "Changes to This Agreement" below.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Founding members who joined during the beta period receive permanent free access to VI Markets. The specific features available to founding members may evolve as the platform grows, but founding member status and free access will always be honoured.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">What VI Markets Provides</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Depending on your membership tier, VI Markets provides access to some or all of the following:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'A public-facing profile page for your market or vendor business',
              'Listing in the VI Markets searchable directory',
              'Event listings connecting your market or vendor profile to calendared market events',
              'Profile management tools including image uploads and editable descriptions',
              'Organizer tools for managing vendor relationships (coming in a future phase)',
              'Vendor application tools (coming in a future phase)',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            The specific features available at each tier are outlined on our Pricing page at vimarkets.ca/pricing. We reserve the right to adjust features available at each tier with reasonable notice to members.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">What VI Markets Does Not Provide</h2>
          <p className="text-gray-700 leading-relaxed mb-4">To be clear about the limits of our service:</p>
          <ul className="space-y-2 text-gray-700">
            {[
              'We do not guarantee that your profile will result in vendor bookings, market applications, sales, or any specific business outcome',
              'We do not mediate or manage relationships between markets and vendors',
              'We do not verify the accuracy of information posted by other members',
              'We do not guarantee continuous or error-free access to the platform',
              'We are not responsible for decisions you make based on information found on VI Markets',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Your Responsibilities as a Member</h2>
          <p className="text-gray-700 leading-relaxed mb-4">As a member of VI Markets, you agree to:</p>
          <ul className="space-y-2 text-gray-700">
            {[
              'Provide accurate and truthful information on your profile',
              'Keep your profile information up to date',
              'Use the platform respectfully and in accordance with our Terms of Use',
              'Not misrepresent your market, products, or credentials',
              'Not use VI Markets to contact other members for purposes unrelated to the platform\'s intent',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Code of Conduct</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            VI Markets is a community platform. We expect all members to treat each other with basic respect and professionalism. This means:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'No harassment, threats, or abusive behaviour toward other members or VI Markets staff',
              'No discriminatory language or conduct',
              'No spam, unsolicited promotion, or misuse of any communication tools on the platform',
              'No posting of false reviews, fake profiles, or misleading information',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Simply put: don't be a jerk. Members who violate this code may have their accounts suspended or terminated at our discretion.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Fees and Billing</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            All paid subscriptions are processed through Stripe. By choosing a paid plan, you authorize VI Markets to charge your payment method as described below.
          </p>
          <p className="text-gray-700 font-semibold mb-2">Monthly subscriptions:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            {[
              'Billed on the same date each month as your original signup date',
              'You may choose automatic renewal or manual renewal at signup',
              'If you choose manual renewal, VI Markets will send reminder notices 30, 15, 5, and 1 day(s) before your subscription expires',
              'If a manually renewed subscription expires, your account reverts to the Free tier until renewed',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 font-semibold mb-2">Annual subscriptions:</p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Billed once per year on your signup anniversary date',
              'You may choose automatic renewal or manual renewal at signup',
              'If you choose manual renewal, VI Markets will send reminder notices 30, 15, 5, and 1 day(s) before your subscription expires',
              'If a manually renewed subscription expires, your account reverts to the Free tier until renewed',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            It is your responsibility to keep your payment information current. VI Markets is not responsible for service interruptions resulting from failed payments.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Cancellation</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            You may cancel your membership at any time through your account settings or by contacting {email}
          </p>
          <p className="text-gray-700 font-semibold mb-2">Monthly subscriptions:</p>
          <ul className="space-y-2 text-gray-700 mb-6">
            {[
              'No refund is issued on cancellation',
              'Your access continues until the end of the current paid month, after which your account reverts to the Free tier',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 font-semibold mb-2">Annual subscriptions:</p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'If you cancel within 6 months of your most recent annual payment, you are entitled to a prorated refund for the unused portion of your subscription',
              'After 6 months, no refund is issued, but your access continues until the end of the annual period',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            To request a refund, contact {email} with your account details. Eligible refunds will be processed within 14 business days.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Account Deletion</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            If you wish to permanently delete your VI Markets account, you may do so through your account settings or by contacting {email}
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Your public profile and all associated content will be removed immediately and will no longer be visible on the platform',
              'Your account data will be permanently and automatically purged from our systems within 30 days',
              'Account deletion is irreversible. We strongly recommend saving any information you wish to keep before deleting your account',
              'Refund eligibility on deletion follows the same rules as cancellation above',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Account Suspension and Termination</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            VI Markets reserves the right to suspend or terminate any account that:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Violates these terms, the Terms of Use, or our code of conduct',
              'Contains false, fraudulent, or harmful content',
              'Is used for purposes inconsistent with the platform\'s intent',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            In cases of termination for cause, no refund will be issued. In cases where VI Markets terminates an account without cause, a prorated refund will be provided for any unused paid period.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Changes to This Agreement</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update this Member Agreement from time to time. When we do, we will update the effective date at the top of this page. For significant changes — including changes to pricing, refund terms, or founding member benefits — we will notify registered members by email at least 30 days before the changes take effect.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Governing Law</h2>
          <p className="text-gray-700 leading-relaxed">
            This agreement is governed by the laws of British Columbia, Canada.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Contact</h2>
          <p className="text-gray-700 leading-relaxed">{email}</p>
        </section>
      </div>
    </main>
  );
};

export default MemberAgreementPage;
