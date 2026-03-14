export interface Coordinates {
  lat: number;
  lng: number;
}

export type MembershipPlan = 
  | 'free'
  | 'vendor-monthly'
  | 'vendor-annual'
  | 'vendor-lifetime'
  | 'vendor-pro-monthly'
  | 'vendor-pro-annual'
  | 'vendor-pro-lifetime'
  | 'market-one-time'
  | 'market-monthly'
  | 'market-annual'
  | 'market-lifetime'
  | 'market-pro-monthly'
  | 'market-pro-annual'
  | 'market-pro-lifetime';


export interface NotificationSettings {
  favoriteVendor: boolean;
  favoriteMarket: boolean;
  nearbyMarket: boolean;
}

export type UserType = 'community' | 'vendor' | 'organizer' | 'both' | 'admin' | 'advertiser';

export type SubscriptionTier = 'free' | 'standard' | 'pro' | 'superPro';

export interface User {
  id: string;
  email: string;
  postalCode: string;
  membership: MembershipPlan;
  userType?: UserType;
  ownedMarketId?: string;
  ownedVendorId?: string;
  isAdmin?: boolean;
  notificationSettings?: NotificationSettings;
  autoRenew?: boolean;
  isFoundingMember?: boolean;
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'declined';
}

export const MarketCategories = {
  FARMERS_MARKET: "Farmers Market",
  ARTISAN_FAIR: "Artisan Fair",
  FLEA_MARKET: "Flea Market",
  SPECIALTY_FOOD: "Specialty Food Market",
  NIGHT_MARKET: "Night Market",
} as const;
export type MarketCategory = typeof MarketCategories[keyof typeof MarketCategories];

export const VendorCategories = {
  // Food & Drink
  PRODUCE: "Produce",
  BAKERY: "Bakery",
  DAIRY_CHEESE: "Dairy & Cheese",
  MEAT_SEAFOOD: "Meat & Seafood",
  PREPARED_FOODS: "Prepared Foods", // Preserves, condiments, candy, etc.
  BEVERAGES: "Beverages",

  // Handmade Goods & Wares
  APPAREL_TEXTILES: "Apparel & Textiles", // Clothing, all fibre arts
  ART_DECOR: "Art & Decor", // Fine art, photography, home decor
  BODY_CARE: "Body Care", // Soaps, lotions, healing arts
  JEWELRY: "Jewelry", // All jewelry types
  KIDS_TOYS: "Kids & Toys", // Children's items, dolls, toys
  PAPER_GOODS: "Paper Goods", // Books, cards, stationery
  PET_SUPPLIES: "Pet Supplies",
  POTTERY_GLASS: "Pottery & Glass", // Ceramics, pottery, glasswork
  WOOD_LEATHER_METAL: "Wood, Leather & Metal",
  SPECIALTY_CRAFTS: "Specialty Crafts", // Candles, etc.
  VINTAGE_COLLECTIBLE: "Vintage & Collectible",

  // Plants
  PLANTS_FLOWERS: "Plants & Flowers",
} as const;

export type VendorCategory = typeof VendorCategories[keyof typeof VendorCategories];

export const VendorTags = {
    // Sourcing & Ethics
    ORGANIC: "Organic",
    LOCAL_INGREDIENTS: "Local Ingredients",
    LOCALLY_DESIGNED: "Locally Designed",
    ETHICAL: "Ethical",
    FAIR_TRADE: "Fair Trade",
    SUSTAINABLE: "Sustainable",
    FAMILY_FARM: "Family Farm",
    UPCYCLED_RECYCLED: "Upcycled/Recycled",

    // Dietary
    GLUTEN_FREE: "Gluten-Free",
    VEGAN: "Vegan",
    DAIRY_FREE: "Dairy-Free",
    NUT_FREE: "Nut-Free",
    KETO: "Keto",
    READY_TO_EAT: "Ready to Eat",

    // Attributes & Themes
    HANDMADE: "Handmade",
    COMMERCIAL_RESELLER: "Commercial/Reseller",
    CHRISTMAS_HOLIDAY: "Christmas/Holiday",
    FANTASY_FAERIE: "Fantasy/Faerie",
    CRYSTALS_METAPHYSICAL: "Crystals/Metaphysical",
    MINIATURES: "Miniatures",

    // Materials
    METAL: "Metal",
    NON_METAL_JEWELRY: "Non-Metal (Jewelry)",
    BEADWORK: "Beadwork",
    WOOD: "Wood",
    LEATHER: "Leather",
    CERAMIC: "Ceramic",
    GLASS: "Glass",
    TEXTILE: "Textile",

    // Organization Type
    NON_PROFIT: "Non-Profit",
} as const;

export type VendorTag = typeof VendorTags[keyof typeof VendorTags];

export const DayOfWeek = {
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
} as const;
export type DayOfWeek = typeof DayOfWeek[keyof typeof DayOfWeek];

export interface ScheduleRule {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM" 24-hour format
  endTime: string; // "HH:MM" 24-hour format
}

export const MarketAmenities = {
  PUBLIC_RESTROOMS: "Public Restrooms",
  PET_FRIENDLY: "Pet-friendly",
  LIVE_MUSIC: "Live Music",
  FREE_PARKING: "Free Parking",
  PAID_PARKING: "Paid Parking",
  KIDS_PLAYGROUND: "Kids' Playground",
  PICNIC_AREA: "Picnic Area",
  INDOOR_VENUE: "Indoor Venue",
  STREET_PARKING: "Street Parking",
} as const;
export type MarketAmenity = typeof MarketAmenities[keyof typeof MarketAmenities];

