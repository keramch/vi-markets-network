import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Market, User } from '../types';
import AddYourMarketButton from './AddYourMarketButton';
import { upcomingOccurrences, formatTime, marketPath, recurrenceSummary, shortSeriesRange } from '../utils';

// "Coming up" on the home page banner (T122): the next three market dates,
// live from published markets (claimed or not, T128), each linking to its
// market page. Beside them, the first market's own poster, else a simple
// calendar graphic. Nothing upcoming means nothing is rendered.

interface ComingUpProps {
  markets: Market[]; // published markets
  currentUser: User | null; // for the "Add your market!" button (T137)
}

// A simple calendar page in the brand colours, drawn from shapes: no dates,
// so it never goes out of date. Decorative; the link around it is labelled.
const CalendarGraphic: React.FC = () => {
  const dots: Record<number, string> = { 5: '#D43B6A', 12: '#2E7A72', 13: '#2E7A72', 19: '#D43B6A', 26: '#2E7A72', 27: '#D43B6A' };
  return (
    <svg viewBox="0 0 192 200" className="block w-48 h-auto" aria-hidden="true">
      <rect x="16" y="22" width="160" height="162" rx="12" fill="#FFFFFF" stroke="#4A4243" strokeWidth="2.5" />
      <path d="M16 34a12 12 0 0 1 12-12h136a12 12 0 0 1 12 12v18H16z" fill="#2E7A72" />
      {[52, 84, 108, 140].map(x => (
        <rect key={x} x={x - 4} y="12" width="8" height="22" rx="4" fill="#FBF7EE" stroke="#4A4243" strokeWidth="2.5" />
      ))}
      {Array.from({ length: 35 }).map((_, i) => {
        const x = 28 + (i % 7) * 20.5;
        const y = 64 + Math.floor(i / 7) * 22.5;
        return (
          <g key={i}>
            <rect x={x} y={y} width="16" height="16" rx="4" fill="#EBF5EC" />
            {dots[i] && <circle cx={x + 8} cy={y + 8} r="5" fill={dots[i]} />}
          </g>
        );
      })}
    </svg>
  );
};

const ComingUp: React.FC<ComingUpProps> = ({ markets, currentUser }) => {
  const upcoming = useMemo(() => {
    const seen = new Set<string>();
    return upcomingOccurrences(markets, 120)
      // One row per market, so a weekly market doesn't fill the list
      .filter(o => {
        if (seen.has(o.event.id)) return false;
        seen.add(o.event.id);
        return true;
      })
      .slice(0, 3);
  }, [markets]);

  if (upcoming.length === 0) return null;

  // The picture always belongs to the first card: its poster, else a simple
  // calendar graphic (drawn below, no dates on it) linking to the calendar
  const first = upcoming[0];
  const poster = first.event.posterUrl;

  const day = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('en-CA', opts).replace('.', '');

  return (
    <aside aria-labelledby="coming-up-title" className="w-full lg:w-[31rem] flex-shrink-0 flex gap-4 items-start text-left">
      {/* The picture, with "Add your market!" under it (wide screens) */}
      <div className="hidden lg:flex flex-col items-center gap-4 w-48 flex-shrink-0">
      {poster ? (
        <Link
          to={marketPath(first.event, first.date)}
          className="block w-48 rounded-xl overflow-hidden shadow-xl bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
        >
          <span className="block px-3 py-2 bg-[rgba(44,40,40,0.9)] text-white text-sm leading-snug">
            <strong className="font-semibold">Next up:</strong> {first.event.name}, {shortSeriesRange(first.event) || day(first.date, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          {/* Shown at its own proportions, never cropped */}
          <img src={poster} alt={`${first.event.name} poster`} className="block w-48 h-auto max-h-80 object-contain bg-white" />
        </Link>
      ) : (
        <Link
          to="/calendar"
          className="block w-48 rounded-xl overflow-hidden shadow-xl bg-[#FBF7EE] focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
        >
          <span className="block px-3 py-2 bg-[rgba(44,40,40,0.9)] text-white text-sm leading-snug">
            <strong className="font-semibold">Plan ahead:</strong> see the full calendar
          </span>
          <CalendarGraphic />
        </Link>
      )}
      <AddYourMarketButton currentUser={currentUser} onDark />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="coming-up-title" className="font-serif text-2xl text-white">Coming up</h2>
          <Link to="/calendar" className="text-sm font-semibold text-white underline hover:no-underline">Full calendar</Link>
        </div>
        <ul className="space-y-2">
          {upcoming.map(o => (
            <li key={`${o.event.id}-${o.date}`}>
              <Link
                to={marketPath(o.event, o.date)}
                className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg text-brand-text hover:bg-brand-cream focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70"
              >
                <span className="w-12 flex-shrink-0 text-center leading-tight">
                  <span className="block text-sm font-semibold text-brand-gold uppercase">{day(o.date, { weekday: 'short' })}</span>
                  <span className="block font-serif text-2xl text-brand-blue leading-none">{Number(o.date.slice(8, 10))}</span>
                  <span className="block text-sm text-gray-600">{day(o.date, { month: 'short' })}</span>
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-semibold leading-snug">{o.event.name}</span>
                  {/* Multi-day ("Sat, Nov 28 – Sun, Nov 29") or repeating ("Every Fri/Sat/Sun") */}
                  {recurrenceSummary(o.event) && (
                    <span className="block text-sm font-semibold text-brand-light-blue">{recurrenceSummary(o.event)}</span>
                  )}
                  <span className="block text-sm text-gray-600">
                    {[o.event.location?.city, o.startTime && o.endTime ? `${formatTime(o.startTime)} – ${formatTime(o.endTime)}` : ''].filter(Boolean).join(' · ')}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="lg:hidden pt-2">
          <AddYourMarketButton currentUser={currentUser} onDark />
        </div>
      </div>
    </aside>
  );
};

export default ComingUp;
