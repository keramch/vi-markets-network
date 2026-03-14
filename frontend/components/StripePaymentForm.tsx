
import React, { useState } from 'react';
import { CreditCardIcon } from './Icons';

interface StripePaymentFormProps {
  amount: number;
  description: string;
  onSuccess: () => void;
  onBack?: () => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ amount, description, onSuccess, onBack }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onSuccess();
    }, 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600">{description}</p>
        <p className="text-3xl font-bold text-brand-blue">${amount.toFixed(2)}</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700">Card Number</label>
          <div className="relative mt-1">
            <input type="text" id="cardNumber" className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 pl-10" placeholder="0000 0000 0000 0000" required />
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <CreditCardIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                 <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">Expiry (MM/YY)</label>
                 <input type="text" id="expiryDate" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="MM/YY" required />
            </div>
             <div>
                 <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">CVC</label>
                 <input type="text" id="cvc" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" placeholder="123" required />
            </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {onBack && (
            <button
                type="button"
                onClick={onBack}
                disabled={isLoading}
                className="w-1/3 bg-gray-200 text-gray-700 py-2.5 px-4 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
                Back
            </button>
        )}
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-brand-blue text-white font-semibold py-2.5 px-4 rounded-md hover:bg-opacity-90 transition-colors flex items-center justify-center disabled:bg-brand-light-blue"
        >
          {isLoading ? (
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
            </>
          ) : (
            `Pay $${amount.toFixed(2)}`
          )}
        </button>
      </div>
       <p className="text-xs text-gray-500 text-center">This is a simulated payment form for demonstration purposes.</p>
    </form>
  );
};

export default StripePaymentForm;