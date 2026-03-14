import React from 'react';

interface TermsOfServicePageProps {
  onBack: () => void;
}

const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <button onClick={onBack} className="mb-8 text-brand-light-blue hover:text-brand-blue font-semibold">
          &larr; Back to home
        </button>
        <h1 className="text-4xl font-bold font-serif text-brand-blue mb-6">Terms of Service</h1>
        <div className="prose max-w-none text-brand-text">
            <p><em>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>
            <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the VI Markets Network application (the "Service") operated by us.</p>
            
            <h2 className="text-2xl font-bold font-serif text-brand-blue mt-8">1. Acceptance of Terms</h2>
            <p>By accessing and using our Service, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services. Any participation in this service will constitute acceptance of this agreement.</p>

            <h2 className="text-2xl font-bold font-serif text-brand-blue mt-8">2. User-Generated Content</h2>
            <p>You are solely responsible for the content, including but not limited to photos, reviews, and profile information, that you post on or through the Service ("User Content"). You agree not to post User Content that is illegal, defamatory, or infringes on the rights of any third party. We reserve the right, but are not obligated, to remove any User Content for any reason.</p>

            <h2 className="text-2xl font-bold font-serif text-brand-blue mt-8">3. Prohibited Activities</h2>
            <p>You may not access or use the Service for any purpose other than that for which we make the Service available. The Service may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>

            <h2 className="text-2xl font-bold font-serif text-brand-blue mt-8">4. Termination</h2>
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.</p>

            <h2 className="text-2xl font-bold font-serif text-brand-blue mt-8">5. Disclaimer</h2>
            <p>The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.</p>
            
            <p className="mt-8">
                <strong>[This is a placeholder document. For a real application, you would need to consult with a legal professional to draft comprehensive and binding Terms of Service.]</strong>
            </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
