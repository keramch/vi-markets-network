import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface PaymentSuccessModalProps {
  onClose: () => void;
  termEnds: string | null;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({ onClose, termEnds }) => {
  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#2E7A72', '#D43B6A', '#7B5EA7', '#9DD4CF', '#EBF5EC'],
    });

    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const formattedDate = termEnds
    ? new Date(termEnds).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-serif text-brand-blue mb-3">Welcome to Pro!</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-2">
          Your introductory rate is locked in — keep your membership active to hold it forever.
        </p>
        {formattedDate && (
          <p className="text-sm text-gray-500 mb-6">
            Your membership is active until <span className="font-semibold text-brand-blue">{formattedDate}</span>.
          </p>
        )}
        {!formattedDate && <div className="mb-6" />}
        <button
          type="button"
          onClick={onClose}
          className="bg-brand-light-blue text-white font-semibold px-8 py-3 rounded-full hover:bg-brand-light-blue/90 transition-colors"
        >
          Let's Go!
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
