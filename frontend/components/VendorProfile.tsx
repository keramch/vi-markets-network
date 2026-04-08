

import React from 'react';
import type { Vendor, Market, User } from '../types';
import { TagIcon, StarIcon, InstagramIcon, FacebookIcon, PinterestIcon, EtsyIcon, LeafIcon, AwardIcon, RibbonIcon } from './Icons';
import { UserPlus, UserCheck } from 'lucide-react';
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

const RatingStars: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <React.Fragment key={i}>
          <StarIcon className="w-5 h-5 text-brand-gold" filled={i < rating} />
        </React.Fragment>
      ))}
    </div>
  );
};

const VendorProfile: React.FC<VendorProfileProps> = ({ vendor, markets, owner, onSelectMarket, onBack, isFavorited, onToggleFavorite, currentUser, onAddReview, onFeatureVendor, onContactSubmit }) => {
  const vendorMarkets = markets.filter(m => vendor.attendingMarketIds.includes(m.id));
  const approvedReviews = vendor.reviews.filter(r => r.status === 'approved');
  const isFoundingMember = owner?.subscription?.foundingMember;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={onBack} className="mb-6 text-brand-light-blue hover:text-brand-blue font-semibold">
        &larr; Back to search results
      </button>
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-1 p-6 sm:p-8 bg-brand-cream flex flex-col items-center justify-center text-center">
              {(vendor.logoUrl || vendor.photos?.[0])
                ? <img className="w-40 h-40 rounded-full object-cover mb-4 border-4 border-white shadow-lg" src={vendor.logoUrl || vendor.photos[0]} alt={`${vendor.name} logo`} />
                : <div className="w-40 h-40 rounded-full mb-4 border-4 border-white shadow-lg bg-brand-blue/10 flex items-center justify-center"><span className="text-brand-blue text-5xl font-serif">{vendor.name[0]}</span></div>
              }
              <span className="text-sm font-semibold text-brand-light-blue uppercase tracking-wider">{vendor.vendorTypes && vendor.vendorTypes.length > 0 ? vendor.vendorTypes.join(' · ') : vendor.category}</span>
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {isFoundingMember && (
                    <div className="text-brand-gold" title="Founding Member">
                        <RibbonIcon className="w-7 h-7" />
                    </div>
                )}
                <h1 className="text-3xl font-extrabold text-brand-blue font-serif mt-1">{vendor.name}</h1>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => onToggleFavorite(vendor.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 flex-shrink-0 ${isFavorited ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-brand-blue'}`}
                  aria-label={isFavorited ? 'Unfollow this vendor' : 'Follow this vendor'}
                  title={isFavorited ? 'Unfollow this vendor' : 'Follow this vendor'}
                >
                  {isFavorited
                    ? <UserCheck className="w-4 h-4" />
                    : <UserPlus className="w-4 h-4" />}
                  {isFavorited ? 'Following' : 'Follow'}
                </button>
                <ShareButton className="p-2 rounded-full transition-colors duration-200 ease-in-out text-gray-400 hover:bg-gray-100 hover:text-brand-blue"/>
              </div>
          </div>
          <div className="md:col-span-2 p-6 md:p-8">
            <p className="text-brand-text leading-relaxed mb-6 whitespace-pre-line">{vendor.description}</p>

            {vendor.tags && vendor.tags.length > 0 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {vendor.tags.map(tag => (
                  <span key={tag} className="bg-brand-gold/20 text-brand-blue text-xs font-semibold px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 capitalize mb-6">
              <TagIcon className="w-5 h-5"/>
              <span>Price: {vendor.priceRange}</span>
            </div>

            <div className="space-y-6">
                {vendor.originStory && (
                    <div>
                        <h3 className="text-lg text-brand-blue font-serif mb-2">Our Story</h3>
                        <p className="text-brand-text text-sm whitespace-pre-line">{vendor.originStory}</p>
                    </div>
                )}
                {vendor.productHighlights && vendor.productHighlights.length > 0 && (
                    <div>
                        <h3 className="text-lg text-brand-blue font-serif mb-2">Product Highlights</h3>
                        <ul className="list-disc list-inside text-brand-text space-y-1 text-sm">
                            {vendor.productHighlights.map(highlight => <li key={highlight}>{highlight}</li>)}
                        </ul>
                    </div>
                )}
                {vendor.sustainabilityPractices && (
                    <div className="flex items-start">
                        <LeafIcon className="w-6 h-6 mr-3 text-green-600 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold text-brand-blue">Sustainability</h4>
                            <p className="text-brand-text text-sm whitespace-pre-line">{vendor.sustainabilityPractices}</p>
                        </div>
                    </div>
                )}
                {vendor.certifications && vendor.certifications.length > 0 && (
                    <div className="flex items-start">
                        <AwardIcon className="w-6 h-6 mr-3 text-brand-gold flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-semibold text-brand-blue">Certifications</h4>
                            <p className="text-brand-text text-sm">{vendor.certifications.join(', ')}</p>
                        </div>
                    </div>
                )}
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200">
            <div className="bg-white p-6">
    <h3 className="text-lg text-brand-blue font-serif mb-3">Contact</h3>
    {vendor.contact?.email && <a href={`mailto:${vendor.contact?.email}`} className="text-brand-light-blue hover:underline block truncate">{vendor.contact?.email}</a>}
    {vendor.contact?.website && <a href={`https://${vendor.contact?.website}`} target="_blank" rel="noopener noreferrer" className="text-brand-light-blue hover:underline block truncate">{vendor.contact?.website}</a>}
</div>
             <div className="bg-white p-6">
                <h3 className="text-lg text-brand-blue font-serif mb-3">Find Us At</h3>
                {vendorMarkets.map(market => (
                    <p key={market.id} onClick={() => onSelectMarket(market.id)} className="text-brand-text hover:text-brand-blue cursor-pointer">{market.name}</p>
                ))}
            </div>
            {vendor.photos && vendor.photos.length > 0 && (
              <div className="bg-white p-6">
                <h3 className="text-lg text-brand-blue font-serif mb-3">Gallery</h3>
                <div className="grid grid-cols-2 gap-2">
                  {vendor.photos.map((photo, index) => (
                    <img key={index} src={photo} alt={`${vendor.name} photo ${index + 1}`} className="w-full h-28 rounded-md object-cover" />
                  ))}
                </div>
              </div>
            )}
        </div>
        
        <div className="p-6 md:p-8 border-t">
          <h2 className="text-2xl text-brand-blue font-serif mb-6">Connect with {vendor.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
    <div>
        {vendor.contact?.socials && (
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-brand-blue mb-3">Follow Us</h3>
                <div className="flex space-x-4">
                    {vendor.contact?.socials.instagram && <a href={`https://instagram.com/${vendor.contact?.socials.instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-blue"><InstagramIcon className="w-6 h-6" /></a>}
                    {vendor.contact?.socials.facebook && <a href={`https://facebook.com/${vendor.contact?.socials.facebook}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-blue"><FacebookIcon className="w-6 h-6" /></a>}
                    {vendor.contact?.socials.pinterest && <a href={`https://pinterest.com/${vendor.contact?.socials.pinterest}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-blue"><PinterestIcon className="w-6 h-6" /></a>}
                    {vendor.contact?.socials.etsy && <a href={`https://etsy.com/shop/${vendor.contact?.socials.etsy}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-brand-blue"><EtsyIcon className="w-6 h-6" /></a>}
                </div>
            </div>
        )}
    </div>
    {vendor.contact?.email && <ContactForm recipientEmail={vendor.contact?.email} currentUser={currentUser} onSend={onContactSubmit} />}
</div>
        </div>

         <div className="p-6 md:p-8 border-t">
            <h2 className="text-2xl text-brand-blue font-serif mb-4">Reviews</h2>
            {currentUser && <div className="mb-8"><ReviewForm onSubmit={onAddReview} /></div>}
            <div className="space-y-6">
                {approvedReviews.length > 0 ? approvedReviews.map(review => (
                    <div key={review.id} className="border-b pb-4">
                        <div className="flex flex-wrap items-center mb-1">
                            <RatingStars rating={review.rating} />
                            <span className="ml-4 font-bold text-brand-text">{review.author}</span>
                        </div>
                        <p className="text-gray-600">{review.comment}</p>
                        <p className="text-xs text-gray-400 mt-1">{review.date}</p>
                    </div>
                )) : <p className="text-gray-500">This vendor has no reviews yet.</p>}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VendorProfile;