

import React from 'react';
import type { Market, Vendor, User, Review, Application } from '../types';
import { MapPinIcon, CalendarIcon, StarIcon, InstagramIcon, FacebookIcon, PinterestIcon, AccessibilityIcon, CreditCardIcon, CheckCircleIcon, RibbonIcon } from './Icons';
import { UserPlus, UserCheck } from 'lucide-react';
import VendorCard from './VendorCard';
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

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center">
    {[...Array(5)].map((_, i) => (
      <React.Fragment key={i}>
        <StarIcon className="w-5 h-5 text-brand-gold" filled={i < rating} />
      </React.Fragment>
    ))}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => (
  <div className="flex items-start">
    <dt className="flex items-center text-gray-500 w-32 flex-shrink-0">
        <span className="mr-2 text-brand-light-blue">{icon}</span>
        <span className="font-semibold text-brand-blue">{label}</span>
    </dt>
    <dd className="text-brand-text">{value}</dd>
  </div>
);

const MarketProfile: React.FC<MarketProfileProps> = ({ market, vendors, applications, owner, onSelectVendor, onBack, isFavorited, onToggleFavorite, currentUser, onAddReview, onFeatureMarket, onContactSubmit, onApply }) => {
  const marketVendors = vendors.filter(v => (market.vendorIds || []).includes(v.id));  const approvedReviews = market.reviews.filter(r => r.status === 'approved');
  const currentUserVendor = currentUser && currentUser.ownedVendorId ? vendors.find(v => v.id === currentUser.ownedVendorId) : null;
  const isProVendor = currentUser?.subscription?.tier === 'pro' || currentUser?.subscription?.tier === 'superPro' || currentUser?.subscription?.foundingMember === true;
  const hasApplied = applications.some(app => app.vendorId === currentUserVendor?.id && app.marketId === market.id);

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

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="relative">
          {/* Hero banner */}
          {(market.headerPhotoUrl ?? market.photos?.[0])
            ? <img className="w-full h-56 md:h-72 object-cover" src={market.headerPhotoUrl ?? market.photos![0]} alt={market.name} />
            : <div className="w-full h-56 md:h-72 bg-brand-cream flex items-center justify-center"><span className="text-brand-blue/20 text-8xl font-serif">{market.name[0]}</span></div>
          }
          {/* Scrim — covers bottom two-thirds for text legibility regardless of photo colour */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/55 to-transparent pointer-events-none" />

          {/* Bottom-left: logo (fully inside hero) + market name + founding badge */}
          <div className="absolute bottom-4 left-4 right-36 md:bottom-5 md:left-6 md:right-44 flex items-end gap-3">
            {market.logoUrl && (
              <img src={market.logoUrl} alt={`${market.name} logo`} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white shadow-lg object-cover flex-shrink-0" />
            )}
            <div className="flex items-center gap-2 pb-0.5 min-w-0">
              <h1 className="text-2xl md:text-3xl font-extrabold text-white font-serif drop-shadow">{market.name}</h1>
              {isFoundingMember && (
                <div className="bg-brand-gold text-white p-1.5 rounded-full shadow flex-shrink-0" title="Founding Member">
                  <RibbonIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>

          {/* Bottom-right: share + follow */}
          <div className="absolute bottom-4 right-4 md:bottom-5 md:right-6 flex items-center gap-2">
            <ShareButton />
            <button
              onClick={() => onToggleFavorite(market.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 ${isFavorited ? 'bg-brand-blue text-white' : 'bg-black/30 text-white hover:bg-black/50'}`}
              aria-label={isFavorited ? 'Unfollow this market' : 'Follow this market'}
              title={isFavorited ? 'Unfollow this market' : 'Follow this market'}
            >
              {isFavorited ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              {isFavorited ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="text-2xl font-serif text-brand-blue mb-4">About the Market</h2>
              <p className="text-brand-text leading-relaxed whitespace-pre-line">{market.description}</p>
              
              <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-serif text-brand-blue mb-4">Good to Know</h3>
                <dl className="space-y-4">
                    {market.accessibility && <InfoRow label="Accessibility" value={market.accessibility} icon={<AccessibilityIcon className="w-5 h-5" />} />}
                    {market.paymentOptions && <InfoRow label="Payments" value={market.paymentOptions.join(', ')} icon={<CreditCardIcon className="w-5 h-5" />} />}
                    {market.seasonalInfo && <InfoRow label="Seasonal" value={market.seasonalInfo} icon={<CalendarIcon className="w-5 h-5" />} />}
                    {market.amenities && market.amenities.length > 0 && <InfoRow label="Amenities" value={market.amenities.join(', ')} icon={<CheckCircleIcon className="w-5 h-5" />} />}
                </dl>
              </div>

              <h3 className="text-xl font-serif text-brand-blue mt-8 mb-4">Hosted Vendors</h3>
              {marketVendors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {marketVendors.map(vendor => (
                    <VendorCard key={vendor.id} vendor={vendor} onSelect={onSelectVendor} compact={true} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No vendors listed for this market yet.</p>
              )}
            </div>
            <div className="bg-brand-cream rounded-lg p-6">
              <h3 className="text-xl font-serif text-brand-blue mb-4">Market Info</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPinIcon className="w-6 h-6 mr-3 text-brand-light-blue flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-brand-blue">Location</h4>
                    <p className="text-brand-text">{market.location.address}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CalendarIcon className="w-6 h-6 mr-3 text-brand-light-blue flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-brand-blue">Schedule</h4>
                    <p className="text-brand-text">{formatScheduleToString(market.schedule)}</p>
                  </div>
                </div>
                 {currentUserVendor && isProVendor && market.applicationFormQuestions && (
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    {hasApplied ? (
                      <button disabled className="w-full bg-green-200 text-green-800 font-semibold py-2 px-4 rounded-md cursor-not-allowed">
                        Application Submitted
                      </button>
                    ) : (
                      canApply ? (
                        <button 
                          onClick={() => onApply(market.id)}
                          className="w-full bg-brand-blue text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                        >
                          Apply to this Market
                        </button>
                      ) : (
                        <div className="text-center">
                          <button 
                            disabled 
                            className="w-full bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-md cursor-not-allowed"
                          >
                            Cannot Apply
                          </button>
                          <p className="text-xs text-red-600 mt-2">{applicationDisabledReason}</p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
               {/* HIDDEN: Featured listings — not yet implemented, see Phase 3 */}
                {false && currentUser && !market.isFeatured && (
                  <div className="mt-6 pt-6 border-t border-gray-300">
                    <button
                      onClick={() => onFeatureMarket(market.id)}
                      className="w-full bg-brand-gold text-white font-semibold py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                    >
                      ⭐️ Feature this Market
                    </button>
                  </div>
                )}
              <div className="mt-6 h-48 bg-gray-300 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">[ Map Placeholder ]</p>
              </div>
            </div>
          </div>
        </div>

        {market.photos && market.photos.length > 0 && (
          <div className="p-6 md:p-8 border-t">
            <h2 className="text-2xl text-brand-blue font-serif mb-4">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {market.photos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`${market.name} photo ${i + 1}`}
                  className="w-full h-40 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 border-t">
          <h2 className="text-2xl text-brand-blue font-serif mb-6">Connect with {market.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
                {market.contact?.socials && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-brand-blue mb-3">Follow Us</h3>
                        <div className="flex space-x-4">
                            {market.contact?.socials.instagram && <a href={`https://instagram.com/${market.contact?.socials.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-blue"><InstagramIcon className="w-6 h-6" /></a>}
                            {market.contact?.socials.facebook && <a href={`https://facebook.com/${market.contact?.socials.facebook}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-blue"><FacebookIcon className="w-6 h-6" /></a>}
                            {market.contact?.socials.pinterest && <a href={`https://pinterest.com/${market.contact?.socials.pinterest}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-blue"><PinterestIcon className="w-6 h-6" /></a>}
                        </div>
                    </div>
                )}
            </div>
            <ContactForm recipientEmail={market.contact?.email} currentUser={currentUser} onSend={onContactSubmit} />
          </div>
        </div>
        
         <div className="p-6 md:p-8 border-t">
            <h2 className="text-2xl text-brand-blue font-serif mb-4">Reviews</h2>
            {currentUser && <div className="mb-8"><ReviewForm onSubmit={onAddReview} /></div>}
            <div className="space-y-6">
                {approvedReviews.length > 0 ? approvedReviews.map(review => (
                    <div key={review.id} className="border-b pb-4">
                        <div className="flex items-center mb-1">
                            <span className="font-bold text-brand-text">{review.author}</span>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">{review.date}</p>
                    </div>
                )) : <p className="text-gray-500">This market has no reviews yet.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MarketProfile;