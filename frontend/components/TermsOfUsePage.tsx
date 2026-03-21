import React from 'react';

const TermsOfUsePage: React.FC = () => {
  const email = <a href="mailto:hello@vimarkets.ca" className="text-brand-blue hover:underline">hello@vimarkets.ca</a>;

  return (
    <main className="min-h-screen bg-brand-cream">
      <div id="pagetop-header" className="bg-brand-blue text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif mb-3">
          Terms of Use
        </h1>
        <p className="text-brand-teal-light text-lg max-w-xl mx-auto">
          Please read these terms before using VI Markets.
        </p>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <p className="text-sm text-gray-500 mb-10">Effective date: March 20, 2026</p>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">About These Terms</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            These Terms of Use govern your access to and use of VI Markets (vimarkets.ca), a community platform for artisan, farmer, craft &amp; community markets and vendors across Vancouver Island and the Gulf Islands. VI Markets operates as a sole proprietorship based in British Columbia, Canada.
          </p>
          <p className="text-gray-700 leading-relaxed mb-3">
            By using VI Markets — whether as a visitor, registered member, or anything in between — you agree to these terms. If you do not agree, please do not use the platform.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Questions about these terms: {email}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Eligibility</h2>
          <p className="text-gray-700 leading-relaxed">
            You must be 18 years of age or older to create an account on VI Markets. By registering, you confirm that you meet this requirement. Public browsing of the directory does not require an account.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">For Public Visitors</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            VI Markets is a public directory. Anyone can browse market and vendor listings without creating an account. However, please be aware of the following:
          </p>
          <ul className="space-y-3 text-gray-700 mb-4">
            {[
              'Listings on VI Markets are created and maintained by markets and vendors themselves. VI Markets does not verify the accuracy, completeness, or reliability of any listing',
              'Vendor and market information — including locations, hours, products, and event dates — may be out of date. Always confirm details directly with the market or vendor before making plans',
              'Reviews on VI Markets are submitted by registered members and reflect their personal opinions. VI Markets does not verify, endorse, or take responsibility for the content of any review',
              'Saved favourites are a convenience feature. VI Markets does not guarantee that favourited markets or vendors will remain active, accurate, or available',
              'VI Markets does not guarantee any outcome from your use of the directory, including finding a specific vendor, attending a specific market, or making a purchase',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Use of the public directory is at your own risk.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Your Account</h2>
          <p className="text-gray-700 leading-relaxed mb-4">You are responsible for:</p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Providing accurate information when creating your account',
              'Keeping your login credentials secure',
              'All activity that occurs under your account',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            If you believe your account has been compromised, contact us immediately at {email}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">What VI Markets Is — and Isn't</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            VI Markets is a directory and toolset. We provide a platform for markets and vendors to create profiles, list events, and be discovered by the public.
          </p>
          <p className="text-gray-700 leading-relaxed mb-4">We are not:</p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'A booking or application service — vendor applications and application management tools are planned for a future phase and are not currently available',
              'An agent or broker — we do not represent, negotiate for, or act on behalf of any market or vendor',
              'A guarantor of any transaction, relationship, sale, or outcome between markets, vendors, or the public',
              'Responsible for decisions made by anyone based on information found on this platform',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Any relationships, agreements, or disputes between markets, vendors, and the public are entirely between those parties. VI Markets has no role in and accepts no responsibility for those interactions.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Your Content</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            When you create a profile or upload content to VI Markets, you:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Retain ownership of your content',
              'Grant VI Markets a non-exclusive, royalty-free licence to display your content on the platform',
              'Are responsible for ensuring your content is accurate, lawful, and does not infringe on anyone else\'s rights',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to remove content that violates these terms, without notice.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Acceptable Use</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            You agree to use VI Markets honestly and respectfully. You must not:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Post false, misleading, or fraudulent information',
              'Impersonate another person, market, or organization',
              'Use the platform to harass, threaten, or harm others',
              'Attempt to circumvent the platform\'s security or access areas you are not authorized to use',
              'Use automated tools to scrape, copy, or extract data from the platform',
              'Use VI Markets for any unlawful purpose',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to suspend or terminate accounts that violate these rules, at our sole discretion, without refund.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Availability and Reliability</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            VI Markets is provided as-is. We do our best to keep the platform running smoothly, but we do not guarantee:
          </p>
          <ul className="space-y-2 text-gray-700 mb-4">
            {[
              'Uninterrupted or error-free access',
              'That all data will be preserved in the event of a technical failure',
              'That the platform will meet your specific requirements',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-gray-700 leading-relaxed">
            Use of VI Markets is at your own risk. We recommend keeping your own records of any important information you store on the platform.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We take reasonable steps to protect the platform and your data, but no digital service can guarantee absolute security. VI Markets is not liable for unauthorized access to your account or data resulting from circumstances beyond our reasonable control.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Intellectual Property</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            The VI Markets name, logo, and platform design are the property of VI Markets. You may not reproduce, copy, or use them without written permission.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Content uploaded by members (profiles, images, descriptions) remains the property of the member who uploaded it.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Limitation of Liability</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            To the fullest extent permitted by BC law, VI Markets is not liable for any direct, indirect, incidental, or consequential damages arising from your use of the platform — including but not limited to lost business, missed market opportunities, failed sales, or disputes between markets, vendors, and the public.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Our total liability to you for any claim arising from your use of VI Markets shall not exceed the amount you paid to VI Markets in the 12 months preceding the claim.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Dispute Resolution</h2>
          <p className="text-gray-700 leading-relaxed mb-3">
            If you have a dispute with another member of VI Markets, that is between you and them. VI Markets will not mediate, arbitrate, or otherwise intervene in disputes between members or between members and the public.
          </p>
          <p className="text-gray-700 leading-relaxed mb-3">
            If you have a dispute with VI Markets directly, we ask that you contact us first at {email} and give us a reasonable opportunity to resolve it before pursuing any other action.
          </p>
          <p className="text-gray-700 leading-relaxed">
            These terms are governed by the laws of British Columbia, Canada.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Changes to These Terms</h2>
          <p className="text-gray-700 leading-relaxed">
            We may update these Terms of Use from time to time. When we do, we will update the effective date at the top of this page. Continued use of VI Markets after changes are posted constitutes acceptance of the updated terms. For significant changes, we will make reasonable efforts to notify registered members by email.
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

export default TermsOfUsePage;
