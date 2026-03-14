
import React from 'react';
import type { Market } from '../types';
import { MapPinIcon, CalendarIcon, AwardIcon, StarIcon } from './Icons';
import { formatTime } from '../utils';

interface MarketCardProps {
  market: Market;
  onSelect: (id: string) => void;
  featured?: boolean;
  distance?: number;
  nextEventDate?: string; // YYYY-MM-DD of next upcoming event occurrence
}

const formatScheduleToString = (schedule?: Market['schedule']): string => {
  if (!schedule || !Array.isArray(schedule.rules) || schedule.rules.length === 0) {
    return schedule?.notes || '';
  }
  const mainRule = schedule.rules[0];
  if (!mainRule) return schedule.notes || '';
  const day = mainRule.dayOfWeek ? `${mainRule.dayOfWeek}s` : '';
  const time =
    mainRule.startTime && mainRule.endTime
      ? `${formatTime(mainRule.startTime)}–${formatTime(mainRule.endTime)}`
      : '';
  const noteText = schedule.notes ? `, ${schedule.notes}` : '';
  return `${day}${day && time ? ', ' : ''}${time}${noteText}`;
};

const formatNextDate = (isoDate: string): string => {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
};

const MarketCard: React.FC<MarketCardProps> = ({ market, onSelect, featured = false, distance, nextEventDate }) => {
  // Banner photo > gallery > logo as card image
  const imageSrc = market.headerPhotoUrl || market.photos?.[0] || market.logoUrl || '/placeholder.jpg';
  const city = market.location?.city;
  const scheduleText = formatScheduleToString(market.schedule);
  const avgRating =
    market.reviews?.length > 0
      ? market.reviews.reduce((acc, r) => acc + r.rating, 0) / market.reviews.length
      : null;
  const nextDateLabel = nextEventDate ? formatNextDate(nextEventDate) : null;

  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 cursor-pointer flex flex-col relative"
      onClick={() => onSelect(market.id)}
    >
      {featured && (
        <div className="absolute top-2 right-2 bg-brand-gold text-white text-xs font-bold px-2 py-1 rounded-full flex items-center z-10">
          <AwardIcon className="w-4 h-4 mr-1" />
          Featured
        </div>
      )}
      <img className="w-full h-36 object-cover" src={imageSrc} alt={market.name} />
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-base font-bold font-serif text-brand-blue mb-1.5 leading-tight">{market.name}</h3>

        {(city || distance !== undefined) && (
          <div className="flex items-center text-gray-500 mb-1">
            <MapPinIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span className="text-xs truncate">{city}</span>
            {distance !== undefined && (
              <span className="ml-1 text-xs font-semibold text-brand-blue flex-shrink-0">
                {city ? '· ' : ''}{distance.toFixed(1)} km
              </span>
            )}
          </div>
        )}

        {avgRating !== null && (
          <div className="flex items-center mb-1">
            <StarIcon className="w-3.5 h-3.5 mr-1 text-brand-gold" filled />
            <span className="text-xs font-semibold text-brand-text">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-gray-400 ml-1">({market.reviews.length})</span>
          </div>
        )}

        {scheduleText && (
          <div className="flex items-center text-gray-500 mb-1">
            <CalendarIcon className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
            <span className="text-xs truncate">{scheduleText}</span>
          </div>
        )}

        {nextDateLabel && (
          <p className="text-xs text-brand-light-blue font-medium mb-1">Next: {nextDateLabel}</p>
        )}

        <div className="mt-auto pt-2">
          <span className="inline-block bg-brand-gold/20 text-brand-blue text-xs font-semibold px-2 py-0.5 rounded-full">
            {market.category}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MarketCard;