export const PaymentOptions = {
  CASH: "Cash",
  CREDIT_DEBIT: "Credit/Debit",
  E_TRANSFER: "E-Transfer",
  CASH_RECOMMENDED: "Cash Recommended",
} as const;
export type PaymentOption = typeof PaymentOptions[keyof typeof PaymentOptions];

interface Contact {
  email: string;
  phone?: string;
  website?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    pinterest?: string;
    etsy?: string;
  };
}

export interface Promotion {
  id: string;
  type: 'coupon' | 'event';
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export type MemberStatus = 'active' | 'suspended' | 'archived';

export interface Vendor {
  id: string;
  ownerId?: string;
  name: string;
  logoUrl?: string;
  description: string;
  category: VendorCategory;
  tags?: VendorTag[];
  photos: string[];
  contact: Contact;
  priceRange: 'affordable' | 'moderate' | 'premium';
  reviews: Review[];
  attendingMarketIds: string[];
  isFeatured?: boolean;
  productHighlights?: string[];
  sustainabilityPractices?: string;
  certifications?: string[];
  originStory?: string;
  city?: string;
  joinDate: string; // YYYY-MM-DD
  promotions?: Promotion[];
  status: MemberStatus;
}

export interface Application {
    id: string;
    vendorId: string;
    marketId: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
    customResponses: { question: string; answer: string }[];
}


export interface Market {
  id: string;
  ownerId?: string;
  organizerUid?: string;        // links to organizerAccounts doc
  coManagerUids?: string[];     // other users who can manage this page
  name:string;
  logoUrl?: string;
  headerPhotoUrl?: string;
  description: string;
  category: MarketCategory;
  photos: string[];
  contact: Contact;
  location: {
    address: string;
    city?: string;
    region?: string;
    coordinates: Coordinates;
  };
  schedule: {
    rules: ScheduleRule[];
    notes?: string;
  };
  vendorIds: string[];
  reviews: Review[];
  isFeatured?: boolean;
  amenities?: MarketAmenity[];
  paymentOptions?: PaymentOption[];
  seasonalInfo?: string;
  accessibility?: string;
  joinDate: string; // YYYY-MM-DD
  promotions?: Promotion[];
  applicationFormQuestions?: string[];
  allowedVendorCategories?: VendorCategory[];
  externalEventUrl?: string;    // optional Facebook event or external link
  status: MemberStatus;
  updatedAt?: string;           // ISO date
}

export type View =
  | { type: 'home' }
  | { type: 'marketProfile'; id: string }
  | { type: 'vendorProfile'; id: string }
  | { type: 'dashboard' }
  | { type: 'manageProfile' }
  | { type: 'calendar' }
  | { type: 'adminPanel' }
  | { type: 'promotions' }
  | { type: 'notificationSettings' }
  | { type: 'myApplications' }
  | { type: 'privacyPolicy' }
  | { type: 'termsOfService' }
  | { type: 'adminEditProfile'; profileId: string; profileType: 'market' | 'vendor' }
  | { type: 'forgotPassword' }
  | { type: 'signup' };

// ─── Phase 2A: New data model types ─────────────────────────────────────────

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
    maxActiveListings: number;  // 1 | 3 | 10 | -1 (unlimited)
  };
  marketPageIds: string[];
  createdAt: string;  // ISO date
  updatedAt: string;  // ISO date
}

export const MarketTags = {
  FARMERS_MARKET:   'farmersMarket',
  ARTISAN_MARKET:   'artisanMarket',
  NIGHT_MARKET:     'nightMarket',
  POP_UP:           'popUp',
  SEASONAL_MARKET:  'seasonalMarket',
  HOLIDAY_MARKET:   'holidayMarket',
  ON_FARM:          'onFarm',
  INDOOR_MARKET:    'indoorMarket',
} as const;
export type MarketTag = typeof MarketTags[keyof typeof MarketTags];

export interface EventException {
  date: string;                   // ISO date string for the overridden occurrence
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
    date?: string;                // ISO date — for oneTime events
    startDate?: string;           // ISO date — first occurrence (recurring)
    endDate?: string;             // ISO date — last occurrence / end of season
    recurrenceDays?: number[];    // 0=Sun, 1=Mon … 6=Sat
    recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly';
    startTime: string;            // "HH:MM"
    endTime: string;              // "HH:MM"
  };
  exceptions: EventException[];
  status: 'draft' | 'published' | 'cancelled' | 'archived';
  photos: string[];
  externalEventUrl?: string;
  createdAt: string;              // ISO date
  updatedAt: string;              // ISO date
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  options?: string[];             // for select type
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
  deadline: string;               // ISO date
  capacity?: number;              // hidden from public (open markets only)
  capacityAlertThreshold?: number;// e.g. 0.8 for 80%
  registeredCount: number;
  customFields: CustomField[];
  notifiedVendorCount?: number;
  createdAt: string;              // ISO date
  updatedAt: string;              // ISO date
}

export interface VendorApplication {
  id: string;
  marketApplicationId: string;
  marketEventId: string;
  marketPageId: string;
  vendorUid: string;
  status: 'pending' | 'accepted' | 'rejected' | 'waitlisted' | 'confirmed' | 'cancelled';
  waitlistPosition?: number;
  holdExpiresAt?: string;         // ISO date — set when invited from waitlist
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
  submittedAt: string;            // ISO date
  updatedAt: string;              // ISO date
}

export interface Follow {
  id: string;
  followerUid: string;
  targetId: string;               // market page ID or vendor profile ID
  targetType: 'market' | 'vendor';
  createdAt: string;              // ISO date
}