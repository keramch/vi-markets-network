import React from 'react';
import type { Application, Market } from '../types';
import { FileTextIcon } from './Icons';

interface MyApplicationsProps {
  applications: Application[];
  markets: Market[];
  onSelectMarket: (id: string) => void;
  onBack: () => void;
}

const MyApplications: React.FC<MyApplicationsProps> = ({ applications, markets, onSelectMarket, onBack }) => {
  const getStatusChip = (status: Application['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-serif text-brand-blue flex items-center">
          <FileTextIcon className="w-8 h-8 mr-4 text-brand-light-blue" />
          My Applications
        </h1>
        <button onClick={onBack} className="text-brand-light-blue hover:text-brand-blue font-semibold">
          &larr; Back to home
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {applications.length > 0 ? (
          <div className="space-y-4">
            {applications.map(app => {
              const market = markets.find(m => m.id === app.marketId);
              if (!market) return null;
              return (
                <div key={app.id} className="p-4 border rounded-md flex justify-between items-center">
                  <div>
                    <p 
                      onClick={() => onSelectMarket(market.id)}
                      className="font-bold text-brand-blue cursor-pointer hover:underline"
                    >
                      {market.name}
                    </p>
                    <p className="text-sm text-gray-500">Submitted on {app.date}</p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusChip(app.status)}`}>
                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Applications Found</h3>
            <p className="mt-1 text-sm text-gray-500">You haven't applied to any markets yet. Find a market to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
