import React from 'react';

interface AboutPageProps {
  onSignup: () => void;
}

const AboutPage: React.FC<AboutPageProps> = ({ onSignup }) => {
  return (
    <main className="min-h-screen bg-brand-cream">
      {/* Hero */}
      <div id="pagetop-header" className="bg-brand-blue text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold font-serif mb-3">
          About VI Markets
        </h1>
        <p className="text-brand-teal-light text-lg max-w-2xl mx-auto">
          A community platform built for the artisan, farmer, craft &amp; community markets of all shapes and sizes across Vancouver Island and the Gulf Islands.
        </p>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-3xl">

        {/* Why We Exist */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Why We Exist</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              Markets on Vancouver Island are thriving — but finding them shouldn't be hard work.
            </p>
            <p>
              After more than a decade organizing artisan and community markets in the Comox Valley, we saw the same friction playing out everywhere: vendors struggling to find markets to apply to, organizers searching for the right vendors, and the public with no reliable way to discover what's happening in their community.
            </p>
            <p>
              VI Markets exists to fix that. A single, searchable, up-to-date home for every market and vendor in our region — so the community that makes these markets possible can spend less time searching and more time doing what they do best.
            </p>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Who We Serve</h2>
          <p className="text-gray-700 leading-relaxed">
            Market organizers and vendors throughout Vancouver Island and the Gulf Islands — from Victoria to Port Hardy, and across the Salish Sea.
          </p>
        </section>

        {/* What VI Markets Does */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">What VI Markets Does</h2>
          <ul className="space-y-3 text-gray-700">
            {[
              'A fully searchable directory of markets and vendors across the region',
              'Detailed, editable profiles for markets and vendors',
              'Event listings showing which vendors appear at which markets — and vice versa',
              'Tools for organizers to manage and communicate with their vendor community',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="text-brand-gold mt-0.5 flex-shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Already Part of the Community? */}
        <section className="mb-12 border-2 border-brand-gold bg-white rounded-2xl p-8">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Already Part of the Community?</h2>
          <p className="text-gray-700 leading-relaxed mb-6">
            If you're on Facebook, the Comox Valley Vendor Network (nearly 1,000 members strong) has been connecting Vancouver Island vendors and organizers since long before this platform existed. It's an active space for sharing opportunities, asking questions, and staying in the loop. VI Markets is the next step — a permanent, searchable home for everything that community needs.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://www.facebook.com/groups/cvvendornetwork"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-blue text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-brand-blue/90 transition-colors"
            >
              Join the Comox Valley Vendor Network
            </a>
            <button
              onClick={onSignup}
              className="bg-brand-gold text-white px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-brand-gold/90 transition-colors"
            >
              Create your VI Markets profile
            </button>
          </div>
        </section>

        {/* Where We're Headed */}
        <section className="mb-12">
          <h2 className="text-2xl font-serif text-brand-blue mb-4">Where We're Headed</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              The directory is just the beginning. Our long-term vision is to grow into a true professional association for the market community — offering resources, education, and collective advocacy for the vendors and organizers who make Vancouver Island's market culture what it is.
            </p>
            <p>
              We're building this with the community, not just for it.
            </p>
          </div>
        </section>

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

export default AboutPage;
