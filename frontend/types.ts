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
  rating: number;
  comment: string;
  date: string;
  status: 'pending' | 'approved' | 'declined';
}

// ── Market taxonomy ───────────────────────────────────────────────────────────

export const MarketCategories = {
  FARMERS_MARKET:            "Farmers Market",
  ARTISAN_CRAFT_MARKET:      "Artisan & Craft Market",
  FARM_GATE_STAND:           "Farm Gate Stand",
  FLEA_MARKET:               "Flea Market / Swap Meet",
  FOOD_TRUCK_COURT:          "Food Truck Court",
  NIGHT_MARKET:              "Night Market",
  POP_UP_MARKET:             "Pop-Up Market",
  VINTAGE_COLLECTIBLE:       "Vintage & Collectible Market",
  HOLIDAY_SEASONAL_MARKET:   "Holiday & Seasonal Market",
  STREET_MARKET:             "Street Market",
  SPECIALTY_MARKET:          "Specialty Market",
  YOUTH_MARKET:              "Youth Market",
} as const;
export type MarketCategory = typeof MarketCategories[keyof typeof MarketCategories];

export const MarketTags = [
  // Schedule & Format
  "Weekly", "Bi-Weekly", "Monthly", "Annual", "Seasonal",
  "Indoor", "Outdoor", "Street Closure", "On-Farm",
  // Vendor Policy
  "Juried", "Non-Juried", "Youth Vendors Welcome",
  "Commercial Vendors Welcome", "Invitation Only",
  // Admission
  "Free Admission", "Paid Admission", "Pay-What-You-Can",
  // Amenities
  "Free Parking", "Paid Parking", "Street Parking",
  "Wheelchair Accessible", "Public Washrooms", "Picnic Area",
  "Seating Available", "Kids Play Area", "Dog Friendly",
  // Experience
  "Live Music", "Entertainment", "Licensed (Alcohol)",
  "Food Available", "ATM On-Site",
  // Payment accepted
  "Cash", "Debit/Credit", "E-Transfer",
] as const;
export type MarketTag = typeof MarketTags[number];

// ── Vendor taxonomy ───────────────────────────────────────────────────────────

export const VendorTypes = [
  "Agriculture & Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Baked Goods",
  "Prepared Foods & Preserves",
  "Beverages",
  "Fine Art & Artisan",
  "Craft & Homemade",
  "Clothing & Accessories",
  "Wellness & Beauty",
  "Home & Garden",
  "Children's Products",
  "Pet Products",
  "Vintage & Collectibles",
  "Books & Music",
  "Experiences & Services",
  "Commercial / Reseller",
] as const;
export type VendorType = typeof VendorTypes[number];

