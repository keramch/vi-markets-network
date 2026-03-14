import React, { useState } from 'react';
import type { Market, Vendor } from '../types';

interface ApplicationFormProps {
  market: Market;
  vendor: Vendor;
  onSubmit: (marketId: string, customResponses: { question: string; answer: string }[]) => void;
}

const ApplicationForm: React.FC<ApplicationFormProps> = ({ market, vendor, onSubmit }) => {
  const [customResponses, setCustomResponses] = useState<{ question: string; answer: string }[]>(
    (market.applicationFormQuestions || []).map(q => ({ question: q, answer: '' }))
  );

  const handleResponseChange = (question: string, answer: string) => {
    setCustomResponses(prev =>
      prev.map(res => (res.question === question ? { ...res, answer } : res))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(market.id, customResponses);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="font-semibold text-brand-blue">Applying as: {vendor.name}</h3>
        <p className="text-sm text-gray-500">Your profile information will be submitted with your application.</p>
      </div>
      
      {customResponses.length > 0 && (
        <div className="border-t pt-4 space-y-4">
          {customResponses.map(({ question, answer }) => (
            <div key={question}>
              <label className="block text-sm font-medium text-gray-700">{question}</label>
              <textarea
                value={answer}
                onChange={e => handleResponseChange(question, e.target.value)}
                rows={3}
                required
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-gold focus:border-brand-gold"
              />
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 border-t">
        <button type="submit" className="w-full bg-brand-blue text-white py-2 px-4 rounded-md hover:bg-opacity-90 transition-colors">
          Submit Application
        </button>
      </div>
    </form>
  );
};

export default ApplicationForm;
