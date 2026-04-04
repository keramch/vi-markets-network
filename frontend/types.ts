export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NotificationSettings {
  favoriteVendor: boolean;
  favoriteMarket: boolean;
  nearbyMarket: boolean;
}

export type UserType = 'community' | 'vendor' | 'organizer' | 'both' | 'admin' | 'advertiser';

export type SubscriptionTier = 'free' | 'standard' | 'pro' | 'superPro';

export interface UserSubscription {
  tier: SubscriptionTier;
  billingCycle: 'monthly' | 'annual' | null;
  foundingMember: boolean;
}

export interface User {
  id: string;
  email: string;
  emailLower?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  businessName?: string;
  accountType?: string;
  city?: string;
  postalCode: string;
  description?: string;
  createdAt?: number;
  isAdmin?: boolean;
  autoRenew?: boolean;
  subscription: UserSubscription;
  userType?: UserType;
  ownedMarketId?: string;
  ownedVendorId?: string;
  notificationSettings?: NotificationSettings;
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

export const VendorTypes = {
  FARMER_GROWER: "Farmer / Grower",
  FOOD_PRODUCER: "Food Producer",
  READY_TO_EAT: "Ready-to-Eat / Food Stall",
  ARTIST_MAKER: "Artist / Maker / Crafter",
  VINTAGE_COLLECTIBLE: "Vintage & Collectible",
  WELLNESS_BODY: "Wellness & Body",
  SERVICES: "Services",
  PET_PRODUCTS: "Pet Products",
  BOOKS_MUSIC: "Books & Music",
  COMMERCIAL_RESELLER: "Commercial / Reseller",
} as const;
export type VendorType = typeof VendorTypes[keyof typeof VendorTypes];

export const VendorCategoriesByType: Record<string, string[]> = {
  "Farmer / Grower": ["Produce", "Meat & Seafood", "Dairy & Eggs", "Plants & Flowers", "Herbs & Spices"],
  "Food Producer": ["Bakery", "Preserves & Condiments", "Beverages", "Prepared Foods"],
  "Ready-to-Eat / Food Stall": ["Street Food", "Ready-to-Eat Meals", "Food Truck", "Juices & Smoothies", "Coffee & Tea", "Brewery / Distillery"],
  "Artist / Maker / Crafter": ["Paintings & Drawings", "Prints & Posters", "Sculptures", "Photography", "Jewelry", "Pottery & Glass", "Textiles & Fibre Art", "Wood & Leather", "Home Decor", "Apparel", "Candles", "Paper Goods", "Children's Clothing", "Toys & Games", "Educational Products"],
  "Vintage & Collectible": ["Antique Furniture", "Vintage Clothing", "Collectible Memorabilia", "Books & Media"],
  "Wellness & Body": ["Soap & Skincare", "Cosmetics", "Essential Oils", "Crystals"],
  "Services": ["Repair Services", "Face Painting", "Henna Art", "Massage", "Tarot & Metaphysical", "Music"],
  "Pet Products": ["Pet Food & Treats", "Pet Accessories", "Pet Toys"],
  "Books & Music": ["Author", "Recording Artist", "New & Used Books", "CDs & Vinyl", "Musical Instruments"],
  "Commercial / Reseller": ["Independent Distributor", "MLM", "Bulk Reseller", "Lot Buyer"],
};

export const VendorTagsByType: Record<string, string[]> = {
  "Farmer / Grower": ["Organic", "Family Farm", "Sustainable", "Pesticide-Free", "Free Range", "Grass Fed", "Hydroponic"],
  "Food Producer": ["Organic", "Local Ingredients", "Gluten-Free", "Vegan", "Dairy-Free", "Nut-Free", "Keto", "Fair Trade", "Sustainable", "Imported Ingredients", "Global Flavours"],
  "Ready-to-Eat / Food Stall": ["Gluten-Free", "Vegan", "Dairy-Free", "Nut-Free", "Keto", "Ready to Eat", "Beer", "Wine", "Cider", "Spirits"],
  "Artist / Maker / Crafter": ["Handmade", "Local Materials", "Upcycled/Recycled", "Sustainable", "Ethical", "Prints Available", "Original Artwork", "Commissions Available", "Macrame", "Wearable Art", "Functional", "Accessories", "Kitchen", "Screenprinting", "Sublimation", "3D Printing", "Stickers", "Fantasy/Faerie/Magic", "Weaving", "Knit/Crochet", "Sewing"],
  "Vintage & Collectible": ["Antique", "Upcycled/Recycled"],
  "Wellness & Body": ["Organic", "Handmade", "Vegan", "Cruelty-Free", "Sustainable"],
  "Services": [],
  "Pet Products": ["Handmade", "Organic", "Vegan"],
  "Books & Music": ["New", "Used", "Reseller (e.g. Usborne Books)", "Local Author", "Local Artist"],
  "Commercial / Reseller": ["Norwex", "Sweetlegs", "Usborne Books", "doTERRA", "Young Living", "Arbonne", "Mary Kay", "Avon", "Tupperware", "Pampered Chef", "Scentsy", "Amway", "Herbalife", "Isagenix", "Forever Living", "Nu Skin", "Shaklee"],
};

// Kept for backwards compatibility with Market.allowedVendorCategories
export type VendorCategory = string;
export type VendorTag = string;

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
  slug?: string;
  name: string;
  logoUrl?: string;
  description: string;
  vendorTypes?: VendorType[];
  categories?: string[];
  tags?: string[];
  /** @deprecated use vendorTypes */
  category?: VendorCategory;
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
  slug?: string;
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
  | { type: 'signup' }
  | { type: 'browseMarkets' }
  | { type: 'browseVendors' }
  | { type: 'pricing' }
  | { type: 'about' }
  | { type: 'privacy' }
  | { type: 'terms' }
  | { type: 'memberAgreement' };

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