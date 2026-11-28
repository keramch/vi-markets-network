import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Share2, MapPin, ExternalLink } from 'lucide-react';
import type { Organizer, Market, User, Vendor } from '../types';
import { HeartIcon } from './Icons';
import {
  formatTime, upcomingOccurrences, nextOccurrence, recurrenceSummary, pastDates, isVendorDate,
  buildGoogleCalendarUrl, marketUrl, directionsUrl, prefersShareSheet,
  type CalendarOccurrence,
} from '../utils';

// A market's page (T013, T128): /markets/<slug>. The hero with the next (or
// shared) date, upcoming dates with cancelled ones crossed out, the vendors
// who'll be there, the poster, where it is and who runs it. Unclaimed markets
// (no organizer yet) say where their information came from and how the
// organizer can claim them. Past dates sit folded away at the bottom.

const TAG_LABELS: Record<string, string> = {
  seasonalMarket: 'Seasonal',
  onFarm:         'On-Farm',
  indoorMarket:   'Indoor',
  juried:         'Juried',
};

interface MarketPageProps {
  market: Market;
  // The organizer, when their page is public. Undefined with market.organizerId
  // set means the organizer's page isn't public yet (T140); with none, unclaimed.
  organizer?: Organizer;
  vendorsAttending: { vendor: Vendor; dates: string[] }[];
  selectedDate?: string; // from ?date= on a shared link
  currentUser: User | null;
  isSaved: boolean;
  onToggleSave: (marketId: string) => void;
  onOpenLoginModal: () => void;
  onBack: () => void;
}

const longDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
const longDateYear = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
// '' times = to be confirmed (markets added from vendors' information)
const hours = (o: { startTime: string; endTime: string }) =>
  o.startTime && o.endTime ? `${formatTime(o.startTime)} – ${formatTime(o.endTime)}` : 'Times to be confirmed';

const card = 'bg-white rounded-2xl shadow-sm p-6 sm:p-7';
const h2 = 'font-serif text-xl sm:text-2xl text-brand-blue mb-3';

