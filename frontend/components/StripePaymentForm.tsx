import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { firebaseAuth } from '../services/firebase';

// Initialized for future embedded payment flows if needed
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '');
void stripePromise;

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface StripePaymentFormProps {
  billingCycle: '6month' | 'annual';
  uid: string;
  userEmail: string;
  onCancel: () => void;
}

type PriceId = '6month' | '12month';

interface Plan {
  priceId: PriceId;
  label: string;
  price: number;
  note: string;
  badge?: string;
}

const PLANS: Plan[] = [
  {
    priceId: '6month',
    label: '6 Months',
    price: 30,
    note: 'CAD',
  },
  {
    priceId: '12month',
    label: '12 Months',
    price: 50,
    note: 'CAD',
    badge: 'Save $20',
  },
];

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  billingCycle,
  uid,
  onCancel,
}) => {
  const [selectedPriceId, setSelectedPriceId] = useState<PriceId>(
    billingCycle === 'annual' ? '12month' : '6month'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleProceed = async () => {
    setIsLoading(true);
    setError('');

    try {
      const token = await firebaseAuth.currentUser?.getIdToken();
      const res = await fetch(`${BASE_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ priceId: selectedPriceId, uid }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `Request failed (${res.status})`);
      }

      const { url } = await res.json() as { url: string };
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-gray-500 text-sm">
        Choose your Pro membership term. You'll be redirected to a secure Stripe checkout page to complete payment.
      </p>

      <div className="space-y-3">
        {PLANS.map((plan) => (
          <button
            key={plan.priceId}
            type="button"
            onClick={() => setSelectedPriceId(plan.priceId)}
            className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all ${
              selectedPriceId === plan.priceId
                ? 'border-brand-light-blue bg-brand-light-blue/10'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brand-blue">{plan.label}</span>
                  {plan.badge && (
                    <span className="text-xs font-semibold bg-brand-gold text-white px-2 py-0.5 rounded-full">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-0.5">{plan.note}</p>
              </div>
              <span className="text-2xl font-bold text-brand-blue">${plan.price}</span>
            </div>
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-center">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleProceed}
          disabled={isLoading}
          className="flex-[2] bg-brand-blue text-white font-semibold py-3 px-6 rounded-full hover:bg-brand-blue/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Redirecting to Stripe…
            </>
          ) : (
            'Proceed to Payment →'
          )}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Payments are processed securely by Stripe. VI Markets does not store your card details.
      </p>
    </div>
  );
};

export default StripePaymentForm;
