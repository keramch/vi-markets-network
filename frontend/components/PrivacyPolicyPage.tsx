import React from 'react';

interface PrivacyPolicyPageProps {
  onBack: () => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <button onClick={onBack} className="mb-8 text-brand-light-blue hover:text-brand-blue font-semibold">
          &larr; Back to home
        </button>
        <h1 className="text-4xl font-serif text-brand-blue mb-6">Privacy Policy</h1>
        <div className="prose max-w-none text-brand-text">
          <p><em>Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</em></p>
          <p>
            Welcome to the VI Markets Network. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
          </p>
          
          <h2 className="text-2xl font-serif text-brand-blue mt-8">1. Information We Collect</h2>
          <p>
            We may collect personal information that you voluntarily provide to us when you register on the application, express an interest in obtaining information about us or our products and services, when you participate in activities on the application, or otherwise when you contact us.
          </p>
          <p>
            The personal information that we collect depends on the context of your interactions with us and the application, the choices you make, and the products and features you use. The personal information we collect may include the following: name, email address, postal code, and other similar data.
          </p>

          <h2 className="text-2xl font-serif text-brand-blue mt-8">2. How We Use Your Information</h2>
          <p>
            We use personal information collected via our application for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
          <ul>
            <li>To facilitate account creation and logon process.</li>
            <li>To post testimonials with your consent.</li>
            <li>To manage user accounts.</li>
            <li>To send administrative information to you.</li>
            <li>To protect our Services.</li>
          </ul>

          <h2 className="text-2xl font-serif text-brand-blue mt-8">3. Will Your Information Be Shared With Anyone?</h2>
          <p>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
          </p>

          <h2 className="text-2xl font-serif text-brand-blue mt-8">4. Do We Use Cookies and Other Tracking Technologies?</h2>
          <p>
            We may use cookies and similar tracking technologies to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Policy.
          </p>

          <p className="mt-8">
            <strong>[This is a placeholder document. For a real application, you would need to consult with a legal professional to draft a comprehensive and compliant Privacy Policy.]</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
