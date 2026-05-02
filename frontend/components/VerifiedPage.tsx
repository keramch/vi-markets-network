import React from 'react';
import { useNavigate } from 'react-router-dom';

const VerifiedPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-10 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="font-serif text-3xl text-brand-blue mb-3">You're verified!</h1>
        <p className="text-gray-600 mb-6">
          Your email address has been confirmed. You're all set to explore VI Markets.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-brand-light-blue text-white font-semibold px-8 py-3 rounded-lg hover:bg-opacity-90 transition-colors w-full"
        >
          Go to VI Markets
        </button>
      </div>
    </div>
  );
};

export default VerifiedPage;
