import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Share2, MapPin, ExternalLink } from 'lucide-react';
import type { Market, MarketEvent, User } from '../types';
import {
  formatTime, upcomingOccurrences, nextOccurrence, recurrenceSummary,
  downloadIcs, buildGoogleCalendarUrl, eventUrl, directionsUrl,
  type CalendarOccurrence,
} from '../utils';

// One page per market event (T013): the hero with the next (or shared) date,
// every date in the next 6 weeks with cancelled ones crossed out, the poster,
// where it is and who hosts it.

const TAG_LABELS: Record<string, string> = {
  seasonalMarket: 'Seasonal',
  onFarm:         'On-Farm',
  indoorMarket:   'Indoor',
  juried:         'Juried',
};

interface EventPageProps {
  market: Market;
  event: MarketEvent;
  selectedDate?: string; // from ?date= on a shared link
  currentUser: User | null;
  isFollowing: boolean;
  onToggleFollow: (marketId: string) => void;
  onOpenLoginModal: () => void;
  onBack: () => void;
}

const longDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
const hours = (o: { startTime: string; endTime: string }) => `${formatTime(o.startTime)} – ${formatTime(o.endTime)}`;

const card = 'bg-white rounded-2xl shadow-sm p-6 sm:p-7';
const h2 = 'font-serif text-xl sm:text-2xl text-brand-blue mb-3';

