

import React from 'react';
import type { Market, Vendor, User, Review, Application, MarketEvent } from '../types';
import { MapPinIcon, CalendarIcon, InstagramIcon, FacebookIcon, PinterestIcon, TikTokIcon, RibbonIcon } from './Icons';
import { UserPlus, UserCheck, Globe } from 'lucide-react';
import ReviewForm from './ReviewForm';
import ContactForm from './ContactForm';
import { formatTime } from '../utils';
import ShareButton from './ShareButton';

interface MarketProfileProps {
  market: Market;
  vendors: Vendor[];
  applications: Application[];
  owner?: User | null;
  onSelectVendor: (id: string) => void;
  onBack: () => void;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  currentUser: User | null;
  onAddReview: (reviewData: { rating: number, comment: string }) => void;
  onFeatureMarket: (marketId: string) => void;
  onContactSubmit: (recipientEmail: string, subject: string) => void;
  onApply: (marketId: string) => void;
  upcomingEvents?: MarketEvent[];
  onOpenLoginModal: () => void;
}

const formatScheduleToString = (schedule: Market['schedule']): string => {
  if (!schedule || !schedule.rules || schedule.rules.length === 0) {
    return schedule?.notes || 'Schedule varies';
  }
  const mainRule = schedule.rules[0];
  const day = `${mainRule.dayOfWeek}s`;
  const time = `${formatTime(mainRule.startTime)} - ${formatTime(mainRule.endTime)}`;
  const noteText = schedule.notes ? `, ${schedule.notes}` : '';
  return `${day}, ${time}${noteText}`;
};

const InfoRow: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-start">
    <dt className="flex items-center text-gray-500 w-32 flex-shrink-0">
      <span className="mr-2 text-brand-light-blue">{icon}</span>
      <span className="font-semibold text-brand-blue">{label}</span>
    </dt>
    <dd className="text-brand-text">{value}</dd>
  </div>
);