export const VendorTags = [
  // What you sell — Food & Farm
  "Fresh Vegetables", "Fresh Fruits", "Organic Produce", "Herbs & Spices",
  "Spices & Seasonings", "Plants & Flowers", "Gardening Supplies",
  "Fresh Meat", "Seafood", "Poultry", "Milk & Cheese", "Eggs",
  "Yogurt & Butter", "Bread & Pastries", "Cakes & Cookies",
  "Jam & Preserves", "Hot Sauce & Condiments", "Jerky & Dried Meats",
  "Meal Kits", "Pickles & Fermented", "Ready-to-Eat Meals",
  "Street Food", "Food Truck", "Coffee & Tea", "Juices & Smoothies",
  "Craft Beverages", "Beer", "Wine", "Cider", "Spirits",
  // What you sell — Art, Craft & Handmade
  "Paintings & Drawings", "Prints & Posters", "Sculptures", "Photography",
  "Glass Art", "Jewelry - Metal", "Jewelry - Non-metal", "Pottery",
  "Woodworking", "Textiles", "Fibre Art", "Quilting", "Leather Goods",
  "Candles", "Macrame", "Knit & Crochet", "Sewing", "Stickers & Paper Goods",
  "Resin", "3D Printing", "Sublimation",
  // What you sell — Clothing & Accessories
  "Apparel", "Hats & Scarves", "Handbags & Purses",
  // What you sell — Home & Wellness
  "Home Decor", "Skincare Products", "Handmade Soaps", "Essential Oils",
  "Cosmetics", "Crystals",
  // What you sell — Children's & Pets
  "Children's Clothing", "Toys & Games", "Educational Products",
  "Pet Food & Treats", "Pet Accessories", "Pet Toys",
  // What you sell — Vintage & Collectibles
  "Antique Furniture", "Vintage Clothing", "Vintage Items",
  "Collectible Memorabilia",
  // What you sell — Books & Music
  "New Books", "Used Books", "Rare & Antiquarian Books", "Author",
  "CDs & Vinyl Records", "Musical Instruments", "Recording Artist",
  // What you sell — Services & Experiences
  "Face Painting", "Henna Art", "Massage", "Tarot Reading",
  "Repair Services", "Music Performance",
  // What you sell — Commercial / Reseller
  "Norwex", "Sweetlegs", "Usborne Books", "doTERRA", "Young Living",
  "Arbonne", "Mary Kay", "Avon", "Tupperware", "Pampered Chef",
  "Scentsy", "Amway", "Herbalife", "Isagenix", "Forever Living",
  "Nu Skin", "Shaklee",
  // How you make it / grow it
  "Original Artwork", "Commissions Available", "Handmade", "Upcycled",
  "Sustainable", "Organic", "Fair Trade", "Local Ingredients",
  "Pesticide-Free", "Hydroponic", "Free Range", "Grass Fed", "Cruelty-Free",
  // Dietary & allergen
  "Gluten-Free", "Dairy-Free", "Nut-Free", "Keto", "Vegan",
  // Payment
  "Cash", "Debit/Credit", "E-Transfer",
] as const;
export type VendorTag = typeof VendorTags[number];

// Kept for backwards compatibility — remove after Firestore data migration
/** @deprecated use vendorTypes */
export type VendorCategory = string;
/** @deprecated use tags */
export type VendorTag_Legacy = string;

// ── Schedule ──────────────────────────────────────────────────────────────────

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
  startTime: string;
  endTime: string;
}

// ── Market amenities & payment (legacy — now handled via MarketTags) ──────────

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

// ── Profiles ──────────────────────────────────────────────────────────────────

interface Contact {
  email: string;
  phone?: string;
  website?: string;
  socials?: {
    instagram?: string;
    facebook?: string;
    pinterest?: string;
    etsy?: string;
    tiktok?: string;
    website?: string;
  };
}

export interface Promotion {
  id: string;
  type: 'coupon' | 'event';
  title: string;
  description: string;
  startDate: string;
  endDate: string;
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
  tags?: string[];
  /** @deprecated use vendorTypes */
  category?: string;
  /** @deprecated use tags */
  categories?: string[];
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
  joinDate: string;
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
  organizerUid?: string;
  coManagerUids?: string[];
  name: string;
  logoUrl?: string;
  headerPhotoUrl?: string;
  description: string;
  marketTypes: MarketCategory[];
  tags?: string[];
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
  joinDate: string;
  promotions?: Promotion[];
  applicationFormQuestions?: string[];
  allowedVendorCategories?: string[];
  externalEventUrl?: string;
  status: MemberStatus;
  updatedAt?: string;
}

// ── Views ─────────────────────────────────────────────────────────────────────

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
  | { type: 'memberAgreement' }
  | { type: 'organizerHub' };

// ── Phase 2 types ─────────────────────────────────────────────────────────────

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
    maxActiveListings: number;
  };
  marketPageIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EventException {
  date: string;
  type: 'cancelled' | 'modified';
  modifiedStartTime?: string;
  modifiedEndTime?: string;
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
    recurrenceDays?: number[];
    recurrenceFrequency?: 'weekly' | 'biweekly' | 'monthly';
    startTime: string;
    endTime: string;
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