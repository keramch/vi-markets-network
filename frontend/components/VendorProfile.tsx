

import React from 'react';
import type { Vendor, Market, User } from '../types';
import { InstagramIcon, FacebookIcon, PinterestIcon, EtsyIcon, TikTokIcon, RibbonIcon } from './Icons';
import { UserPlus, UserCheck, Globe } from 'lucide-react';
import ReviewForm from './ReviewForm';
import ContactForm from './ContactForm';
import ShareButton from './ShareButton';

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
}

const VendorProfile: React.FC<VendorProfileProps> = ({
  vendor, markets, owner,
  onSelectMarket, isFavorited, onToggleFavorite,
  currentUser, onAddReview, onFeatureVendor, onContactSubmit,
}) => {
  const vendorMarkets = markets.filter(m => vendor.attendingMarketIds.includes(m.id));
  const approvedReviews = vendor.reviews.filter(r => r.status === 'approved');
  const displayedReviews = approvedReviews.slice(0, 12);
  const isFoundingMember = owner?.subscription?.foundingMember;
  const storyText = vendor.originStory || vendor.description;
  const hasSocials = !!(
    vendor.contact?.socials?.instagram ||
    vendor.contact?.socials?.facebook ||
    vendor.contact?.socials?.pinterest ||
    vendor.contact?.socials?.etsy ||
    vendor.contact?.socials?.tiktok ||
    vendor.contact?.socials?.website
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">

        {/* ── Section 1: Hero ─────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row">

          {/* Left panel */}
          <div className="md:w-52 flex-shrink-0 bg-brand-cream p-6 flex flex-col items-center justify-center text-center gap-2">
            {(vendor.logoUrl || vendor.photos?.[0])
              ? <img className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg" src={vendor.logoUrl || vendor.photos[0]} alt={`${vendor.name} logo`} />
              : <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-brand-blue/10 flex items-center justify-center"><span className="text-brand-blue text-4xl font-serif">{vendor.name[0]}</span></div>
            }
            <span className="text-xs font-semibold text-brand-light-blue uppercase tracking-wider leading-tight">
              {vendor.vendorTypes && vendor.vendorTypes.length > 0 ? vendor.vendorTypes.join(' · ') : vendor.category}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {isFoundingMember && (
                <div className="text-brand-gold" title="Founding Member">
                  <RibbonIcon className="w-5 h-5" />
                </div>
              )}
              <h1 className="text-2xl font-extrabold text-brand-blue font-serif">{vendor.name}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => onToggleFavorite(vendor.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 flex-shrink-0 ${isFavorited ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-brand-blue'}`}
                aria-label={isFavorited ? 'Unfollow this vendor' : 'Follow this vendor'}
                title={isFavorited ? 'Unfollow this vendor' : 'Follow this vendor'}
              >
                {isFavorited ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {isFavorited ? 'Following' : 'Follow'}
              </button>
              <ShareButton className="p-2 rounded-full transition-colors duration-200 ease-in-out text-gray-400 hover:bg-gray-100 hover:text-brand-blue" />
            </div>
          </div>

          {/* Right panel */}
          <div className="flex-1 p-5 md:px-[22px] md:py-5">
            <p className="text-sm text-brand-text leading-relaxed whitespace-pre-line">{storyText}</p>
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
          </div>

        </div>

        {/* ── Section 2: Gallery ──────────────────────────────────────────── */}
        {vendor.photos && vendor.photos.length > 0 && (
          <div className="p-6 md:p-8 border-t">
            <h2 className="text-2xl text-brand-blue font-serif mb-4">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {vendor.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`${vendor.name} photo ${i + 1}`}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Section 3: Connect | Find Us At ─────────────────────────────── */}
        <div className="p-6 md:p-8 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Left: Connect */}
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
              {vendor.contact?.email && (
                <ContactForm recipientEmail={vendor.contact.email} currentUser={currentUser} onSend={onContactSubmit} />
              )}
            </div>

            {/* Right: Find Us At */}
            <div>
              <h2 className="text-2xl text-brand-blue font-serif mb-5">Find Us At</h2>
              {vendorMarkets.length > 0 ? (
                <div className="space-y-3">
                  {vendorMarkets.map(market => (
                    <div
                      key={market.id}
                      onClick={() => onSelectMarket(market.id)}
                      className="cursor-pointer group"
                    >
                      <p className="text-brand-light-blue font-medium group-hover:underline">{market.name}</p>
                      {(market.location?.city || market.location?.address) && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {market.location.city || market.location.address}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No markets listed yet.</p>
              )}
              <p className="text-xs text-gray-400 italic mt-5">
                Market dates and locations are approximate — confirm with the market organiser.
              </p>
            </div>

          </div>
        </div>

        {/* ── Section 4: Reviews ──────────────────────────────────────────── */}
        <div className="p-6 md:p-8 border-t">
          <h2 className="text-2xl text-brand-blue font-serif mb-6">Reviews</h2>
          {currentUser && <div className="mb-8"><ReviewForm onSubmit={onAddReview} /></div>}
          {approvedReviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedReviews.map(review => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <span className="font-medium text-brand-text">{review.author}</span>
                    <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">{review.date}</p>
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
  );
};

export default VendorProfile;
