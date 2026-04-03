import React from 'react';
import { useNavigate } from 'react-router-dom';

const ContactPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-brand-light-blue hover:text-brand-blue font-semibold"
      >
        &larr; Back
      </button>
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-serif text-brand-blue mb-4">Contact Us</h1>
        <p className="text-brand-text leading-relaxed mb-6">
          Have a question, a suggestion, or just want to say hello? We'd love to hear from you.
        </p>
        <a
          href="mailto:hello@vimarkets.ca"
          className="inline-block bg-brand-blue text-white font-semibold px-6 py-3 rounded-full hover:bg-opacity-80 transition-colors"
        >
          hello@vimarkets.ca
        </a>
      </div>
    </div>
  );
};

export default ContactPage;
