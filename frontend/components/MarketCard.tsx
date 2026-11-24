import React from 'react';
import type { Market, Organizer } from '../types';
import { MapPinIcon, CalendarIcon } from './Icons';
import { nextOccurrence, recurrenceSummary } from '../utils';

// A market's card (T128): its picture, name, town and next date. Used in
// Browse › Markets and the home page search results.

interface MarketCardProps {
  market: Market;
  organizer?: Organizer; // for its logo when the market has no picture of its own
  onSelect: (id: string) => void;
  distance?: number;
}

const shortDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });

const MarketCard: React.FC<MarketCardProps> = ({ market, organizer, onSelect, distance }) => {
  const imageSrc = market.posterUrl || market.logoUrl || organizer?.headerPhotoUrl || organizer?.logoUrl;
  const city = market.location?.city;
  const next = nextOccurrence(market);
  const repeats = recurrenceSummary(market);

  return (
    <button
      type="button"
      onClick={() => onSelect(market.id)}
      className="text-left bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 flex flex-col focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-light-blue/40"
    >
      {imageSrc ? (
        <img className="w-full h-36 object-cover" src={imageSrc} alt="" />
      ) : (
        // No picture yet: a band in the brand colours with the date, so the grid stays even
        <div className="w-full h-36 bg-brand-light-blue flex items-center justify-center" aria-hidden="true">
          <CalendarIcon className="w-10 h-10 text-brand-teal-light" />
        </div>
      )}
      <div className="p-3 flex flex-col flex-grow w-full">
        <h3 className="text-base font-serif text-brand-blue mb-1.5 leading-tight break-words">{market.name}</h3>

        {(city || distance !== undefined) && (
          <p className="flex items-center text-gray-600 mb-1 text-sm min-w-0">
            <MapPinIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">{city}</span>
            {distance !== undefined && (
              <span className="ml-1 font-semibold text-brand-blue flex-shrink-0">{city ? '· ' : ''}{distance.toFixed(1)} km</span>
            )}
          </p>
        )}

        <p className={`flex items-center text-sm mb-1 ${next ? 'text-brand-light-blue font-semibold' : 'text-gray-600'}`}>
          <CalendarIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
          <span className="truncate">{next ? `Next: ${shortDate(next.date)}` : 'No dates announced yet'}</span>
        </p>
        {repeats && <p className="text-sm text-gray-600 truncate">{repeats}</p>}

        {(market.marketType ?? []).length > 0 && (
          <div className="mt-auto pt-2">
            <span className="inline-block bg-brand-cream text-brand-blue text-sm font-semibold px-2 py-0.5 rounded-full">
              {(market.marketType ?? []).join(' · ')}
            </span>
          </div>
        )}
      </div>
    </button>
  );
};

export default MarketCard;
