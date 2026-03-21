

import React, { useState, useEffect } from 'react';
import type { Market, Vendor, MarketAmenity, PaymentOption, Review, VendorTag, VendorCategory, Application, User, ScheduleRule } from '../types';
import { MarketAmenities, PaymentOptions, DayOfWeek, VendorTags, VendorCategories } from '../types';
import ImageUploader from './ImageUploader';
import { getDistance } from '../utils';
import { WarningIcon, InboxIcon, RibbonIcon } from './Icons';
import { uploadImage, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from '../services/storageUpload';

interface ProfileManagerProps {
  profileData: Market | Vendor;
  user: User | null;
  allMarkets: Market[];
  applications?: Application[];
  vendors?: Vendor[];
  reviewsToModerate: Review[];
  onModerateReview: (reviewId: string, newStatus: 'approved' | 'declined') => void;
  onUpdateApplicationStatus?: (applicationId: string, status: 'approved' | 'rejected') => void;
  onSaveChanges: (updatedData: Market | Vendor) => void;
  onBack: () => void;
  isAdmin: boolean;
  onToggleAutoRenew: (autoRenew: boolean) => void;
}

const isMarket = (profile: Market | Vendor): profile is Market => {
  return 'location' in profile;
};

type ActiveTab = 'details' | 'applications' | 'settings' | 'reviews' | 'promotions' | 'billing';

const ProfileManager: React.FC<ProfileManagerProps> = ({ 
    profileData,
    user, 
    allMarkets, 
    applications = [],
    vendors = [],
    onSaveChanges, 
    onBack, 
    reviewsToModerate, 
    onModerateReview,
    onUpdateApplicationStatus,
    isAdmin,
    onToggleAutoRenew
}) => {
  const [formData, setFormData] = useState(profileData);
  const [scheduleConflicts, setScheduleConflicts] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('details');

  // Pending image files (set on selection, uploaded on save)
  const [pendingLogoFile, setPendingLogoFile]       = useState<File | null>(null);
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress]           = useState<number | null>(null);
  const [uploadError, setUploadError]                 = useState<string | null>(null);

  const isProMember = user?.subscription?.tier === 'pro' || user?.subscription?.tier === 'superPro' || user?.subscription?.foundingMember === true;

  useEffect(() => {
    if (!isMarket(formData)) return;

    const conflicts: string[] = [];
    const currentMarket = formData;

    currentMarket.schedule?.rules?.forEach(rule => {
      const conflictingMarkets = allMarkets.filter(otherMarket => {
        if (otherMarket.id === currentMarket.id) return false;
        if (otherMarket.status !== 'active') return false;

        const hasSameDay = otherMarket.schedule?.rules?.some((otherRule: ScheduleRule) => otherRule.dayOfWeek === rule.dayOfWeek);
        if (!hasSameDay) return false;
        
        const distance = getDistance(currentMarket.location.coordinates, otherMarket.location.coordinates);
        return distance < 10;
      });

      conflictingMarkets.forEach(conflictMarket => {
        const distance = getDistance(currentMarket.location.coordinates, conflictMarket.location.coordinates);
        conflicts.push(`${conflictMarket.name} also runs on ${rule.dayOfWeek}s and is ${distance.toFixed(1)}km away.`);
      });
    });

    setScheduleConflicts(conflicts);
  }, [formData, allMarkets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({...prev, contact: {...prev.contact, [name]: value}}));
  };
  
  const handleCheckboxChange = (
      e: React.ChangeEvent<HTMLInputElement>, 
      group: 'amenities' | 'paymentOptions' | 'tags' | 'allowedVendorCategories'
  ) => {
    const { value, checked } = e.target;
    
    if (group === 'tags' && !isMarket(formData)) {
        const currentValues = formData.tags || [];
        const newValues = checked 
            ? [...currentValues, value] 
            : currentValues.filter(item => item !== value);
        setFormData({ ...formData, tags: newValues as VendorTag[] });
        return;
    }

    if (!isMarket(formData)) return;
    
    if (group === 'allowedVendorCategories') {
        const currentValues = formData.allowedVendorCategories || [];
        const newValues = checked
            ? [...currentValues, value]
            : currentValues.filter(item => item !== value);
        setFormData({...formData, allowedVendorCategories: newValues as VendorCategory[]});
        return;
    }

    const currentValues = formData[group as 'amenities' | 'paymentOptions'] || [];
    const newValues = checked 
        ? [...currentValues, value] 
        : currentValues.filter(item => item !== value);
        
    setFormData({ ...formData, [group]: newValues });
  };
  
  const profileType = isMarket(formData) ? 'markets' : 'vendors';

  const saveWithUploads = async () => {
    setUploadError(null);

    let updatedData: Market | Vendor = { ...formData };
    const totalFiles = (pendingLogoFile ? 1 : 0) + pendingGalleryFiles.length;

    if (totalFiles > 0) {
      setUploadProgress(0);

      try {
        if (pendingLogoFile) {
          const ext = pendingLogoFile.name.split('.').pop() ?? 'jpg';
          const path = `${profileType}/${formData.id}/logo_${Date.now()}.${ext}`;
          const logoUrl = await uploadImage(pendingLogoFile, path);
          updatedData = { ...updatedData, logoUrl };
        }

        if (pendingGalleryFiles.length > 0) {
          const urls: string[] = [];
          for (const file of pendingGalleryFiles) {
            const ext = file.name.split('.').pop() ?? 'jpg';
            const path = `${profileType}/${formData.id}/gallery_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            urls.push(await uploadImage(file, path));
          }
          updatedData = { ...updatedData, photos: urls };
        }
      } catch {
        setUploadError('Image upload failed. Please try again.');
        setUploadProgress(null);
        return;
      }

      setUploadProgress(null);
      setPendingLogoFile(null);
      setPendingGalleryFiles([]);
    }

    onSaveChanges(updatedData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveWithUploads();
  };

  const TabButton: React.FC<{tab: ActiveTab, label: string}> = ({tab, label}) => (
     <button 
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === tab ? 'bg-brand-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}
    >
        {label}
    </button>
  );

  const ApplicationSettings = ({marketData}: {marketData: Market}) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold text-brand-blue mb-2">Allowed Vendor Categories</h3>
            <p className="text-sm text-gray-500 mb-3">Select which vendor categories can apply to your market. If none are selected, all categories are allowed.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.values(VendorCategories).map(cat => (
                    <label key={cat} className="flex items-center">
                        <input 
                            type="checkbox"
                            value={cat}
                            checked={marketData.allowedVendorCategories?.includes(cat)}
                            onChange={(e) => handleCheckboxChange(e, 'allowedVendorCategories')}
                            className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-gold"
                        />
                        <span className="ml-2 text-sm text-gray-600">{cat}</span>
                    </label>
                ))}
            </div>
        </div>
        <div>
            <h3 className="text-lg font-semibold text-brand-blue mb-2">Custom Application Questions</h3>
            <p className="text-sm text-gray-500 mb-3">Add questions to your application form (one per line).</p>
            <textarea 
                value={(marketData.applicationFormQuestions || []).join('\n')}
                onChange={e => setFormData({...formData, applicationFormQuestions: e.target.value.split('\n')})}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
        </div>
    </div>
  );

  const ManageApplications = ({marketData}: {marketData: Market}) => {
    const marketApplications = applications.filter(app => app.marketId === marketData.id);

    return (
        <div>
             {marketApplications.length > 0 ? (
                <div className="space-y-4">
                    {marketApplications.map(app => {
                        const vendor = vendors.find(v => v.id === app.vendorId);
                        if (!vendor) return null;
                        return (
                             <div key={app.id} className="p-4 border rounded-md bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-brand-blue">{vendor.name} <span className="text-sm font-normal text-gray-500">({vendor.category})</span></p>
                                        <p className="text-sm text-gray-500">Applied on {app.date}</p>
                                        {app.customResponses.map(res => (
                                            <div key={res.question} className="mt-2 text-xs">
                                                <p className="font-semibold text-gray-600">{res.question}</p>
                                                <p className="text-gray-800">{res.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-4">
                                        {app.status === 'pending' && onUpdateApplicationStatus ? (
                                             <div className="flex space-x-2">
                                                <button type="button" onClick={() => onUpdateApplicationStatus?.(app.id, 'approved')} className="text-xs font-semibold bg-green-200 text-green-800 px-3 py-1 rounded-full hover:bg-green-300">Approve</button>
                                                <button type="button" onClick={() => onUpdateApplicationStatus?.(app.id, 'rejected')} className="text-xs font-semibold bg-red-200 text-red-800 px-3 py-1 rounded-full hover:bg-red-300">Reject</button>
                                            </div>
                                        ) : (
                                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${app.status === 'approved' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                                {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <InboxIcon className="w-12 h-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Applications Yet</h3>
                    <p className="mt-1 text-sm text-gray-500">When vendors apply to your market, you'll see their applications here.</p>
                </div>
            )}
        </div>
    );
  }
  
  const BillingPanel = () => {
    if (!user) return null;
    const nextRenewalDate = new Date();
    nextRenewalDate.setFullYear(nextRenewalDate.getFullYear() + 1);

    if (user.subscription?.foundingMember) {
      return (
        <div className="bg-brand-gold/10 border-l-4 border-brand-gold text-brand-blue p-4 rounded-r-lg">
            <div className="flex">
                <div className="py-1"><RibbonIcon className="h-6 w-6 text-brand-gold mr-3"/></div>
                <div>
                    <h3 className="font-bold">Founding Member</h3>
                    <p className="text-sm">Thank you for being an early supporter! You have lifetime Pro access to all features.</p>
                </div>
            </div>
        </div>
      )
    }

    return (
      <div>
        <h3 className="text-lg font-semibold text-brand-blue mb-4">Current Plan: <span className="font-normal capitalize">{user.subscription?.tier ?? 'free'}</span></h3>
        <div className="bg-brand-cream/60 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Auto-Renewal</p>
              <p className="text-sm text-gray-600">
                Your plan is set to {user.autoRenew ? 'automatically renew' : 'expire'} on {nextRenewalDate.toLocaleDateString()}.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                  We'll send a reminder 6 months before your renewal date.
              </p>
            </div>
            <button
                type="button"
                className={`${user.autoRenew ? 'bg-brand-blue' : 'bg-gray-200'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out`}
                role="switch"
                aria-checked={user.autoRenew}
                onClick={() => onToggleAutoRenew(!user.autoRenew)}
            >
                <span className={`${user.autoRenew ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={onBack} className="mb-4 text-brand-light-blue hover:text-brand-blue font-semibold">
        &larr; {isAdmin ? 'Back to Market HQ' : 'Back to home'}
      </button>

      {/* Sticky save bar */}
      <div className="sticky top-20 z-10 bg-white/95 backdrop-blur-sm border-y shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 mb-6 flex items-center justify-between">
        <span className="font-semibold text-brand-blue truncate mr-4">{formData.name}</span>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors">Cancel</button>
          <button type="button" onClick={saveWithUploads} disabled={uploadProgress !== null} className="bg-brand-blue text-white text-sm font-semibold py-1.5 px-5 rounded-md hover:bg-opacity-90 transition-colors disabled:opacity-60">Save Changes</button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-xl">
        {isAdmin && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6" role="alert">
                <p className="font-bold">Admin Mode</p>
                <p>You are editing this profile as an administrator. Changes will be saved directly.</p>
            </div>
        )}
        <h2 className="text-3xl font-serif text-brand-blue mb-2">{isMarket(formData) ? 'Market Hub' : 'Vendor Hub'}</h2>
        <p className="text-gray-600 mb-6">Manage your public profile, promotions, and applications.</p>

        <div className="border-b mb-6">
            <div className="flex space-x-2 flex-wrap">
                <TabButton tab="details" label="Profile Details" />
                 {isMarket(formData) && isProMember && (
                    <>
                        <TabButton tab="settings" label="Application Settings" />
                        <TabButton tab="applications" label="Manage Applications" />
                    </>
                 )}
                {!isAdmin && (
                     <TabButton tab="reviews" label="Review Moderation" />
                )}
                {isProMember && !isAdmin && (
                    <TabButton tab="billing" label="Billing & Membership" />
                )}
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'details' && (
                <>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" name="name" value={formData.name ?? ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea name="description" value={formData.description ?? ''} onChange={handleChange} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                    </div>
                    
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-brand-blue mb-2">Contact Info</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="email" name="email" placeholder="Email" value={formData.contact?.email ?? ''} onChange={handleContactChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                            <input type="tel" name="phone" placeholder="Phone" value={formData.contact?.phone ?? ''} onChange={handleContactChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                            <input type="text" name="website" placeholder="Website (e.g. yoursite.com)" value={formData.contact?.website ?? ''} onChange={handleContactChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                        </div>
                    </div>

                    {isMarket(formData) ? (
                        <>
                           <div>
                                <label className="block text-sm font-medium text-gray-700">Address</label>
                                <input 
                                    type="text" 
                                    name="address"
                                    value={formData.location.address} 
                                    onChange={e => setFormData({...formData, location: {...formData.location, address: e.target.value }})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                />
                            </div>
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-brand-blue mb-2">Schedule</h3>
                                <div className="grid grid-cols-3 gap-4">
                                <select
                                        value={formData.schedule?.rules[0]?.dayOfWeek}
                                        onChange={e => {
                                            const newRules = [...(formData.schedule?.rules ?? [])];
                                            if(newRules.length > 0) {
                                                newRules[0] = {...newRules[0], dayOfWeek: e.target.value as DayOfWeek};
                                                setFormData({...formData, schedule: {...formData.schedule, rules: newRules }});
                                            }
                                        }}
                                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                >
                                    {Object.values(DayOfWeek).map(day => <option key={day} value={day}>{day}</option>)}
                                </select>
                                    <input type="time" value={formData.schedule?.rules[0]?.startTime} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                                    <input type="time" value={formData.schedule?.rules[0]?.endTime} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Notes (e.g., Year-round)"
                                    value={formData.schedule?.notes ?? ''}
                                    onChange={e => setFormData({...formData, schedule: {...formData.schedule, notes: e.target.value}})}
                                    className="mt-2 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                />
                                {scheduleConflicts.length > 0 && (
                                    <div className="mt-4 p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                                        <div className="flex">
                                            <div className="py-1"><WarningIcon className="h-5 w-5 text-yellow-500 mr-3"/></div>
                                            <div>
                                                <p className="font-bold">Potential Schedule Conflict</p>
                                                <ul className="list-disc list-inside text-sm">
                                                    {scheduleConflicts.map((conflict, i) => <li key={i}>{conflict}</li>)}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-brand-blue mb-2">Amenities</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(MarketAmenities).map(amenity => (
                                        <label key={amenity} className="flex items-center">
                                            <input 
                                                type="checkbox"
                                                value={amenity}
                                                checked={formData.amenities?.includes(amenity as MarketAmenity)}
                                                onChange={(e) => handleCheckboxChange(e, 'amenities')}
                                                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-gold"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">{amenity}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-brand-blue mb-2">Payment Options</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(PaymentOptions).map(option => (
                                        <label key={option} className="flex items-center">
                                            <input 
                                                type="checkbox"
                                                value={option}
                                                checked={formData.paymentOptions?.includes(option as PaymentOption)}
                                                onChange={(e) => handleCheckboxChange(e, 'paymentOptions')}
                                                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-gold"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                         <>
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-brand-blue mb-2">Tags</h3>
                                <p className="text-sm text-gray-500 mb-3">Select all tags that apply to your products. This helps customers find you.</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.values(VendorTags).map(tag => (
                                        <label key={tag} className="flex items-center">
                                            <input 
                                                type="checkbox"
                                                value={tag}
                                                checked={formData.tags?.includes(tag as VendorTag)}
                                                onChange={(e) => handleCheckboxChange(e, 'tags')}
                                                className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-gold"
                                            />
                                            <span className="ml-2 text-sm text-gray-600">{tag}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Origin Story</label>
                                <textarea name="originStory" value={formData.originStory || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Sustainability Practices</label>
                                <textarea name="sustainabilityPractices" value={formData.sustainabilityPractices || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
                            </div>
                        </>
                    )}

                    <div className="border-t pt-6 space-y-6">
                        <h3 className="text-lg font-semibold text-brand-blue">Images</h3>

                        {/* Current logo preview */}
                        {formData.logoUrl && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Current Logo</p>
                                <img src={formData.logoUrl} alt="Current logo" className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" />
                            </div>
                        )}
                        <ImageUploader
                            id="logo-manager"
                            label="Upload New Logo (square)"
                            onFilesChanged={(files) => setPendingLogoFile(files[0] ?? null)}
                            maxFiles={1}
                            maxSizeKB={MAX_IMAGE_SIZE_BYTES / 1024}
                            allowedTypes={ALLOWED_IMAGE_TYPES}
                            aspectRatio="1:1"
                        />

                        {/* Current gallery — square thumbnails with header designation */}
                        {formData.photos && formData.photos.length > 0 && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                    Current Gallery ({formData.photos.length} photo{formData.photos.length !== 1 ? 's' : ''})
                                </p>
                                {isMarket(formData) && (
                                    <p className="text-xs text-gray-500 mb-2">Hover a photo and click "Set header" to use it as the hero banner.</p>
                                )}
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {formData.photos.map((url, i) => {
                                        const isHeader = isMarket(formData) && formData.headerPhotoUrl === url;
                                        return (
                                            <div key={i} className="relative group">
                                                <img
                                                    src={url}
                                                    alt={`Gallery ${i + 1}`}
                                                    className={`w-full aspect-square object-cover rounded-md border-2 transition-colors ${isHeader ? 'border-brand-blue' : 'border-gray-200'}`}
                                                />
                                                {isMarket(formData) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, headerPhotoUrl: isHeader ? undefined : url })}
                                                        className={`absolute inset-x-0 bottom-0 text-xs py-0.5 rounded-b-md font-medium transition-all ${isHeader ? 'bg-brand-blue text-white' : 'bg-black/60 text-white opacity-0 group-hover:opacity-100'}`}
                                                    >
                                                        {isHeader ? '★ Header' : 'Set header'}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <ImageUploader
                            id="gallery-manager"
                            label="Upload Gallery Photos (replaces existing, up to 6)"
                            onFilesChanged={(files) => setPendingGalleryFiles(files)}
                            maxFiles={6}
                            maxSizeKB={MAX_IMAGE_SIZE_BYTES / 1024}
                            allowedTypes={ALLOWED_IMAGE_TYPES}
                        />
                    </div>
                </>
            )}

            {activeTab === 'settings' && isMarket(formData) && (
                <ApplicationSettings marketData={formData} />
            )}

             {activeTab === 'applications' && isMarket(formData) && (
                <ManageApplications marketData={formData} />
            )}

            {activeTab === 'reviews' && (
                 <div>
                    <h2 className="text-2xl font-serif text-brand-blue mb-4">Review Moderation</h2>
                    {reviewsToModerate.length > 0 ? (
                        <div className="space-y-4">
                            {reviewsToModerate.map(review => (
                                <div key={review.id} className="p-3 border rounded-md bg-brand-cream/60">
                                    <p className="font-semibold">{review.author} <span className="font-normal text-gray-600">rated {review.rating}/5</span></p>
                                    <p className="text-sm text-gray-800 my-1">"{review.comment}"</p>
                                    <div className="flex justify-end space-x-2 mt-2">
                                        <button type="button" onClick={() => onModerateReview(review.id, 'approved')} className="text-xs font-semibold bg-green-200 text-green-800 px-2 py-1 rounded hover:bg-green-300">Approve</button>
                                        <button type="button" onClick={() => onModerateReview(review.id, 'declined')} className="text-xs font-semibold bg-red-200 text-red-800 px-2 py-1 rounded hover:bg-red-300">Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">You have no pending reviews to moderate.</p>
                    )}
                </div>
            )}
            
            {activeTab === 'billing' && (
                <BillingPanel />
            )}
          
          {/* Upload progress */}
          {uploadProgress !== null && (
            <div className="pt-4">
              <div className="flex items-center justify-between text-sm text-brand-blue mb-1">
                <span>Uploading images…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-brand-blue h-2 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          {uploadError && (
            <p className="text-sm text-red-600 pt-2">{uploadError}</p>
          )}

          <div className="flex justify-end pt-6 border-t">
            <button type="button" onClick={onBack} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-4 hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={uploadProgress !== null} className="bg-brand-blue text-white font-semibold py-2 px-6 rounded-md hover:bg-opacity-90 disabled:opacity-60">
              {uploadProgress !== null ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileManager;