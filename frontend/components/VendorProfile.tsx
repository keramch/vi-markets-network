

import React, { useState } from 'react';
import type { Vendor, Market, User } from '../types';
import { InstagramIcon, FacebookIcon, PinterestIcon, EtsyIcon, TikTokIcon, RibbonIcon } from './Icons';
import { UserPlus, UserCheck, Globe } from 'lucide-react';
import ReviewForm from './ReviewForm';
import ContactForm from './ContactForm';
import ShareButton from './ShareButton';
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
  onContactSubmit: (recipientEmail: string, subject: string) => void;
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
  const isFoundingMember = owner?.subscription?.foundingMember;
  const storyText = vendor.description;
  const hasSocials = !!(
    vendor.contact?.socials?.instagram ||
    vendor.contact?.socials?.facebook ||
    vendor.contact?.socials?.pinterest ||
    vendor.contact?.socials?.etsy ||
    vendor.contact?.socials?.tiktok ||
    vendor.contact?.socials?.website
  );
  const hasAlreadyReviewed = currentUser
    ? vendor.reviews.some(r => r.userId === currentUser.id)
    : false;

  const heroPhoto = vendor.headerPhotoUrl || vendor.photos?.[0];
  const heroBgPosition = vendor.headerPhotoPosition === 'top' ? 'center 25%'
    : vendor.headerPhotoPosition === 'bottom' ? 'center 75%'
    : 'center 50%';

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">

        {/* ── Hero Strip ──────────────────────────────────────────────── */}
        <div
          className="relative w-full h-56 md:h-72"
          style={heroPhoto ? {
            backgroundImage: `url(${heroPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: heroBgPosition,
          } : {
            background: 'linear-gradient(135deg, #2E7A72 0%, #4A4243 100%)',
          }}
          aria-hidden="true"
        >
          {/* Gradient: transparent → charcoal, bottom 40% only */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(74,66,67,0.72) 0%, transparent 42%)' }}
          />
        </div>

        {/* ── Identity Panel ──────────────────────────────────────────── */}
        <div className="bg-brand-cream px-6 md:px-8 pt-3 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

            {/* Logo + name block */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
              {/* Logo — negative margin pulls it up to straddle the hero/panel seam */}
              <div className="relative -mt-10 flex-shrink-0 z-10">
                {(vendor.logoUrl || vendor.photos?.[0])
                  ? <img
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      src={vendor.logoUrl || vendor.photos[0]}
                      alt={`${vendor.name} logo`}
                    />
                  : <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-brand-blue/10 flex items-center justify-center">
                      <span className="text-brand-blue text-4xl font-serif">{vendor.name[0]}</span>
                    </div>
                }
              </div>

              {/* Type label, name, vendorType chips */}
              <div className="text-center sm:text-left sm:pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                  {vendor.vendorTypes && vendor.vendorTypes.length > 0
                    ? vendor.vendorTypes.join(' · ')
                    : vendor.category}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                  {isFoundingMember && (
                    <span className="text-brand-gold" title="Founding Member">
                      <RibbonIcon className="w-5 h-5" />
                    </span>
                  )}
                  <h1 className="text-2xl font-serif font-normal text-brand-blue">{vendor.name}</h1>
                </div>
                {vendor.vendorTypes && vendor.vendorTypes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                    {vendor.vendorTypes.map(t => (
                      <span key={t} className="text-xs bg-white border border-gray-200 text-brand-blue px-2.5 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Follow + Message + Share buttons */}
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end sm:pt-2 flex-shrink-0">
              {currentUser ? (
                <button
                  onClick={() => onToggleFavorite(vendor.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
                    isFavorited ? 'bg-brand-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'
                  }`}
                  aria-label={isFavorited ? 'Unfollow this vendor' : 'Follow this vendor'}
                >
                  {isFavorited ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {isFavorited ? 'Following' : 'Follow'}
                </button>
              ) : (
                <button
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-gray-500 hover:bg-gray-100 transition-colors duration-200"
                  title="Log in or sign up to follow"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Follow
                </button>
              )}

              {vendor.contact?.email && (
                <button
                  type="button"
                  onClick={() => setContactOpen(o => !o)}
                  aria-expanded={contactOpen}
                  aria-controls="vendor-contact-disclosure"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 ${
                    contactOpen
                      ? 'bg-brand-blue text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-blue'
                  }`}
                >
                  {contactOpen ? 'Close' : 'Message'}
                </button>
              )}

              <ShareButton className="p-2 rounded-full transition-colors duration-200 text-gray-400 hover:bg-white hover:text-brand-blue" />
            </div>

          </div>

          {/* Inline contact form — only mounted in the DOM when open */}
          {contactOpen && vendor.contact?.email && (
            <div id="vendor-contact-disclosure" className="mt-5 pt-5 border-t border-gray-200">
              <ContactForm
                recipientEmail={vendor.contact.email}
                currentUser={currentUser}
                onSend={onContactSubmit}
              />
            </div>
          )}
        </div>

        {/* ── About + Good to know + Find Us At | Gallery ──────────────── */}
        <div className="p-6 md:p-8 border-t bg-white">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

            {/* Left ~60%: About + Good to know + Find Us At */}
            <div className="md:col-span-3">
              <h3 className="text-xl font-serif text-brand-blue mb-3">About us</h3>
              <p className="text-brand-text leading-relaxed whitespace-pre-line">{storyText}</p>
              <hr className="my-4 border-gray-200" />
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Good to know</p>
              {vendor.tags && vendor.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {vendor.tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-2.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No tags added yet.</p>
              )}
              {/* HIDDEN: Featured listings — not yet implemented, see Phase 3 */}
              {false && currentUser && !vendor.isFeatured && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => onFeatureVendor(vendor.id)}
                    className="w-full bg-brand-gold text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                  >
                    ⭐️ Feature this Vendor
                  </button>
                </div>
              )}
              <hr className="my-4 border-gray-200" />
              <h2 className="text-2xl text-brand-blue font-serif mb-3">Find Us At</h2>
              {currentEntries.length > 0 ? (
                <div className="space-y-3">
                  {currentEntries.map(({ market, date }) => {
                    const isActive = market.status === 'active';
                    return (
                      <div
                        key={market.id}
                        onClick={isActive ? () => onSelectMarket(market.id) : undefined}
                        className={isActive ? 'cursor-pointer group' : ''}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-base font-medium ${isActive ? 'text-brand-light-blue group-hover:underline' : 'text-brand-text'}`}>
                            {market.name}
                          </p>
                          {!isActive && (
                            <span className="bg-brand-gold/10 text-brand-gold text-xs rounded-full px-2 py-0.5">not yet in directory</span>
                          )}
                        </div>
                        {(market.location?.city || market.location?.address) && (
                          <p className="text-sm text-gray-500 mt-0.5">
                            {market.location.city || market.location.address}
                          </p>
                        )}
                        {!isActive && (
                          <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No markets listed yet.</p>
              )}
              <p className="text-xs text-gray-400 italic mt-5">
                Market dates and locations are approximate — confirm with the market organiser.
              </p>
              {pastEntries.length > 0 && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">You may have seen me at</p>
                  <ul className="space-y-1">
                    {pastEntries.map(({ market }) => (
                      <li key={market.id} className="text-xs text-gray-400">
                        {market.name}{(market.location?.city || market.location?.address) ? `, ${market.location.city || market.location.address}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Right ~40%: Gallery */}
            <div className="md:col-span-2">
              {vendor.photos && vendor.photos.length > 0 && (
                <>
                  <h2 className="text-2xl text-brand-blue font-serif mb-4">Gallery</h2>
                  <PhotoGallery photos={vendor.photos} altPrefix={vendor.name} />
                </>
              )}
            </div>

          </div>
        </div>

        {/* ── Connect with [Vendor] | Reviews ─────────────────────────────── */}
        <div className="p-6 md:p-8 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left: Connect */}
            {hasSocials && (
            <div>
              <h2 className="text-2xl text-brand-blue font-serif mb-5">Connect with {vendor.name}</h2>
              {hasSocials && (
                <div className="flex gap-3 mb-5">
                  {vendor.contact?.socials?.instagram && (
                    <a href={`https://instagram.com/${vendor.contact.socials.instagram}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <InstagramIcon className="w-5 h-5" />
                    </a>
                  )}
                  {vendor.contact?.socials?.facebook && (
                    <a href={`https://facebook.com/${vendor.contact.socials.facebook}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <FacebookIcon className="w-5 h-5" />
                    </a>
                  )}
                  {vendor.contact?.socials?.pinterest && (
                    <a href={`https://pinterest.com/${vendor.contact.socials.pinterest}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <PinterestIcon className="w-5 h-5" />
                    </a>
                  )}
                  {vendor.contact?.socials?.etsy && (
                    <a href={`https://etsy.com/shop/${vendor.contact.socials.etsy}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <EtsyIcon className="w-5 h-5" />
                    </a>
                  )}
                  {vendor.contact?.socials?.tiktok && (
                    <a href={`https://tiktok.com/@${vendor.contact.socials.tiktok}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <TikTokIcon className="w-5 h-5" />
                    </a>
                  )}
                  {vendor.contact?.socials?.website && (
                    <a href={vendor.contact.socials.website.startsWith('http') ? vendor.contact.socials.website : `https://${vendor.contact.socials.website}`} target="_blank" rel="noopener noreferrer" className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-brand-blue hover:text-white transition-colors">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
            )}

            {/* Right: Reviews */}
            <div>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayedReviews.map(review => (
                      <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium text-brand-text">{review.author}</p>
                          {review.reviewerAccountType === 'vendor' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cream text-brand-teal font-medium">Vendor</span>
                          )}
                          {review.reviewerAccountType === 'market' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-brand-cream text-brand-teal font-medium">Organizer</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-2">{review.date}</p>
                      </div>
                    ))}
                  </div>
                  {approvedReviews.length > 12 && (
                    <p className="text-sm text-gray-400 mt-4">Showing 12 of {approvedReviews.length} reviews</p>
                  )}
                </>
              ) : (
                <p className="text-gray-500">This vendor has no reviews yet.</p>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default VendorProfile;
