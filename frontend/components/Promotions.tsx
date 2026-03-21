
import React, { useState } from 'react';
import type { Market, Vendor } from '../types';
import { MegaphoneIcon } from './Icons';

interface Promotion {
  title: string;
  price: number;
  description: string;
  onConfirm: () => void;
}

interface PromotionsProps {
  ownedMarket?: Market;
  ownedVendor?: Vendor;
  onPurchasePromotion: (promotion: Promotion) => void;
  onBack: () => void;
}

const Promotions: React.FC<PromotionsProps> = ({ ownedMarket, ownedVendor, onPurchasePromotion, onBack }) => {
  const [marketPromoDate, setMarketPromoDate] = useState('');
  const [vendorPromoOffer, setVendorPromoOffer] = useState('');

  const handleMarketPurchase = () => {
    if (!marketPromoDate) {
      alert("Please enter a date for your promotion.");
      return;
    }
    onPurchasePromotion({
      title: 'Priority Email Placement',
      price: 5,
      description: `Featuring ${ownedMarket?.name} for the market on ${marketPromoDate}.`,
      onConfirm: () => {
        console.log(`Market promotion purchased for ${ownedMarket?.id} on ${marketPromoDate}`);
        setMarketPromoDate('');
      }
    });
  };

  const handleVendorPurchase = () => {
     if (!vendorPromoOffer) {
      alert("Please enter your special offer text.");
      return;
    }
    onPurchasePromotion({
      title: 'Vendor Spotlight & Offer',
      price: 10,
      description: `Featuring a special offer from ${ownedVendor?.name}.`,
      onConfirm: () => {
        console.log(`Vendor promotion purchased for ${ownedVendor?.id} with offer: ${vendorPromoOffer}`);
        setVendorPromoOffer('');
      }
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-serif text-brand-blue flex items-center">
          <MegaphoneIcon className="w-8 h-8 mr-4 text-brand-gold" />
          Marketing & Promotions
        </h1>
        <button onClick={onBack} className="text-brand-light-blue hover:text-brand-blue font-semibold">
          &larr; Back to home
        </button>
      </div>
      <p className="max-w-3xl text-lg text-brand-text mb-10">
        Boost your visibility within the VI Markets Network community. Purchase add-ons for our weekly newsletter to reach more customers.
      </p>

      <div className="space-y-12">
        {ownedMarket && (
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-serif text-brand-blue mb-2">For Your Market: <span className="text-brand-light-blue">{ownedMarket.name}</span></h2>
            <p className="text-gray-600 mb-6">Get top billing in our newsletter to attract more visitors to your market.</p>
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-brand-blue">Priority Email Placement</h3>
              <p className="text-gray-500 mt-1 mb-4">Feature your market at the top of our newsletter for an upcoming market date.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-brand-cream/60 rounded-md">
                <div className="flex-grow w-full">
                    <label htmlFor="market-promo-date" className="block text-sm font-medium text-gray-700">Market Date to Promote</label>
                    <input 
                        type="date" 
                        id="market-promo-date"
                        value={marketPromoDate}
                        onChange={(e) => setMarketPromoDate(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                    />
                </div>
                <button 
                  onClick={handleMarketPurchase}
                  className="w-full sm:w-auto bg-brand-gold text-white font-semibold py-3 px-6 rounded-md hover:bg-opacity-80 transition-colors self-end"
                >
                  Purchase for $5
                </button>
              </div>
            </div>
          </div>
        )}

        {ownedVendor && (
           <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-serif text-brand-blue mb-2">For Your Business: <span className="text-brand-light-blue">{ownedVendor.name}</span></h2>
            <p className="text-gray-600 mb-6">Drive sales by advertising a special offer directly to our engaged audience.</p>
            <div className="border-t pt-6">
              <h3 className="text-xl font-semibold text-brand-blue">Vendor Spotlight & Special Offer</h3>
              <p className="text-gray-500 mt-1 mb-4">Your offer will be featured in a dedicated section of the newsletter.</p>
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-brand-cream/60 rounded-md">
                <div className="flex-grow w-full">
                    <label htmlFor="vendor-promo-offer" className="block text-sm font-medium text-gray-700">Your Special Offer Text</label>
                    <textarea
                        id="vendor-promo-offer"
                        value={vendorPromoOffer}
                        onChange={(e) => setVendorPromoOffer(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        placeholder="e.g. 10% off all baked goods this Saturday!"
                    />
                </div>
                <button 
                  onClick={handleVendorPurchase}
                  className="w-full sm:w-auto bg-brand-gold text-white font-semibold py-3 px-6 rounded-md hover:bg-opacity-80 transition-colors self-end"
                >
                  Purchase for $10
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Promotions;
