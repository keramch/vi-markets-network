/**
 * backend/src/types/models.ts
 *
 * Backend TypeScript types for the VI Markets data model.
 * These mirror frontend/types.ts but are kept separate so the backend
 * can evolve independently (e.g. using Firestore Timestamps, server-only fields).
 *
 * Date fields are stored as ISO strings for consistency with existing collections.
 */

export type UserType = 'community' | 'vendor' | 'organizer' | 'both' | 'admin' | 'advertiser';

export type SubscriptionTier = 'free' | 'standard' | 'pro' | 'superPro';

export type MemberStatus = 'active' | 'suspended' | 'archived';

// Tier → max active market listings
export const TIER_MAX_LISTINGS: Record<SubscriptionTier, number> = {
  free:      1,
  standard:  3,
  pro:       10,
  superPro:  -1, // -1 = unlimited
};

export interface OrganizerAccount {
  id: string;
  uid: string;
  orgName: string;
  contactEmail: string;
  subscription: {
    tier: SubscriptionTier;
    billingCycle: 'monthly' | 'annual';
    foundingMember: boolean;
    activeListingCount: number;
    maxActiveListings: number;  // derived from tier; -1 = unlimited
  };
  marketPageIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type MarketTag =
  | 'farmersMarket'
  | 'artisanMarket'
  | 'nightMarket'
  | 'popUp'
  | 'seasonalMarket'
  | 'holidayMarket'
  | 'onFarm'
  | 'indoorMarket';

export interface EventException {
  date: string;                   // ISO date of the overridden occurrence
  type: 'cancelled' | 'modified';
  modifiedStartTime?: string;     // "HH:MM"
  modifiedEndTime?: string;       // "HH:MM"
  note?: string;
}

export interface MarketEvent {
  id: string;
  marketPageId: string;
  organizerUid: string;
  name: string;
  type: 'recurring' | 'oneTime' | 'specialEdition';
  marketTags: MarketTag[];
  location: {
    venueName: string;
    address: string;
    city: string;
    province: string;
    lat?: number;
    lng?: number;
  };
  schedule: {
    date?: string;
    startDate?: string;
    endDate?: string;
    recurrenceDays?: number[];    // 0=Sun … 6=Sat
    recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly';
    startTime: string;            // "HH:MM"
    endTime: string;              // "HH:MM"
  };
  exceptions: EventException[];
  status: 'draft' | 'published' | 'cancelled' | 'archived';
  photos: string[];
  externalEventUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  options?: string[];
  required: boolean;
}

export interface MarketApplication {
  id: string;
  marketEventId: string;
  marketPageId: string;
  organizerUid: string;
  applicationType: 'juried' | 'open';
  status: 'draft' | 'open' | 'closed' | 'archived';
  title: string;
  description: string;
  seekingCategories: string[];
  deadline: string;
  capacity?: number;
  capacityAlertThreshold?: number;
  registeredCount: number;
  customFields: CustomField[];
  notifiedVendorCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorApplication {
  id: string;
  marketApplicationId: string;
  marketEventId: string;
  marketPageId: string;
  vendorUid: string;
  status: 'pending' | 'accepted' | 'rejected' | 'waitlisted' | 'confirmed' | 'cancelled';
  waitlistPosition?: number;
  holdExpiresAt?: string;
  prefillSnapshot: {
    businessName: string;
    categories: string[];
    bio: string;
    website?: string;
    photoUrl?: string;
  };
  customFieldResponses: {
    fieldId: string;
    value: string | boolean;
  }[];
  applicationNote?: string;
  submittedAt: string;
  updatedAt: string;
}

export interface Follow {
  id: string;
  followerUid: string;
  targetId: string;
  targetType: 'market' | 'vendor';
  createdAt: string;
}