const MarketPage: React.FC<MarketPageProps> = ({
  market, organizer, vendorsAttending, selectedDate, currentUser, isSaved, onToggleSave, onOpenLoginModal, onBack,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const previous = document.title;
    document.title = `${market.name} · VI Markets`;
    return () => { document.title = previous; };
  }, [market.name]);

  // Upcoming dates, cancelled ones included so they show crossed out. A repeating
  // market shows the next 6 weeks; a market on a list of dates shows them all.
  const dayWindow = market.type === 'recurring' ? 42 : 800;
  const dates = upcomingOccurrences([market], dayWindow, new Date(), { includeCancelled: true });
  const past = pastDates(market);

  // The top box: the shared date if the link had one, otherwise the next real date
  let featured: CalendarOccurrence | null = null;
  let featuredLabel = 'Next market';
  if (selectedDate) {
    const match = dates.find(d => d.date === selectedDate);
    if (match) { featured = match; featuredLabel = match.cancelled ? 'This date is cancelled' : 'Your date'; }
  }
  if (!featured) featured = nextOccurrence(market);

  const repeats = recurrenceSummary(market);
  const marketType: string[] = market.marketType ?? [];
  const about = market.description?.trim() || organizer?.description?.trim() || '';
  const { venueName, address, city, province } = market.location;
  const place = [venueName, city].filter(Boolean).join(' · ');
  const hasWhere = !!(venueName || address || city);
  const unclaimed = !market.organizerId;
  // Shown as plain text when there's no public organizer page to link to (T140)
  const organizedBy = market.organizedBy?.trim() ?? '';
  const claimHref = `mailto:hello@vimarkets.ca?subject=${encodeURIComponent(`This is my market: ${market.name}`)}`;

  const handleShare = async () => {
    const url = marketUrl(market, selectedDate);
    if (prefersShareSheet()) {
      try { await navigator.share({ title: market.name, text: `${market.name} on VI Markets`, url }); } catch { /* closed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* clipboard blocked */ }
  };

  const saveButton = (
    <button
      type="button"
      onClick={() => (currentUser ? onToggleSave(market.id) : onOpenLoginModal())}
      aria-pressed={isSaved}
      className={`min-h-[2.75rem] px-4 rounded-full border-2 border-brand-light-blue font-semibold inline-flex items-center gap-2 transition-colors ${
        isSaved ? 'bg-brand-light-blue text-white' : 'bg-white text-brand-light-blue hover:bg-brand-cream'
      }`}
      title={currentUser ? undefined : 'Log in or sign up to save'}
    >
      <HeartIcon className={`w-5 h-5 ${isSaved ? 'text-white' : 'text-brand-gold'}`} filled={isSaved} />
      {isSaved ? 'Saved' : 'Save'}
    </button>
  );

  const dateNote = (date: string) => (isVendorDate(market, date) ? ' · Date from a vendor' : '');

  return (
    <div className="bg-brand-cream min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <button type="button" onClick={onBack} className="min-h-[2.75rem] text-brand-light-blue hover:text-brand-blue font-semibold">
          &larr; Back
        </button>

        {/* Hero */}
        <section className="mt-2 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-2 bg-brand-light-blue" />
          <div className="p-6 sm:p-8 flex flex-wrap gap-6 justify-between items-end">
            <div className="flex-[1_1_28rem] min-w-0">
              <div className="flex flex-wrap gap-2 mb-3">
                {repeats && (
                  <span className="bg-brand-cream text-brand-light-blue text-sm font-semibold px-3 py-1 rounded-full">{repeats}</span>
                )}
                {[...marketType, ...(market.marketTags ?? []).map(t => TAG_LABELS[t] ?? t)].map(label => (
                  <span key={label} className="bg-brand-violet/10 text-brand-violet text-sm font-semibold px-3 py-1 rounded-full">{label}</span>
                ))}
              </div>
              <div className="flex items-start gap-4">
                {(market.logoUrl || organizer?.logoUrl) && (
                  <img src={market.logoUrl || organizer?.logoUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <h1 className="font-serif text-3xl sm:text-4xl text-brand-blue leading-tight break-words">{market.name}</h1>
                  {place && <p className="mt-1 text-base text-gray-600">{place}</p>}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {organizer ? (
                  <p className="text-base text-brand-text">
                    Run by{' '}
                    <Link to={`/organizers/${organizer.slug}`} className="font-semibold text-brand-light-blue underline hover:text-brand-blue">
                      {organizer.name}
                    </Link>
                  </p>
                ) : organizedBy ? (
                  <p className="text-base text-brand-text">
                    Run by <span className="font-semibold">{organizedBy}</span>
                  </p>
                ) : null}
                {saveButton}
              </div>
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
                    <p className="text-base text-brand-text">{[hours(featured), venueName].filter(Boolean).join(' · ')}</p>
                  )}
                  {isVendorDate(market, featured.date) && (
                    <p className="text-sm text-gray-600 mt-1">Date from a vendor: check with the market before you go.</p>
                  )}
                  {featured.changed && !featured.cancelled && (
                    <p className="text-sm text-brand-violet mt-1">Changed hours for this date</p>
                  )}
                  {featured.note && <p className="text-sm text-gray-600 mt-1">{featured.note}</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* Google Calendar adds straight to the person's calendar; .ics
                        downloads were dropped (Kera, Nov 10) */}
                    {!featured.cancelled && (
                      <a
                        href={buildGoogleCalendarUrl(market, featured.date, featured.startTime, featured.endTime)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[2.75rem] px-4 rounded-lg bg-brand-light-blue text-white font-semibold hover:bg-brand-light-blue/90 inline-flex items-center gap-2"
                      >
                        <CalendarPlus className="w-5 h-5" aria-hidden="true" /> Add to Google Calendar
                      </a>
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
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-600">No upcoming dates announced</p>
                  <p className="mt-1 text-base text-brand-text">
                    Save this market to find it again when its next dates are up.
                  </p>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="mt-4 min-h-[2.75rem] px-4 rounded-lg border-2 border-brand-blue bg-white text-brand-blue font-semibold hover:bg-gray-50 inline-flex items-center gap-2"
                  >
                    <Share2 className="w-5 h-5" aria-hidden="true" /> {copied ? 'Link copied' : 'Share'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap gap-6 items-start">
          {/* Main column */}
          <div className="flex-[999_1_34rem] min-w-0 flex flex-col gap-6">
            {(about || market.externalEventUrl) && (
              <section className={card}>
                <h2 className={h2}>About this market</h2>
                {about && <p className="text-base text-brand-text leading-relaxed whitespace-pre-line">{about}</p>}
                {market.externalEventUrl && (
                  <a
                    href={market.externalEventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 font-semibold text-brand-light-blue underline hover:text-brand-blue"
                  >
                    Market website <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                )}
              </section>
            )}

            <section className={card}>
              <h2 className={`${h2} mb-1`}>Upcoming dates</h2>
              {market.type === 'recurring' && <p className="text-sm text-gray-600 mb-3">Next 6 weeks</p>}
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
                            {dateNote(o.date)}
                          </p>
                        </div>
                        {!o.cancelled && (
                          <a
                            href={buildGoogleCalendarUrl(market, o.date, o.startTime, o.endTime)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Add ${longDate(o.date)} to Google Calendar`}
                            title="Add to Google Calendar"
                            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-lg border border-gray-300 bg-white text-brand-light-blue hover:bg-brand-cream"
                          >
                            <CalendarPlus className="w-5 h-5" aria-hidden="true" />
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-base text-gray-600">No upcoming dates announced yet.</p>
              )}
            </section>

            {vendorsAttending.length > 0 && (
              <section className={card}>
                <h2 className={h2}>Vendors who'll be there</h2>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {vendorsAttending.map(({ vendor, dates: vDates }) => (
                    <li key={vendor.id}>
                      <Link
                        to={`/vendors/${vendor.slug}`}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-brand-cream"
                      >
                        {vendor.logoUrl ? (
                          <img src={vendor.logoUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <span className="w-12 h-12 rounded-lg bg-brand-cream flex-shrink-0" aria-hidden="true" />
                        )}
                        <span className="min-w-0">
                          <span className="block font-semibold text-brand-text break-words">{vendor.name}</span>
                          {vDates.length > 0 && (
                            <span className="block text-sm text-gray-600">{vDates.map(longDate).join(', ')}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {past.length > 0 && (
              <details className={card}>
                <summary className="cursor-pointer font-semibold text-brand-light-blue min-h-[2.75rem] flex items-center">
                  Past dates ({past.length})
                </summary>
                <ul className="mt-3 grid sm:grid-cols-2 gap-x-8">
                  {past.map(d => (
                    <li key={d} className="py-2 border-b border-gray-200 text-base text-brand-text">{longDateYear(d)}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* Sidebar */}
          <aside className="flex-[1_1_18rem] min-w-0 flex flex-col gap-6">
            {market.posterUrl && (
              <section className="bg-white rounded-2xl shadow-sm p-4">
                <a href={market.posterUrl} target="_blank" rel="noopener noreferrer">
                  <img src={market.posterUrl} alt={`Poster for ${market.name}`} className="w-full rounded-lg" />
                </a>
                <p className="mt-3 text-center">
                  <a href={market.posterUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-light-blue underline hover:text-brand-blue">
                    View full size
                  </a>
                </p>
              </section>
            )}

            {hasWhere && (
              <section className={card}>
                <h2 className={h2}>Where</h2>
                {venueName && <p className="font-semibold text-brand-text">{venueName}</p>}
                {address && <p className="text-brand-text">{address}</p>}
                {(city || province) && <p className="text-brand-text">{[city, province].filter(Boolean).join(', ')}</p>}
                <a
                  href={directionsUrl(market)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 font-semibold text-brand-light-blue underline hover:text-brand-blue"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" /> Get directions
                </a>
              </section>
            )}

            {organizer ? (
              <section className={card}>
                <h2 className={h2}>Run by</h2>
                <div className="flex items-center gap-3">
                  {organizer.logoUrl && (
                    <img src={organizer.logoUrl} alt="" className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-brand-text break-words">{organizer.name}</p>
                    <Link to={`/organizers/${organizer.slug}`} className="text-brand-light-blue underline hover:text-brand-blue">
                      See all their markets
                    </Link>
                  </div>
                </div>
              </section>
            ) : unclaimed ? (
              <section className={card}>
                <h2 className={h2}>Is this your market?</h2>
                <p className="text-base text-brand-text">
                  VI Markets listed this market from vendor and public information. If you run it, we'll hand it over so you can keep it up to date, for free.
                </p>
                <a
                  href={claimHref}
                  className="mt-4 inline-flex min-h-[2.75rem] items-center px-4 rounded-lg bg-brand-light-blue text-white font-semibold hover:bg-brand-light-blue/90"
                >
                  Tell us it's yours
                </a>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default MarketPage;