const MarketProfile: React.FC<MarketProfileProps> = ({
  market, vendors, applications, owner,
  isFavorited, onToggleFavorite, currentUser,
  onAddReview, onFeatureMarket, onContactSubmit, onApply,
  upcomingEvents = [], onOpenLoginModal,
}) => {
  const currentUserVendor = currentUser && currentUser.ownedVendorId
    ? vendors.find(v => v.id === currentUser.ownedVendorId)
    : null;
  const isProVendor = currentUser?.subscription?.tier === 'pro'
    || currentUser?.subscription?.tier === 'superPro'
    || currentUser?.subscription?.foundingMember === true;
  const hasApplied = applications.some(
    app => app.vendorId === currentUserVendor?.id && app.marketId === market.id
  );

  let canApply = true;
  let applicationDisabledReason = '';
  if (market.allowedVendorCategories && market.allowedVendorCategories.length > 0) {
    const vendorMatchesCategory = currentUserVendor && (
      currentUserVendor.categories && currentUserVendor.categories.length > 0
        ? currentUserVendor.categories.some(cat => market.allowedVendorCategories!.includes(cat))
        : market.allowedVendorCategories.includes(currentUserVendor.category)
    );
    if (!vendorMatchesCategory) {
      canApply = false;
      applicationDisabledReason = `This market does not accept applications from the "${currentUserVendor?.category || 'your'}" category.`;
    }
  }

  const isFoundingMember = owner?.subscription?.foundingMember;
  const heroObjPosition = market.headerPhotoPosition === 'top' ? 'center 25%'
    : market.headerPhotoPosition === 'bottom' ? 'center 75%'
    : 'center 50%';
  const approvedReviews = market.reviews.filter(r => r.status === 'approved');
  const displayedReviews = approvedReviews.slice(0, 12);
  const hasAlreadyReviewed = currentUser
    ? market.reviews.some(r => r.userId === currentUser.id)
    : false;

  const followButton = currentUser ? (
    <button
      onClick={() => onToggleFavorite(market.id)}
      className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${
        isFavorited ? 'bg-brand-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'
      }`}
      aria-label={isFavorited ? 'Unfollow this market' : 'Follow this market'}
    >
      {isFavorited ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
      {isFavorited ? 'Following' : 'Follow'}
    </button>
  ) : (
    <button
      onClick={onOpenLoginModal}
      className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-white text-gray-500 hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap"
      title="Log in or sign up to follow"
    >
      <UserPlus className="w-4 h-4" />
      Follow
    </button>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">

        {/* ── Hero ────────────────────────────────────────────────────── */}
        <div className="relative hidden md:block">
          {(market.headerPhotoUrl ?? market.photos?.[0])
            ? <img className="w-full h-56 md:h-72 object-cover" src={market.headerPhotoUrl ?? market.photos![0]} alt="" style={{ objectPosition: heroObjPosition }} />
            : <div className="w-full h-56 md:h-72 bg-brand-cream flex items-center justify-center"><span className="text-brand-blue/20 text-8xl font-serif">{market.name[0]}</span></div>
          }
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(74,66,67,0.72) 0%, transparent 42%)' }}
          />
        </div>

        {/* ── Identity Panel ──────────────────────────────────────────── */}
        <div className="bg-[#D6E9E6] border-b-[3px] border-brand-light-blue px-6 md:px-8 pt-4 md:pt-3 pb-6">
          <div className="flex items-start gap-3">

            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex flex-col items-start gap-2 flex-shrink-0">
                <div className="relative md:-mt-10 flex-shrink-0 z-10">
                  {market.logoUrl
                    ? <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                        <img className="w-full h-full object-contain" src={market.logoUrl} alt={`${market.name} logo`} />
                      </div>
                    : <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-brand-blue/10 flex items-center justify-center">
                        <span className="text-brand-blue text-4xl font-serif">{market.name[0]}</span>
                      </div>
                  }
                </div>

                {/* Mobile only: Follow stacked under logo */}
                <div className="flex md:hidden flex-col items-start gap-2">
                  {followButton}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-1.5 flex-wrap justify-start">
                  {isFoundingMember && (
                    <span className="text-brand-gold" title="Founding Member">
                      <RibbonIcon className="w-5 h-5" />
                    </span>
                  )}
                  <h1 className="text-3xl font-serif font-normal text-brand-blue">{market.name}</h1>
                </div>
                {market.marketTypes && market.marketTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
                    {market.marketTypes.map(t => (
                      <span key={t} className="text-sm bg-white border border-gray-200 text-brand-blue px-2.5 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop only: Follow inline on the right */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0 pt-2">
              {followButton}
            </div>

            <div className="flex-shrink-0 pt-2">
              <ShareButton className="p-2 rounded-full transition-colors duration-200 text-gray-400 hover:bg-white hover:text-brand-blue" />
            </div>

          </div>
        </div>

        {/* ── Section 2: About + Upcoming Events | Market Info + Good to Know ── */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* Left: About + Upcoming Events */}
            <div className="md:col-span-2">
              <h2 className="text-2xl font-serif text-brand-blue mb-4">About Us</h2>
              <p className="text-brand-text leading-relaxed whitespace-pre-line">{market.description}</p>

              <hr className="my-6 border-gray-200" />

              <h3 className="text-xl font-serif text-brand-blue mb-4">Upcoming Events</h3>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map(event => {
                    const dateStr = event.schedule.date || event.schedule.startDate || '';
                    const formattedDate = dateStr
                      ? new Date(dateStr + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
                      : '';
                    const timeStr = `${formatTime(event.schedule.startTime)} – ${formatTime(event.schedule.endTime)}`;
                    return (
                      <div key={event.id} className="flex items-start gap-3">
                        <span className="mt-2 w-2 h-2 rounded-full bg-brand-light-blue flex-shrink-0" />
                        <div className="min-w-[5.625rem] flex-shrink-0">
                          <span className="text-base font-semibold text-gray-700">{formattedDate}</span>
                        </div>
                        <div>
                          {event.externalEventUrl ? (
                            <a
                              href={event.externalEventUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-base font-medium text-brand-teal hover:underline"
                            >
                              {event.name}
                            </a>
                          ) : (
                            <p className="text-base font-medium text-brand-text">{event.name}</p>
                          )}
                          <p className="text-sm text-gray-500">{event.location.venueName} · {timeStr}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No upcoming events listed yet.</p>
              )}
            </div>

            {/* Right: Market Info + Good to Know stacked */}
            <div className="space-y-5">

              {/* Market Info card */}
              <div className="bg-brand-cream rounded-lg p-5">
                <h3 className="text-xl font-serif text-brand-blue mb-4">Market Info</h3>
                <dl className="space-y-4">
                  <InfoRow
                    label="Location"
                    value={market.location.address}
                    icon={<MapPinIcon className="w-5 h-5" />}
                  />
                  <InfoRow
                    label="Schedule"
                    value={formatScheduleToString(market.schedule)}
                    icon={<CalendarIcon className="w-5 h-5" />}
                  />
                </dl>

                {currentUserVendor && isProVendor && market.applicationFormQuestions && (
                  <div className="mt-5 pt-5 border-t border-gray-300">
                    {hasApplied ? (
                      <button disabled className="w-full bg-green-200 text-green-800 font-semibold py-2 px-4 rounded-md cursor-not-allowed">
                        Application Submitted
                      </button>
                    ) : canApply ? (
                      <button
                        onClick={() => onApply(market.id)}
                        className="w-full bg-brand-blue text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                      >
                        Apply to this Market
                      </button>
                    ) : (
                      <div className="text-center">
                        <button disabled className="w-full bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-md cursor-not-allowed">
                          Cannot Apply
                        </button>
                        <p className="text-xs text-red-600 mt-2">{applicationDisabledReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* HIDDEN: Featured listings — not yet implemented, see Phase 3 */}
                {false && currentUser && !market.isFeatured && (
                  <div className="mt-5 pt-5 border-t border-gray-300">
                    <button
                      onClick={() => onFeatureMarket(market.id)}
                      className="w-full bg-brand-gold text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                    >
                      ⭐️ Feature this Market
                    </button>
                  </div>
                )}

                <div className="mt-5 h-48 bg-gray-300 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">[ Map Placeholder ]</p>
                </div>
              </div>

              {/* Good to Know card */}
              {(market.accessibility || (market.paymentOptions && market.paymentOptions.length > 0) || (market.tags && market.tags.length > 0) || market.seasonalInfo) && (
                <div className="bg-brand-cream rounded-lg p-5">
                  <h3 className="text-xl font-serif text-brand-blue mb-4">Good to Know</h3>
                  <div className="space-y-4">
                    {market.accessibility && (
                      <div>
                        <p className="text-xs font-semibold text-brand-blue uppercase tracking-wide mb-1">Accessibility</p>
                        <p className="text-sm text-brand-text">{market.accessibility}</p>
                      </div>
                    )}
                    {market.paymentOptions && market.paymentOptions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-brand-blue uppercase tracking-wide mb-1.5">Payments</p>
                        <div className="flex flex-wrap gap-1.5">
                          {market.paymentOptions.map(opt => (
                            <span key={opt} className="bg-white border border-gray-200 text-xs text-gray-700 px-2.5 py-0.5 rounded-full">{opt}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {market.seasonalInfo && (
                      <div>
                        <p className="text-xs font-semibold text-brand-blue uppercase tracking-wide mb-1">Seasonal</p>
                        <p className="text-sm text-brand-text">{market.seasonalInfo}</p>
                      </div>
                    )}
                    {market.tags && market.tags.length > 0 && (
                      <div>
                        <div className="flex flex-wrap gap-1.5">
                          {market.tags.map(tag => (
                            <span key={tag} className="bg-white border border-gray-200 text-xs text-gray-700 px-2.5 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ── Section 3: Connect | Gallery ────────────────────────────────── */}
        <div className="p-6 md:p-8 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left: Connect */}
            <div>
              <h2 className="text-2xl text-brand-blue font-serif mb-5">Connect with {market.name}</h2>
              {market.contact?.socials && (
                <div className="flex gap-3 mb-5">
                  {market.contact.socials.instagram && (
                    <a href={`https://instagram.com/${market.contact.socials.instagram}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <InstagramIcon className="w-5 h-5" />
                    </a>
                  )}
                  {market.contact.socials.facebook && (
                    <a href={`https://facebook.com/${market.contact.socials.facebook}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <FacebookIcon className="w-5 h-5" />
                    </a>
                  )}
                  {market.contact.socials.pinterest && (
                    <a href={`https://pinterest.com/${market.contact.socials.pinterest}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <PinterestIcon className="w-5 h-5" />
                    </a>
                  )}
                  {market.contact.socials.tiktok && (
                    <a href={`https://tiktok.com/@${market.contact.socials.tiktok}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <TikTokIcon className="w-5 h-5" />
                    </a>
                  )}
                  {market.contact.socials.website && (
                    <a href={market.contact.socials.website.startsWith('http') ? market.contact.socials.website : `https://${market.contact.socials.website}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
              <ContactForm recipientEmail={market.contact?.email} currentUser={currentUser} onSend={onContactSubmit} />
            </div>

            {/* Right: Gallery */}
            {market.photos && market.photos.length > 0 && (
              <div>
                <h2 className="text-2xl text-brand-blue font-serif mb-5">Gallery</h2>
                <div className="grid grid-cols-2 gap-2">
                  {market.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt={`${market.name} photo ${i + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Section 4: Reviews ──────────────────────────────────────────── */}
        <div className="p-6 md:p-8 border-t">
          <h2 className="text-2xl text-brand-blue font-serif mb-6">Reviews</h2>
          {currentUser
            ? hasAlreadyReviewed
              ? <p className="text-sm text-gray-500 mb-8">You've already reviewed this profile.</p>
              : <div className="mb-8"><ReviewForm onSubmit={onAddReview} /></div>
            : (
              <p className="text-sm text-gray-500 mb-8">
                <button onClick={onOpenLoginModal} className="text-brand-teal hover:underline font-medium">Log in</button>
                {' '}or{' '}
                <a href="/signup" className="text-brand-teal hover:underline font-medium">sign up free</a>
                {' '}to leave a review.
              </p>
            )
          }
          {approvedReviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedReviews.map(review => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-brand-text">{review.author}</span>
                      {review.reviewerAccountType === 'vendor' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cream text-brand-teal font-medium">Vendor</span>
                      )}
                      {review.reviewerAccountType === 'market' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cream text-brand-teal font-medium">Organizer</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">{review.date}</p>
                  </div>
                ))}
              </div>
              {approvedReviews.length > 12 && (
                <p className="text-sm text-gray-400 mt-4">Showing 12 of {approvedReviews.length} reviews</p>
              )}
            </>
          ) : (
            <p className="text-gray-500">This market has no reviews yet.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default MarketProfile;
