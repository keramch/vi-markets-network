

import React, { useState } from 'react';
import type { SpamGuardFields } from './SpamGuard';
import type { Vendor, Market, User } from '../types';
import { RibbonIcon, HeartIcon, MapPinIcon } from './Icons';
import ProfileChecklist, { type ChecklistItem } from './ProfileChecklist';
import SocialLinks, { socialLinks } from './SocialLinks';
import ReviewForm from './ReviewForm';
import ContactForm from './ContactForm';
import ShareButton from './ShareButton';
import { Link } from 'react-router-dom';
import PhotoGallery from './PhotoGallery';

interface VendorProfileProps {
  vendor: Vendor;
  markets: Market[];
  owner?: User | null;
  onSelectMarket: (id: string) => void;
  onBack: () => void;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  currentUser: User | null;
  onAddReview: (reviewData: { rating: number, comment: string }) => void;
  onFeatureVendor: (vendorId: string) => void;
  onContactSubmit: (params: { recipientEmail: string; recipientName: string; senderName: string; senderEmail: string; subject: string; message: string } & SpamGuardFields) => Promise<void>;
  onOpenLoginModal: () => void;
}

// Returns today's date as YYYY-MM-DD in Pacific time
const todayPacific = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });

const VendorProfile: React.FC<VendorProfileProps> = ({
  vendor, markets, owner,
  onSelectMarket, isFavorited, onToggleFavorite,
  currentUser, onAddReview, onFeatureVendor, onContactSubmit, onOpenLoginModal,
}) => {
  const [contactOpen, setContactOpen] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  const attendingEntries = (vendor.attendingMarkets || [])
    .map(entry => {
      const market = markets.find(m => m.id === entry.marketId);
      return market ? { market, date: entry.date } : null;
    })
    .filter((x): x is { market: Market; date: string } => x !== null);

  const todayStr = todayPacific();
  const currentEntries = attendingEntries.filter(e => e.date >= todayStr);
  const pastEntries = attendingEntries.filter(e => e.date < todayStr);
  const approvedReviews = vendor.reviews.filter(r => r.status === 'approved');
  const displayedReviews = approvedReviews.slice(0, 12);
  const isFoundingMember = vendor.ownerFoundingMember ?? owner?.subscription?.foundingMember;
  const storyText = vendor.description;
  const hasSocials = socialLinks(vendor.contact).length > 0;
  const hasAlreadyReviewed = currentUser
    ? vendor.reviews.some(r => r.userId === currentUser.id)
    : false;

  const heroPhoto = vendor.headerPhotoUrl || vendor.photos?.[0];
  const heroBgPosition = vendor.headerPhotoPosition === 'top' ? 'center 25%'
    : vendor.headerPhotoPosition === 'bottom' ? 'center 75%'
    : 'center 50%';

  const followButton = currentUser ? (
    <button
      onClick={() => onToggleFavorite(vendor.id)}
      className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${
        isFavorited ? 'bg-white text-brand-blue' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'
      }`}
      aria-label={isFavorited ? 'Remove this vendor from your saved list' : 'Save this vendor'}
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

  const emailButton = vendor.contact?.email ? (
    <button
      type="button"
      onClick={() => setContactOpen(o => !o)}
      aria-expanded={contactOpen}
      aria-controls="vendor-contact-disclosure"
      className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap ${
        contactOpen ? 'bg-brand-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'
      }`}
    >
      {contactOpen ? 'Close' : 'Email'}
    </button>
  ) : null;

  // ── What this profile has (T119): empty sections are left out, not shown blank
  const hasAbout = !!storyText?.trim();
  const hasTags = (vendor.tags?.length ?? 0) > 0;
  const hasPhotos = (vendor.photos?.length ?? 0) > 0;
  const hasMarkets = currentEntries.length > 0 || pastEntries.length > 0;
  const hasSidebar = hasSocials || hasTags;
  const isOwner = !!currentUser && currentUser.id === vendor.ownerId;
  const avgRating = approvedReviews.length
    ? (approvedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / approvedReviews.length).toFixed(1)
    : null;

  // Owner checklist, most valuable first
  const socials = vendor.contact?.socials ?? {};
  const checklist: ChecklistItem[] = [
    { key: 'markets', done: currentEntries.length > 0, title: 'Add the markets you sell at', short: 'markets', why: "Shoppers see where and when to find you, and you show up on those markets' pages too.", action: 'Add markets' },
    { key: 'photos', done: (vendor.photos?.length ?? 0) >= 3, title: 'Add 3 or more photos of your work', short: 'photos', why: 'Photos fill your gallery and the banner at the top of your profile.', action: 'Add photos' },
    { key: 'city', done: !!vendor.city?.trim(), title: 'Add your town or area', short: 'town or area', why: 'Shown under your name, so shoppers know where you are based.', action: 'Add your area' },
    { key: 'about', done: (storyText?.trim().length ?? 0) >= 100, title: 'Tell your story in About us', short: 'About us', why: 'A few sentences about what you make and how. Shoppers love the story behind it.', action: 'Write About us' },
    { key: 'logo', done: !!vendor.logoUrl, title: 'Add your logo', short: 'logo', why: 'It shows on your profile and on your card in search results.', action: 'Add logo' },
    { key: 'socials', done: !!(socials.instagram || socials.facebook || socials.tiktok || socials.pinterest || socials.etsy), title: 'Add your Instagram or Facebook', short: 'social links', why: 'One more way for shoppers to keep up with you between markets.', action: 'Add links' },
    { key: 'tags', done: hasTags, title: 'Add a few tags', short: 'tags', why: 'Tags like Handmade or Vegan help shoppers find you in search.', action: 'Add tags' },
    { key: 'website', done: !!(vendor.contact?.website || socials.website), title: 'Add your website', short: 'website', why: 'Send shoppers to your own shop or site.', action: 'Add website' },
  ];

  const sectionTitle = 'text-2xl text-brand-blue font-serif mb-3';

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
      {isOwner && <ProfileChecklist profileId={vendor.id} items={checklist} />}

      <div className="bg-white rounded-lg shadow-xl overflow-hidden">

        {/* ── Photo strip: only when there's a photo to show ─────────────── */}
        {heroPhoto && (
          <div
            className="hidden md:block relative w-full h-56 md:h-72"
            style={{ backgroundImage: `url(${heroPhoto})`, backgroundSize: 'cover', backgroundPosition: heroBgPosition }}
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(74,66,67,0.72) 0%, transparent 42%)' }}
            />
          </div>
        )}

        {/* ── Identity Panel ──────────────────────────────────────────── */}
        <div className={`bg-[#D6E9E6] border-b-[3px] border-brand-gold px-6 md:px-8 pb-6 ${heroPhoto ? 'pt-4 md:pt-3' : 'pt-6 md:pt-8'}`}>
          <div className="flex items-start gap-3">

            {/* Logo + name group */}
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="flex flex-col items-start gap-2 flex-shrink-0">
                <div className={`relative flex-shrink-0 z-10 ${heroPhoto ? 'md:-mt-10' : ''}`}>
                  {(vendor.logoUrl || vendor.photos?.[0])
                    ? <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center">
                        <img
                          className="w-full h-full object-contain"
                          src={vendor.logoUrl || vendor.photos[0]}
                          alt={`${vendor.name} logo`}
                        />
                      </div>
                    : <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                        <span className="text-brand-light-blue text-4xl font-serif">{vendor.name[0]}</span>
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
                  <h1 className="text-3xl font-serif font-extrabold text-brand-blue">{vendor.name}</h1>
                </div>
                {((vendor.vendorTypes?.length ?? 0) > 0 || vendor.city) && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 justify-start">
                    {vendor.vendorTypes?.map(t => (
                      <span key={t} className="text-sm bg-white border border-gray-200 text-brand-blue px-2.5 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                    {vendor.city && (
                      <span className="flex items-center gap-1 text-sm text-brand-blue">
                        <MapPinIcon className="w-4 h-4" />
                        {vendor.city}
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

            {/* Share — always at the far right */}
            <div className="flex-shrink-0 pt-2 flex items-center gap-1">
              {/* Admins only: jump straight to editing this profile, and come back here after saving */}
              {currentUser?.isAdmin && (
                <Link
                  to={`/hq/edit/vendor/${vendor.id}`}
                  state={{ returnTo: `/vendors/${vendor.slug}` }}
                  className="text-sm font-medium text-brand-light-blue hover:underline px-2 py-1"
                >
                  Edit profile
                </Link>
              )}
              <ShareButton className="p-2 rounded-full transition-colors duration-200 text-gray-500 hover:bg-white hover:text-brand-blue" />
            </div>

          </div>

          {/* Inline contact form — only mounted in the DOM when open */}
          {contactOpen && vendor.contact?.email && (
            <div id="vendor-contact-disclosure" className="mt-5 pt-5 border-t border-gray-200">
              <ContactForm
                recipientEmail={vendor.contact.email}
                currentUser={currentUser}
                onSend={(params) => onContactSubmit({ ...params, recipientName: vendor.name })}
              />
            </div>
          )}
        </div>

        {/* ── Main column + sidebar (sidebar only when it has something) ── */}
        {(hasMarkets || hasAbout || hasPhotos || hasSidebar) && (
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 md:gap-10 items-start">
            <div className="flex-1 min-w-0 w-full space-y-9">

              {hasMarkets && (
                <section>
                  <h2 className={sectionTitle}>Find us at</h2>
                  {currentEntries.length > 0 && (
                    <ul className="space-y-2.5">
                      {(showAllUpcoming ? currentEntries : currentEntries.slice(0, 3)).map(({ market, date }) => {
                        const isActive = market.status === 'active';
                        const d = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00`) : null;
                        const place = market.location?.city || market.location?.address;
                        return (
                          <li key={`${market.id}-${date}`} className="flex items-center gap-4 px-4 py-3 border border-gray-200 rounded-lg">
                            {d && (
                              <div className="w-14 text-center flex-shrink-0">
                                <p className="text-sm font-semibold text-brand-gold uppercase">{d.toLocaleDateString('en-CA', { month: 'short' }).replace('.', '')}</p>
                                <p className="font-serif text-2xl text-brand-blue leading-none">{d.getDate()}</p>
                              </div>
                            )}
                            <div className="min-w-0">
                              {isActive ? (
                                <button type="button" onClick={() => onSelectMarket(market.id)} className="text-base font-semibold text-brand-light-blue hover:underline text-left">
                                  {market.name}
                                </button>
                              ) : (
                                <p className="text-base font-semibold text-brand-text">{market.name}</p>
                              )}
                              {place && <p className="text-sm text-gray-600 mt-0.5">{place}</p>}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {!showAllUpcoming && currentEntries.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setShowAllUpcoming(true)}
                      className="text-sm text-brand-light-blue underline font-semibold mt-3"
                    >
                      Show {currentEntries.length - 3} more
                    </button>
                  )}
                  {currentEntries.length > 0 && (
                    <p className="text-sm text-gray-500 italic mt-3">
                      Dates and locations can change. Check with the market before you go.
                    </p>
                  )}
                  {pastEntries.length > 0 && (
                    <div className={currentEntries.length > 0 ? 'mt-5' : ''}>
                      <p className="text-sm font-semibold text-gray-600 mb-1.5">You may have seen us at</p>
                      <ul className="space-y-1">
                        {pastEntries.map(({ market }) => (
                          <li key={market.id} className="text-sm text-gray-600">
                            {market.name}{(market.location?.city || market.location?.address) ? `, ${market.location.city || market.location.address}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {hasAbout && (
                <section>
                  <h2 className={sectionTitle}>About us</h2>
                  <p className="text-brand-text text-base leading-relaxed whitespace-pre-line">{storyText}</p>
                </section>
              )}

              {hasPhotos && (
                <section>
                  <h2 className={sectionTitle}>Gallery</h2>
                  <PhotoGallery photos={vendor.photos} altPrefix={vendor.name} />
                </section>
              )}
            </div>

            {hasSidebar && (
              <aside className="w-full md:w-80 flex-shrink-0 space-y-5">
                {hasSocials && (
                  <div className="bg-[#F6FAF6] border border-gray-200 rounded-xl p-5">
                    <h2 className="text-xl text-brand-blue font-serif mb-4">Follow along</h2>
                    <SocialLinks contact={vendor.contact} />
                  </div>
                )}
                {hasTags && (
                  <div className="bg-[#F6FAF6] border border-gray-200 rounded-xl p-5">
                    <h2 className="text-xl text-brand-blue font-serif mb-3">Good to know</h2>
                    <div className="flex flex-wrap gap-2">
                      {vendor.tags!.map(tag => (
                        <span key={tag} className="bg-white border border-gray-200 text-brand-text text-sm px-3 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* HIDDEN: Featured listings — not yet implemented, see Phase 3 (T021) */}
                {false && currentUser && !vendor.isFeatured && (
                  <button
                    onClick={() => onFeatureVendor(vendor.id)}
                    className="w-full bg-brand-gold text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                  >
                    ⭐️ Feature this Vendor
                  </button>
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
                <strong className="font-semibold">No reviews yet.</strong> Shopped with {vendor.name}? Be the first to share how it went.
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

export default VendorProfile;
