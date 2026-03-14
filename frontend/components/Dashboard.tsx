import React from 'react';
import type { Market, Vendor } from '../types';
import MarketCard from './MarketCard';
import VendorCard from './VendorCard';
import { UserCheck } from 'lucide-react';

interface DashboardProps {
  markets: Market[];
  vendors: Vendor[];
  onSelectMarket: (id: string) => void;
  onSelectVendor: (id: string) => void;
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ markets, vendors, onSelectMarket, onSelectVendor, onBack }) => {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold font-serif text-brand-blue flex items-center">
            <UserCheck className="w-8 h-8 mr-4 text-brand-blue" />
            Following
        </h1>
        <button onClick={onBack} className="text-brand-light-blue hover:text-brand-blue font-semibold">
          &larr; Back to home
        </button>
      </div>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold font-serif text-brand-blue mb-6">Followed Markets</h2>
        {markets.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {markets.map(market => <MarketCard key={market.id} market={market} onSelect={onSelectMarket} />)}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">You aren't following any markets yet.</p>
            <p className="text-sm text-gray-500 mt-2">Click Follow on a market's page to see it here.</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-3xl font-semibold font-serif text-brand-blue mb-6">Followed Vendors</h2>
        {vendors.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {vendors.map(vendor => <VendorCard key={vendor.id} vendor={vendor} onSelect={onSelectVendor} />)}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">You aren't following any vendors yet.</p>
            <p className="text-sm text-gray-500 mt-2">Click Follow on a vendor's page to see them here.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
