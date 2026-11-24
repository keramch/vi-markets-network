import React, { useState } from 'react';
import { getVendorTypes } from '../utils';
import type { SpamGuardFields } from './SpamGuard';
import type { Organizer, Vendor, User, Review, Application, Market } from '../types';
import { MapPinIcon, RibbonIcon, HeartIcon } from './Icons';
import SocialLinks, { socialLinks } from './SocialLinks';
import PhotoGallery from './PhotoGallery';
import ProfileChecklist, { type ChecklistItem } from './ProfileChecklist';
import ReviewForm from './ReviewForm';
import ContactForm from './ContactForm';
import { formatTime, upcomingOccurrences, recurrenceSummary, eventPath } from '../utils';
import { Link } from 'react-router-dom';
import ShareButton from './ShareButton';

interface MarketProfileProps {
  market: Organizer;
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
  onContactSubmit: (params: { recipientEmail: string; recipientName: string; senderName: string; senderEmail: string; subject: string; message: string } & SpamGuardFields) => Promise<void>;
  onApply: (marketId: string) => void;
  upcomingEvents?: Market[];
  onOpenLoginModal: () => void;
}

const formatScheduleToString = (schedule: Organizer['schedule']): string => {
  if (!schedule || !schedule.rules || schedule.rules.length === 0) {
    return schedule?.notes || 'Schedule varies';
  }
  const mainRule = schedule.rules[0];
  const day = `${mainRule.dayOfWeek}s`;
  const time = `${formatTime(mainRule.startTime)} - ${formatTime(mainRule.endTime)}`;
  const noteText = schedule.notes ? `, ${schedule.notes}` : '';
  return `${day}, ${time}${noteText}`;
};

