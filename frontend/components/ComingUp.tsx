import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Market, MarketEvent } from '../types';
import { upcomingOccurrences, formatTime, eventPath } from '../utils';

// "Coming up" on the home page banner (T122): the next three market dates,
// live from published events, each linking to its event page. Beside them,
// the market's own branding: the poster of the soonest market that has one,
// else that market's logo. Nothing to show means nothing is rendered.

interface ComingUpProps {
  events: MarketEvent[];
  markets: Market[]; // active markets only
}

const ComingUp: React.FC<ComingUpProps> = ({ events, markets }) => {
  const upcoming = useMemo(() => {
    const bySlug = new Map(markets.filter(m => m.slug).map(m => [m.id, m]));
    const seen = new Set<string>();
    return upcomingOccurrences(events, 120)
      .map(o => ({ ...o, market: bySlug.get(o.event.marketPageId) }))
      // Only markets with a public page; one row per event, so a weekly market doesn't fill the list
      .filter(o => {
        if (!o.market || seen.has(o.event.id)) return false;
        seen.add(o.event.id);
        return true;
      })
      .slice(0, 3);
  }, [events, markets]);

  if (upcoming.length === 0) return null;

  const withPoster = upcoming.find(o => o.event.posterUrl);
  const brand = withPoster
    ? { kind: 'poster' as const, o: withPoster, src: withPoster.event.posterUrl! }
    : upcoming[0].market!.logoUrl
      ? { kind: 'logo' as const, o: upcoming[0], src: upcoming[0].market!.logoUrl! }
      : null;

  const day = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', opts).replace('.', '');

  return (
    <aside aria-labelledby="coming-up-title" className="w-full lg:w-[31rem] flex-shrink-0 flex gap-4 items-stretch text-left">
      {brand && (
        <Link
          to={eventPath(brand.o.market!.slug!, brand.o.event, brand.o.date)}
          className="hidden lg:block relative w-48 flex-shrink-0 self-start rounded-xl overflow-hidden shadow-xl bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
        >
          {brand.kind === 'poster' ? (
            <img src={brand.src} alt={`${brand.o.event.name} poster`} className="w-48 h-72 object-cover" />
          ) : (
            <div className="w-48 h-56 flex items-center justify-center p-5">
              <img src={brand.src} alt={`${brand.o.market!.name} logo`} className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <span className="absolute inset-x-0 bottom-0 px-3 py-2 bg-[rgba(44,40,40,0.82)] text-white text-sm leading-snug">
            <strong className="font-semibold">Next up:</strong> {brand.o.event.name}, {day(brand.o.date, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </Link>
      )}

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="coming-up-title" className="font-serif text-2xl text-white">Coming up</h2>
          <Link to="/calendar" className="text-sm font-semibold text-white underline hover:no-underline">Full calendar</Link>
        </div>
        <ul className="space-y-2">
          {upcoming.map(o => (
            <li key={`${o.event.id}-${o.date}`}>
              <Link
                to={eventPath(o.market!.slug!, o.event, o.date)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg text-brand-text hover:bg-brand-cream focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
              >
                <span className="w-12 flex-shrink-0 text-center leading-tight">
                  <span className="block text-sm font-semibold text-brand-gold uppercase">{day(o.date, { weekday: 'short' })}</span>
                  <span className="block font-serif text-2xl text-brand-blue leading-none">{Number(o.date.slice(8, 10))}</span>
                  <span className="block text-sm text-gray-600">{day(o.date, { month: 'short' })}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug">{o.event.name}</span>
                  <span className="block text-sm text-gray-600">
                    {[o.event.location?.city, `${formatTime(o.startTime)} – ${formatTime(o.endTime)}`].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default ComingUp;
