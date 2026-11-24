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
    billingCycle: '6month' | 'annual';
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

// A market: the event people go to (OD-16). Stored in `markets` since stage 1
// (T128); before that in `marketEvents`, under the name MarketEvent.
export interface Market {
  id: string;
  organizerId: string | null;   // null = unclaimed (added by a vendor or HQ)
  organizerUid?: string;        // before stage 1: who created it
  addedBy?: { uid?: string | null; vendorId?: string | null };
  hqCheckedAt?: string;         // last saved by an admin (locks the adding vendor out, stage 3)
  legacyPaths?: string[];       // old /markets/<organizer>/<event> links that forward here
  name: string;
  slug?: string; // readable link part, unique across markets, never changes once set
  description?: string; // optional; the event page falls back to the market's description
  posterUrl?: string;   // vertical poster, shown on the event page
  tileUrl?: string;     // horizontal share image (1200 × 628), used for link previews
  type: 'recurring' | 'dates';
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
    dates?: string[];             // type 'dates': each day it's on
    date?: string;                // before stage 1: a one-time market's date
    startDate?: string;
    endDate?: string;
    recurrenceDays?: number[];    // 0=Sun … 6=Sat
    recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly';
    startTime: string;            // "HH:MM", or '' = to be confirmed
    endTime: string;              // "HH:MM", or '' = to be confirmed
  };
  dateSources?: Record<string, 'vendor'>; // dates known only from a vendor
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