const MarketProfile: React.FC<MarketProfileProps> = ({
  market, vendors, applications, owner,
  isFavorited, onToggleFavorite, currentUser,
  onAddReview, onFeatureMarket, onContactSubmit, onApply,
  upcomingEvents = [], onOpenLoginModal,
}) => {
  const [contactOpen, setContactOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const upcomingDates = upcomingOccurrences(upcomingEvents);
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
    // Allowed types are chosen from the vendor types list, so compare with the vendor's real types
    const vendorMatchesCategory = !!currentUserVendor &&
      getVendorTypes(currentUserVendor).some(type => market.allowedVendorCategories!.includes(type));
    if (!vendorMatchesCategory) {
      canApply = false;
      applicationDisabledReason = `This market only accepts these vendor types: ${market.allowedVendorCategories.join(', ')}.`;
    }
  }

  const isFoundingMember = market.ownerFoundingMember ?? owner?.subscription?.foundingMember;
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
        isFavorited ? 'bg-white text-brand-blue' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'
      }`}
      aria-label={isFavorited ? 'Remove this market from your saved list' : 'Save this market'}
      aria-pressed={isFavorited}
    >
      <HeartIcon className="w-4 h-4 text-brand-gold" filled={isFavorited} />
      {isFavorited ? 'Saved' : 'Save'}
    </button>
  ) : (
    <button
      onClick={onOpenLoginModal}
      className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold bg-white text-gray-500 hover:bg-gray-100 transition-colors duration-200 whitespace-nowrap"
      title="Log in or sign up to save"
    >
      <HeartIcon className="w-4 h-4 text-brand-gold" />
      Save
    </button>
  );

  const emailButton = market.contact?.email ? (
    <button
      type="button"
      onClick={() => setContactOpen(o => !o)}
      aria-expanded={contactOpen}
      aria-controls="market-contact-disclosure"
      className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${
        contactOpen ? 'bg-brand-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'
      }`}
    >
      {contactOpen ? 'Close' : 'Email'}
    </button>
  ) : null;

  // ── What this profile has (T119): empty sections are left out, not shown blank
  const heroPhoto = market.headerPhotoUrl || market.photos?.[0];
  const hasAbout = !!market.description?.trim();
  const hasPhotos = (market.photos?.length ?? 0) > 0;
  const hasDates = upcomingDates.length > 0;
  const place = market.location?.city || market.location?.address;
  const hasSchedule = (market.schedule?.rules?.length ?? 0) > 0 || !!market.schedule?.notes?.trim();
  const showApply = !!currentUserVendor && isProVendor && !!market.applicationFormQuestions;
  const hasInfo = !!market.location?.address || hasSchedule || showApply;
  const hasGoodToKnow = !!market.accessibility || (market.paymentOptions?.length ?? 0) > 0 || (market.tags?.length ?? 0) > 0 || !!market.seasonalInfo;
  const hasSocials = socialLinks(market.contact).length > 0;
  const hasSidebar = hasInfo || hasSocials || hasGoodToKnow;
  const isOwner = !!currentUser && (currentUser.ownedOrganizerId === market.id || currentUser.id === market.ownerId);
  const avgRating = approvedReviews.length
    ? (approvedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / approvedReviews.length).toFixed(1)
    : null;

  // Owner checklist, most valuable first
  const socials = market.contact?.socials ?? {};
  const checklist: ChecklistItem[] = [
    { key: 'dates', done: hasDates, title: 'Add your market dates', short: 'market dates', why: 'Your dates appear here, on the calendar, and each gets a page you can share.', action: 'Add dates', to: '/dashboard/my-market' },
    { key: 'photos', done: (market.photos?.length ?? 0) >= 3, title: 'Add 3 or more photos of your market', short: 'photos', why: 'Photos fill your gallery and the banner at the top of your profile.', action: 'Add photos' },
    { key: 'about', done: (market.description?.trim().length ?? 0) >= 100, title: 'Describe your market in About us', short: 'About us', why: 'What makes it special, and what shoppers can expect when they visit.', action: 'Write About us' },
    { key: 'place', done: !!place, title: 'Add your location', short: 'location', why: 'Shown under your name, so shoppers know where to find you.', action: 'Add location' },
    { key: 'logo', done: !!market.logoUrl, title: 'Add your logo', short: 'logo', why: 'It shows on your profile and on your card in search results.', action: 'Add logo' },
    { key: 'socials', done: !!(socials.instagram || socials.facebook || socials.tiktok || socials.pinterest || socials.etsy), title: 'Add your Instagram or Facebook', short: 'social links', why: 'One more way for shoppers and vendors to keep up with you.', action: 'Add links' },
    { key: 'goodToKnow', done: hasGoodToKnow, title: 'Add a few Good to know details', short: 'Good to know', why: 'Payment options, accessibility and tags help shoppers plan their visit.', action: 'Add details' },
    { key: 'website', done: !!(market.contact?.website || socials.website), title: 'Add your website', short: 'website', why: 'Send shoppers and vendors to your own site.', action: 'Add website' },
  ];

  const sectionTitle = 'text-2xl text-brand-blue font-serif mb-3';
  const sideTitle = 'text-xl text-brand-blue font-serif mb-3';
  const sideCard = 'bg-[#F6FAF6] border border-gray-200 rounded-xl p-5';
  const label = 'text-sm font-semibold text-brand-blue mb-1';

  const reviewAction = currentUser
    ? hasAlreadyReviewed
      ? <p className="text-sm text-gray-600">You've already reviewed this profile.</p>
      : (
        <button
          type="button"
          onClick={() => setReviewOpen(o => !o)}
          aria-expanded={reviewOpen}
          className="min-h-[2.75rem] px-5 rounded-full border-2 border-brand-light-blue bg-white text-brand-light-blue text-sm font-semibold hover:bg-brand-cream"
        >
          {reviewOpen ? 'Close' : 'Write a review'}
        </button>
      )
    : (
      <p className="text-sm text-gray-600">
        <button type="button" onClick={onOpenLoginModal} className="text-brand-light-blue underline font-semibold">Log in</button>
        {' '}or{' '}
        <a href="/signup" className="text-brand-light-blue underline font-semibold">sign up free</a>
        {' '}to leave a review.
      </p>
    );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isOwner && <ProfileChecklist profileId={market.id} items={checklist} />}

      <div className="bg-white rounded-lg shadow-xl overflow-hidden">

        {/* ── Photo strip: only when there's a photo to show ─────────────── */}
        {heroPhoto && (
          <div className="relative hidden md:block">
            <img className="w-full h-56 md:h-72 object-cover" src={heroPhoto} alt="" style={{ objectPosition: heroObjPosition }} />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(74,66,67,0.72) 0%, transparent 42%)' }}
            />
          </div>
        )}

        {/* ── Identity Panel ──────────────────────────────────────────── */}
        <div className={`bg-[#D6E9E6] border-b-[3px] border-brand-gold px-6 md:px-8 pb-6 ${heroPhoto ? 'pt-4 md:pt-3' : 'pt-6 md:pt-8'}`}>
          <div className="flex items-start gap-3">

            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex flex-col items-start gap-2 flex-shrink-0">
                <div className={`relative flex-shrink-0 z-10 ${heroPhoto ? 'md:-mt-10' : ''}`}>
                  {market.logoUrl
                    ? <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                        <img className="w-full h-full object-contain" src={market.logoUrl} alt={`${market.name} logo`} />
                      </div>
                    : <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                        <span className="text-brand-light-blue text-4xl font-serif">{market.name[0]}</span>
                      </div>
                  }
                </div>

                {/* Mobile only: Save/Email stacked under logo */}
                <div className="flex md:hidden flex-col items-start gap-2">
                  {followButton}
                  {emailButton}
                </div>
              </div>

              <div className="flex-1 min-w-0 pt-2">
                <div className="flex items-center gap-1.5 flex-wrap justify-start">
                  {isFoundingMember && (
                    <span className="text-brand-gold" title="Founding Member">
                      <RibbonIcon className="w-5 h-5" />
                    </span>
                  )}
                  <h1 className="text-3xl font-serif font-extrabold text-brand-blue">{market.name}</h1>
                </div>
                {((market.marketTypes?.length ?? 0) > 0 || place) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 justify-start">
                    {market.marketTypes?.map(t => (
                      <span key={t} className="text-sm bg-white border border-gray-200 text-brand-blue px-2.5 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                    {place && (
                      <span className="flex items-center gap-1 text-sm text-brand-blue">
                        <MapPinIcon className="w-4 h-4" />
                        {place}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Desktop only: Save/Email inline on the right */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0 pt-2">
              {followButton}
              {emailButton}
            </div>

            <div className="flex-shrink-0 pt-2 flex items-center gap-1">
              {/* Admins only: jump straight to editing this profile, and come back here after saving */}
              {currentUser?.isAdmin && (
                <Link
                  to={`/hq/edit/market/${market.id}`}
                  state={{ returnTo: `/markets/${market.slug}` }}
                  className="text-sm font-medium text-brand-light-blue hover:underline px-2 py-1"
                >
                  Edit profile
                </Link>
              )}
              <ShareButton className="p-2 rounded-full transition-colors duration-200 text-gray-500 hover:bg-white hover:text-brand-blue" />
            </div>

          </div>

          {/* Inline contact form — only mounted in the DOM when open */}
          {contactOpen && market.contact?.email && (
            <div id="market-contact-disclosure" className="mt-5 pt-5 border-t border-gray-200">
              <ContactForm
                recipientEmail={market.contact.email}
                currentUser={currentUser}
                onSend={(params) => onContactSubmit({ ...params, recipientName: market.name })}
              />
            </div>
          )}
        </div>

        {/* ── Main column + sidebar (sidebar only when it has something) ── */}
        {(hasDates || hasAbout || hasPhotos || hasSidebar) && (
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-10 items-start">
            <div className="flex-1 min-w-0 w-full space-y-9">

              {hasDates && (
                <section>
                  <h2 className={sectionTitle}>Upcoming dates</h2>
                  <ul className="space-y-2.5">
                    {upcomingDates.map(({ event, date, startTime, endTime }) => {
                      // One row per date in the next 6 weeks (T001, T096, T099)
                      const d = new Date(date + 'T12:00:00');
                      const timeStr = `${formatTime(startTime)} – ${formatTime(endTime)}`;
                      const repeats = recurrenceSummary(event);
                      return (
                        <li key={`${event.id}-${date}`} className="flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg">
                          <div className="w-14 text-center flex-shrink-0">
                            <p className="text-sm font-semibold text-brand-gold uppercase">{d.toLocaleDateString('en-CA', { month: 'short' }).replace('.', '')}</p>
                            <p className="font-serif text-2xl text-brand-blue leading-none">{d.getDate()}</p>
                          </div>
                          <div className="min-w-0">
                            {/* Opens the event page on this date; its own website is linked from there (T013) */}
                            {market.slug ? (
                              <Link
                                to={eventPath(market.slug, event, date)}
                                className="text-base font-semibold text-brand-light-blue hover:underline"
                              >
                                {event.name}
                              </Link>
                            ) : (
                              <p className="text-base font-semibold text-brand-text">{event.name}</p>
                            )}
                            <p className="text-sm text-gray-600 mt-0.5">
                              {d.toLocaleDateString('en-CA', { weekday: 'short' }).replace('.', '')}, {timeStr}
                              {event.location?.venueName ? ` · ${event.location.venueName}` : ''}
                              {repeats ? ` · ${repeats}` : ''}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {hasAbout && (
                <section>
                  <h2 className={sectionTitle}>About us</h2>
                  <p className="text-brand-text text-base leading-relaxed whitespace-pre-line">{market.description}</p>
                </section>
              )}

              {hasPhotos && (
                <section>
                  <h2 className={sectionTitle}>Gallery</h2>
                  <PhotoGallery photos={market.photos} altPrefix={market.name} />
                </section>
              )}
            </div>

            {hasSidebar && (
              <aside className="w-full md:w-80 flex-shrink-0 space-y-5">
                {hasInfo && (
                  <div className={sideCard}>
                    <h2 className={sideTitle}>Market info</h2>
                    <dl className="space-y-3">
                      {market.location?.address && (
                        <div>
                          <dt className={label}>Location</dt>
                          <dd className="text-sm text-brand-text">{market.location.address}</dd>
                        </div>
                      )}
                      {hasSchedule && (
                        <div>
                          <dt className={label}>Schedule</dt>
                          <dd className="text-sm text-brand-text">{formatScheduleToString(market.schedule)}</dd>
                        </div>
                      )}
                    </dl>

                    {showApply && (
                      <div className={hasSchedule || market.location?.address ? 'mt-5 pt-5 border-t border-gray-200' : ''}>
                        {hasApplied ? (
                          <button disabled className="w-full bg-green-200 text-green-800 font-semibold py-3 px-4 rounded-md cursor-not-allowed">
                            Application Submitted
                          </button>
                        ) : canApply ? (
                          <button
                            onClick={() => onApply(market.id)}
                            className="w-full bg-brand-blue text-white font-semibold py-3 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                          >
                            Apply to this Market
                          </button>
                        ) : (
                          <div className="text-center">
                            <button disabled className="w-full bg-gray-300 text-gray-600 font-semibold py-3 px-4 rounded-md cursor-not-allowed">
                              Cannot Apply
                            </button>
                            <p className="text-sm text-red-700 mt-2">{applicationDisabledReason}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* HIDDEN: Featured listings — not yet implemented, see Phase 3 (T021) */}
                    {false && currentUser && !market.isFeatured && (
                      <div className="mt-5 pt-5 border-t border-gray-200">
                        <button
                          onClick={() => onFeatureMarket(market.id)}
                          className="w-full bg-brand-gold text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                        >
                          ⭐️ Feature this Market
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {hasSocials && (
                  <div className={sideCard}>
                    <h2 className="text-xl text-brand-blue font-serif mb-4">Follow along</h2>
                    <SocialLinks contact={market.contact} />
                  </div>
                )}

                {hasGoodToKnow && (
                  <div className={sideCard}>
                    <h2 className={sideTitle}>Good to know</h2>
                    <div className="space-y-4">
                      {market.accessibility && (
                        <div>
                          <p className={label}>Accessibility</p>
                          <p className="text-sm text-brand-text">{market.accessibility}</p>
                        </div>
                      )}
                      {market.paymentOptions && market.paymentOptions.length > 0 && (
                        <div>
                          <p className={label}>Payments</p>
                          <div className="flex flex-wrap gap-2">
                            {market.paymentOptions.map(opt => (
                              <span key={opt} className="bg-white border border-gray-200 text-sm text-brand-text px-3 py-1 rounded-full">{opt}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {market.seasonalInfo && (
                        <div>
                          <p className={label}>Seasonal</p>
                          <p className="text-sm text-brand-text">{market.seasonalInfo}</p>
                        </div>
                      )}
                      {market.tags && market.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {market.tags.map(tag => (
                            <span key={tag} className="bg-white border border-gray-200 text-sm text-brand-text px-3 py-1 rounded-full">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        )}

        {/* ── Reviews: a one-line prompt until there are some ────────────── */}
        <section className="px-6 md:px-8 pb-8">
          {approvedReviews.length === 0 ? (
            <div className="bg-brand-cream rounded-xl px-5 py-4 flex flex-wrap items-center gap-4">
              <svg className="w-7 h-7 text-brand-light-blue flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
              <p className="flex-1 min-w-[14rem] text-base text-brand-text">
                <strong className="font-semibold">No reviews yet.</strong> Been to {market.name}? Be the first to share how it went.
              </p>
              {reviewAction}
            </div>
          ) : (
            <div className="border-t border-gray-200 pt-8">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <h2 className="text-2xl text-brand-blue font-serif">
                  Reviews <span className="font-sans font-medium text-base text-gray-600 tracking-normal">· {avgRating} from {approvedReviews.length} {approvedReviews.length === 1 ? 'review' : 'reviews'}</span>
                </h2>
                {reviewAction}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedReviews.map(review => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-brand-text">{review.author}</p>
                      {review.reviewerAccountType === 'vendor' && (
                        <span className="text-sm px-2 py-0.5 rounded-full bg-brand-cream text-brand-light-blue font-medium">Vendor</span>
                      )}
                      {review.reviewerAccountType === 'market' && (
                        <span className="text-sm px-2 py-0.5 rounded-full bg-brand-cream text-brand-light-blue font-medium">Organizer</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
                    <p className="text-sm text-gray-500 mt-2">{review.date}</p>
                  </div>
                ))}
              </div>
              {approvedReviews.length > 12 && (
                <p className="text-sm text-gray-500 mt-4">Showing 12 of {approvedReviews.length} reviews</p>
              )}
            </div>
          )}
          {reviewOpen && currentUser && !hasAlreadyReviewed && (
            <div className="mt-5">
              <ReviewForm onSubmit={(data) => { onAddReview(data); setReviewOpen(false); }} />
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default MarketProfile;
