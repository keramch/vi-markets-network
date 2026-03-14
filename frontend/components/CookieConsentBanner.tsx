import React from 'react';

interface CookieConsentBannerProps {
  isVisible: boolean;
  onAccept: () => void;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ isVisible, onAccept }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-brand-blue text-white p-4 z-50 shadow-lg" role="dialog" aria-live="polite" aria-label="Cookie Consent Banner">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-300">
          We use cookies to enhance your experience and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
        </p>
        <button
          onClick={onAccept}
          className="bg-brand-gold text-white font-semibold px-6 py-2 rounded-md hover:bg-opacity-80 transition-colors flex-shrink-0"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default CookieConsentBanner;