const EventPage: React.FC<EventPageProps> = ({
  market, event, selectedDate, currentUser, isFollowing, onToggleFollow, onOpenLoginModal, onBack,
}) => {
  const [copied, setCopied] = useState(false);
  const [calendarChoice, setCalendarChoice] = useState(false);

  useEffect(() => {
    const previous = document.title;
    document.title = `${event.name} · VI Markets`;
    return () => { document.title = previous; };
  }, [event.name]);

  // Every date in the next 6 weeks, cancelled ones included so they show crossed out
  const dates = upcomingOccurrences([event], 42, new Date(), { includeCancelled: true });

  // The top box: the shared date if the link had one, otherwise the next real date
  let featured: CalendarOccurrence | null = null;
  let featuredLabel = 'Next market';
  if (selectedDate) {
    const match = dates.find(d => d.date === selectedDate);
    if (match) { featured = match; featuredLabel = match.cancelled ? 'This date is cancelled' : 'Your date'; }
  }
  if (!featured) featured = nextOccurrence(event);

  const repeats = recurrenceSummary(event);
  const marketType: string[] = (event as any).marketType ?? [];
  const about = event.description?.trim() || market.description?.trim() || '';
  const { venueName, address, city, province } = event.location;

  const handleShare = async () => {
    const url = eventUrl(market.slug ?? '', event, selectedDate);
    if (navigator.share) {
      try { await navigator.share({ title: event.name, text: `${event.name} on VI Markets`, url }); } catch { /* closed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  };

  const followButton = (
    <button
      type="button"
      onClick={() => (currentUser ? onToggleFollow(market.id) : onOpenLoginModal())}
      className={`mt-4 w-full min-h-[2.75rem] rounded-lg border-2 border-brand-light-blue font-semibold transition-colors ${
        isFollowing ? 'bg-brand-light-blue text-white' : 'bg-white text-brand-light-blue hover:bg-brand-cream'
      }`}
    >
      {isFollowing ? 'Following this market' : 'Follow this market'}
    </button>
  );

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <button type="button" onClick={onBack} className="text-brand-light-blue hover:text-brand-blue font-semibold">
          &larr; Back
        </button>

        {/* Hero */}
        <section className="mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-2 bg-brand-light-blue" />
          <div className="p-6 sm:p-8 flex flex-wrap gap-6 justify-between items-end">
            <div className="flex-[1_1_28rem] min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {repeats && (
                  <span className="bg-brand-cream text-brand-light-blue text-sm font-semibold px-3 py-1 rounded-full">{repeats}</span>
                )}
                {[...marketType, ...event.marketTags.map(t => TAG_LABELS[t] ?? t)].map(label => (
                  <span key={label} className="bg-brand-violet/10 text-brand-violet text-sm font-semibold px-3 py-1 rounded-full">{label}</span>
                ))}
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-brand-blue leading-tight break-words">{event.name}</h1>
              <p className="mt-2 text-base text-brand-text">
                Hosted by{' '}
                <Link to={`/markets/${market.slug}`} className="font-semibold text-brand-light-blue underline hover:text-brand-blue">
                  {market.name}
                </Link>
              </p>
            </div>

            <div className="flex-[0_1_22rem] w-full bg-brand-cream rounded-xl p-5">
              {featured ? (
                <>
                  <p className={`text-sm font-semibold uppercase tracking-wide ${featured.cancelled ? 'text-brand-gold' : 'text-brand-light-blue'}`}>
                    {featuredLabel}
                  </p>
                  <p className={`mt-1 text-2xl font-semibold text-brand-text ${featured.cancelled ? 'line-through text-gray-500' : ''}`}>
                    {longDate(featured.date)}
                  </p>
                  {!featured.cancelled && (
                    <p className="text-base text-brand-text">{hours(featured)} · {venueName}</p>
                  )}
                  {featured.changed && !featured.cancelled && (
                    <p className="text-sm text-brand-violet mt-1">Changed hours for this date</p>
                  )}
                  {featured.note && <p className="text-sm text-gray-600 mt-1">{featured.note}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!featured.cancelled && (
                      calendarChoice ? (
                        <>
                          <button
                            type="button"
                            onClick={() => { downloadIcs(event, featured!.date, featured!.startTime, featured!.endTime); setCalendarChoice(false); }}
                            className="min-h-[2.75rem] px-4 rounded-lg bg-brand-light-blue text-white font-semibold hover:bg-brand-light-blue/90"
                          >
                            Apple / Outlook
                          </button>
                          <a
                            href={buildGoogleCalendarUrl(event, featured.date, featured.startTime, featured.endTime)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setCalendarChoice(false)}
                            className="min-h-[2.75rem] px-4 rounded-lg bg-brand-light-blue text-white font-semibold hover:bg-brand-light-blue/90 inline-flex items-center"
                          >
                            Google Calendar
                          </a>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCalendarChoice(true)}
                          className="min-h-[2.75rem] px-4 rounded-lg bg-brand-light-blue text-white font-semibold hover:bg-brand-light-blue/90 inline-flex items-center gap-2"
                        >
                          <CalendarPlus className="w-5 h-5" aria-hidden="true" /> Add to calendar
                        </button>
                      )
                    )}
                    <button
                      type="button"
                      onClick={handleShare}
                      className="min-h-[2.75rem] px-4 rounded-lg border-2 border-brand-blue bg-white text-brand-blue font-semibold hover:bg-gray-50 inline-flex items-center gap-2"
                    >
                      <Share2 className="w-5 h-5" aria-hidden="true" /> {copied ? 'Link copied' : 'Share'}
                    </button>
                  </div>
                  {selectedDate && featuredLabel === 'Next market' && (
                    <p className="text-sm text-gray-600 mt-3">
                      {selectedDate < new Date().toLocaleDateString('en-CA')
                        ? 'The date in your link has passed, so this shows the next one.'
                        : "The date in your link isn't on this market's schedule, so this shows the next one."}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">No upcoming dates</p>
                  <p className="mt-1 text-base text-brand-text">
                    This event has no dates coming up. Follow the market to hear when it's back.
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-6 items-start">
          {/* Main column */}
          <div className="flex-[999_1_34rem] min-w-0 flex flex-col gap-6">
            {(about || event.externalEventUrl) && (
              <section className={card}>
                <h2 className={h2}>About this market</h2>
                {about && <p className="text-base text-brand-text leading-relaxed whitespace-pre-line">{about}</p>}
                {event.externalEventUrl && (
                  <a
                    href={event.externalEventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-light-blue underline hover:text-brand-blue"
                  >
                    Event website <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
              </section>
            )}

            <section className={card}>
              <h2 className={`${h2} mb-1`}>Upcoming dates</h2>
              <p className="text-sm text-gray-600 mb-3">Next 6 weeks</p>
              {dates.length > 0 ? (
                <ul className="grid sm:grid-cols-2 gap-x-8">
                  {dates.map(o => {
                    const isSelected = o.date === selectedDate;
                    return (
                      <li
                        key={o.date}
                        className={`flex items-center gap-3 py-3 border-b border-gray-200 ${isSelected ? 'bg-brand-cream -mx-2 px-2 rounded-lg' : ''}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-base font-semibold ${o.cancelled ? 'line-through text-gray-500' : 'text-brand-text'}`}>
                            {longDate(o.date)}
                          </p>
                          <p className={`text-sm ${o.cancelled ? 'text-brand-gold' : o.changed ? 'text-brand-violet' : 'text-gray-600'}`}>
                            {o.cancelled ? 'Cancelled' : o.changed ? `Changed hours: ${hours(o)}` : hours(o)}
                            {isSelected && !o.cancelled ? ' · Your date' : ''}
                            {o.note ? ` · ${o.note}` : ''}
                          </p>
                        </div>
                        {!o.cancelled && (
                          <button
                            type="button"
                            onClick={() => downloadIcs(event, o.date, o.startTime, o.endTime)}
                            aria-label={`Add ${longDate(o.date)} to calendar`}
                            title="Add to calendar"
                            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-brand-light-blue hover:bg-brand-cream"
                          >
                            <CalendarPlus className="w-5 h-5" aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-base text-gray-600">No dates in the next 6 weeks.</p>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="flex-[1_1_18rem] min-w-0 flex flex-col gap-6">
            {event.posterUrl && (
              <section className="bg-white rounded-2xl shadow-sm p-4">
                <a href={event.posterUrl} target="_blank" rel="noopener noreferrer">
                  <img src={event.posterUrl} alt={`Poster for ${event.name}`} className="w-full rounded-lg" />
                </a>
                <p className="mt-3 text-center">
                  <a href={event.posterUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-light-blue underline hover:text-brand-blue">
                    View full size
                  </a>
                </p>
              </section>
            )}

            <section className={card}>
              <h2 className={h2}>Where</h2>
              <p className="font-semibold text-brand-text">{venueName}</p>
              {address && <p className="text-brand-text">{address}</p>}
              {(city || province) && <p className="text-brand-text">{[city, province].filter(Boolean).join(', ')}</p>}
              <a
                href={directionsUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 font-semibold text-brand-light-blue underline hover:text-brand-blue"
              >
                <MapPin className="w-4 h-4" aria-hidden="true" /> Get directions
              </a>
            </section>

            <section className={card}>
              <h2 className={h2}>Hosted by</h2>
              <div className="flex items-center gap-3">
                {market.logoUrl && (
                  <img src={market.logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-brand-text break-words">{market.name}</p>
                  <Link to={`/markets/${market.slug}`} className="text-brand-light-blue underline hover:text-brand-blue">
                    View market profile
                  </Link>
                </div>
              </div>
              {followButton}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default EventPage;
