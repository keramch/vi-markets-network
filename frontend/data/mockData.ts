import type { Market, Vendor, Application, User } from '../types';
import { MarketCategories, VendorCategories, DayOfWeek, MarketAmenities, PaymentOptions, VendorTags } from '../types';

export const users: User[] = [
    {
        id: 'user-owner-market-1',
        email: 'manager@citycentermarket.com',
        postalCode: 'V9R 1A1',
        subscription: { tier: 'pro', billingCycle: 'annual', foundingMember: false },
        ownedMarketId: 'market-1',
        autoRenew: true,
    },
    {
        id: 'user-owner-vendor-1',
        email: 'contact@greenthumb.com',
        postalCode: 'V9S 1B1',
        subscription: { tier: 'pro', billingCycle: 'annual', foundingMember: false },
        ownedVendorId: 'vendor-1',
        autoRenew: false,
    },
    {
        id: 'user-admin-1',
        email: 'admin@vimarkets.com',
        postalCode: 'V9T 1C1',
        subscription: { tier: 'free', billingCycle: null, foundingMember: false },
        isAdmin: true,
        autoRenew: false,
    }
];

export const vendors: Vendor[] = [
  {
    id: 'vendor-1',
    ownerId: 'user-owner-vendor-1',
    name: 'Green Thumb Organics',
    logoUrl: 'https://picsum.photos/seed/logo-v1/200',
    description: 'Certified organic vegetables, herbs, and seasonal fruits. We believe in sustainable farming practices that nurture the soil and produce the healthiest food for your family.',
    category: VendorCategories.PRODUCE,
    tags: [VendorTags.ORGANIC, VendorTags.SUSTAINABLE, VendorTags.FAMILY_FARM, VendorTags.LOCAL_INGREDIENTS],
    photos: ['https://picsum.photos/seed/v1/600/400', 'https://picsum.photos/seed/v1a/600/400'],
    contact: { 
      email: 'contact@greenthumb.com', 
      website: 'greenthumb.com',
      socials: { instagram: 'greenthumb', facebook: 'greenthumborganics' }
    },
    priceRange: 'moderate',
    isFeatured: true,
    reviews: [
      { id: 'r1', author: 'Jane D.', rating: 5, comment: 'The freshest carrots I have ever tasted!', date: '2023-10-15', status: 'approved' },
      { id: 'r2', author: 'Mark T.', rating: 4, comment: 'Great selection, a bit pricey but worth it.', date: '2023-10-12', status: 'approved' },
    ],
    attendingMarketIds: ['market-1', 'market-2'],
    originStory: 'Started from a small backyard garden, Green Thumb Organics has grown into a local leader in sustainable agriculture, all while maintaining our family-run roots and commitment to quality.',
    productHighlights: ['Rainbow Carrots', 'Heirloom Tomatoes', 'Spicy Arugula Mix'],
    sustainabilityPractices: 'We use no-till farming methods, compost all organic waste, and utilize drip irrigation to conserve water. Our packaging is 100% compostable.',
    certifications: ['Certified Organic', 'BC SPCA Certified'],
    joinDate: '2023-05-10',
    status: 'active',
  },
  {
    id: 'vendor-2',
    name: 'The Honest Loaf',
    logoUrl: 'https://picsum.photos/seed/logo-v2/200',
    description: 'Artisanal sourdough bread and pastries, baked fresh daily using locally sourced flour. Our long-fermentation process ensures maximum flavor and digestibility.',
    category: VendorCategories.BAKERY,
    tags: [VendorTags.HANDMADE, VendorTags.LOCAL_INGREDIENTS, VendorTags.VEGAN],
    photos: ['https://picsum.photos/seed/v2/600/400', 'https://picsum.photos/seed/v2a/600/400'],
    contact: { email: 'baker@honestloaf.com' },
    priceRange: 'affordable',
    reviews: [
      { id: 'r3', author: 'Sarah P.', rating: 5, comment: 'Best sourdough in the city, hands down.', date: '2023-10-14', status: 'approved' },
    ],
    attendingMarketIds: ['market-1'],
    productHighlights: ['Classic Country Sourdough', 'Chocolate Croissants', 'Seeded Rye Bread'],
    sustainabilityPractices: 'We source our flour from Vancouver Island grain growers and use renewable energy for our ovens.',
    joinDate: '2024-06-20',
    status: 'active',
  },
  {
    id: 'vendor-3',
    name: 'Hive & Honey Co.',
    description: 'Raw, unfiltered honey from our own local apiaries. We offer various honey types depending on the season, from light clover to rich buckwheat.',
    category: VendorCategories.PREPARED_FOODS,
    tags: [VendorTags.LOCAL_INGREDIENTS, VendorTags.SUSTAINABLE],
    photos: ['https://picsum.photos/seed/v3/600/400'],
    contact: { 
        email: 'buzz@hivehoney.com', 
        website: 'hivehoney.com',
    },
    priceRange: 'moderate',
    reviews: [],
    attendingMarketIds: ['market-2', 'market-3'],
    originStory: 'Our journey began with a single hive to help pollinate our garden. Today, we manage over 50 hives across the Saanich Peninsula, promoting bee health and delicious honey.',
    productHighlights: ['Wildflower Honey', 'Creamed Honey', 'Honeycomb Frames'],
    joinDate: '2024-07-01',
    status: 'active',
  },
  {
    id: 'vendor-4',
    name: 'Clay Creations',
    logoUrl: 'https://picsum.photos/seed/logo-v4/200',
    description: 'Handmade pottery, from functional mugs and bowls to decorative vases. Each piece is unique and crafted with love and attention to detail.',
    category: VendorCategories.POTTERY_GLASS,
    tags: [VendorTags.HANDMADE, VendorTags.ETHICAL, VendorTags.CERAMIC],
    photos: ['https://picsum.photos/seed/v4/600/400', 'https://picsum.photos/seed/v4a/600/400'],
    contact: { 
      email: 'clay@creations.com',
      socials: {
        pinterest: 'claycreations',
        etsy: 'claycreationsshop'
      }
    },
    priceRange: 'premium',
    reviews: [
       { id: 'r4', author: 'Chris G.', rating: 5, comment: 'Beautiful and functional art. I love my new new mug!', date: '2023-09-28', status: 'approved' },
    ],
    attendingMarketIds: ['market-1', 'market-3'],
    sustainabilityPractices: 'We reclaim and recycle all our clay scraps and use a kiln powered by renewable energy.',
    certifications: ['Island Crafted Certified'],
    joinDate: '2023-09-15',
    status: 'active',
  },
  {
    id: 'vendor-5',
    name: 'Silver & Stone',
    logoUrl: 'https://picsum.photos/seed/logo-v5/200',
    description: 'Handcrafted silver jewelry inspired by the natural beauty of the West Coast. Each piece incorporates unique stones sourced ethically.',
    category: VendorCategories.JEWELRY,
    tags: [VendorTags.HANDMADE, VendorTags.METAL, VendorTags.BEADWORK, VendorTags.ETHICAL],
    photos: ['https://picsum.photos/seed/v5/600/400'],
    contact: { email: 'contact@silverstone.com', socials: { etsy: 'silverstone' } },
    priceRange: 'premium',
    reviews: [],
    attendingMarketIds: ['market-3'],
    joinDate: '2024-08-01',
    status: 'active',
  },
  {
    id: 'vendor-6',
    name: 'The Retro Find',
    logoUrl: 'https://picsum.photos/seed/logo-v6/200',
    description: 'A curated collection of vintage clothing, retro housewares, and unique collectibles from the mid-20th century.',
    category: VendorCategories.VINTAGE_COLLECTIBLE,
    tags: [],
    photos: ['https://picsum.photos/seed/v6/600/400'],
    contact: { email: 'finder@retro.com' },
    priceRange: 'moderate',
    reviews: [],
    attendingMarketIds: ['market-3'],
    joinDate: '2024-08-05',
    status: 'active',
  },
];

export const markets: Market[] = [
  {
    id: 'market-1',
    ownerId: 'user-owner-market-1',
    name: 'City Center Farmers Market',
    logoUrl: 'https://picsum.photos/seed/logo-m1/200',
    description: 'The largest and oldest farmers market in the city, located in the heart of downtown. A vibrant gathering place for the community to connect with local farmers and artisans.',
    category: MarketCategories.FARMERS_MARKET,
    photos: ['https://picsum.photos/seed/m1/800/400', 'https://picsum.photos/seed/m1a/800/400'],
    contact: { 
        email: 'manager@citycentermarket.com', 
        website: 'citycentermarket.com',
        socials: { facebook: 'citycenterfarmersmarket', instagram: 'citycenterfarmers' }
    },
    location: {
      address: '123 Main St, Anytown, USA',
      coordinates: { lat: 34.0522, lng: -118.2437 },
    },
    schedule: {
      rules: [{ dayOfWeek: DayOfWeek.SATURDAY, startTime: '08:00', endTime: '13:00' }],
      notes: 'Year-round',
    },
    vendorIds: ['vendor-1', 'vendor-2', 'vendor-4'],
    reviews: [
      { id: 'mr1', author: 'Sarah P.', rating: 5, comment: 'My favorite Saturday morning spot!', date: '2023-10-21', status: 'approved' },
      { id: 'mr2', author: 'Tom H.', rating: 4, comment: 'Great variety of vendors and a wonderful atmosphere.', date: '2023-10-21', status: 'approved' },
    ],
    amenities: [MarketAmenities.PUBLIC_RESTROOMS, MarketAmenities.PET_FRIENDLY, MarketAmenities.LIVE_MUSIC, MarketAmenities.FREE_PARKING],
    paymentOptions: [PaymentOptions.CASH, PaymentOptions.CREDIT_DEBIT, PaymentOptions.E_TRANSFER],
    accessibility: 'Fully wheelchair accessible with paved pathways.',
    seasonalInfo: 'Look for the annual Harvest Festival in October with pumpkin carving and cider pressing.',
    joinDate: '2023-01-20',
    applicationFormQuestions: ['What are your power requirements?', 'Please provide a photo of your stall setup.'],
    allowedVendorCategories: [
      VendorCategories.PRODUCE,
      VendorCategories.BAKERY,
      VendorCategories.DAIRY_CHEESE,
      VendorCategories.MEAT_SEAFOOD,
      VendorCategories.PREPARED_FOODS,
      VendorCategories.BEVERAGES,
      VendorCategories.PLANTS_FLOWERS,
    ],
    status: 'active',
  },
  {
    id: 'market-2',
    name: 'Willow Creek Community Market',
    description: 'A cozy and friendly market in the beautiful Willow Creek park. Perfect for a family outing. Features live music and a kids\' corner.',
    category: MarketCategories.FARMERS_MARKET,
    photos: ['https://picsum.photos/seed/m2/800/400'],
    contact: { email: 'willowcreek@market.org' },
    location: {
      address: '456 Park Ave, Anytown, USA',
      coordinates: { lat: 34.0600, lng: -118.2500 },
    },
    schedule: {
      rules: [{ dayOfWeek: DayOfWeek.SUNDAY, startTime: '10:00', endTime: '14:00' }],
      notes: 'May to October',
    },
    vendorIds: ['vendor-1', 'vendor-3'],
    isFeatured: true,
    reviews: [
      { id: 'mr3', author: 'Emily R.', rating: 5, comment: 'Smaller but has amazing vendors. Love the park setting.', date: '2023-10-22', status: 'approved' },
    ],
    amenities: [MarketAmenities.KIDS_PLAYGROUND, MarketAmenities.PICNIC_AREA, MarketAmenities.STREET_PARKING],
    paymentOptions: [PaymentOptions.CASH_RECOMMENDED],
    accessibility: 'Accessible on paved park paths, some vendors are on grass.',
    joinDate: '2023-04-15',
    applicationFormQuestions: ['Do you require a tent space?'],
    // No allowedVendorCategories means all are accepted
    status: 'active',
  },
  {
    id: 'market-3',
    name: 'Oakwood Artisan Fair',
    logoUrl: 'https://picsum.photos/seed/logo-m3/200',
    description: 'A curated market focusing on high-quality, handmade crafts, art, and gourmet foods. Discover unique gifts and treats from talented local makers.',
    category: MarketCategories.ARTISAN_FAIR,
    photos: ['https://picsum.photos/seed/m3/800/400', 'https://picsum.photos/seed/m3a/800/400'],
    contact: { 
      email: 'manager@oakwoodfair.com', 
      website: 'oakwoodfair.com',
      socials: {
        pinterest: 'oakwoodartisanfair'
      }
    },
    location: {
      address: '789 Oak St, Anytown, USA',
      coordinates: { lat: 34.0450, lng: -118.2300 },
    },
    schedule: {
      rules: [{ dayOfWeek: DayOfWeek.SATURDAY, startTime: '11:00', endTime: '16:00' }],
      notes: 'First Saturday of the month',
    },
    vendorIds: ['vendor-3', 'vendor-4', 'vendor-5', 'vendor-6'],
    reviews: [],
    amenities: [MarketAmenities.INDOOR_VENUE, MarketAmenities.PUBLIC_RESTROOMS],
    paymentOptions: [PaymentOptions.CREDIT_DEBIT, PaymentOptions.CASH],
    accessibility: 'Fully wheelchair accessible.',
    seasonalInfo: 'Features a special Holiday edition in December with festive crafts and mulled wine.',
    joinDate: '2024-07-12',
    applicationFormQuestions: ['Please link to your online portfolio or social media.'],
    allowedVendorCategories: [
      VendorCategories.APPAREL_TEXTILES,
      VendorCategories.ART_DECOR,
      VendorCategories.BODY_CARE,
      VendorCategories.JEWELRY,
      VendorCategories.KIDS_TOYS,
      VendorCategories.PAPER_GOODS,
      VendorCategories.PET_SUPPLIES,
      VendorCategories.POTTERY_GLASS,
      VendorCategories.WOOD_LEATHER_METAL,
      VendorCategories.SPECIALTY_CRAFTS,
      VendorCategories.VINTAGE_COLLECTIBLE,
    ],
    status: 'active',
  },
];

export const applications: Application[] = [
    {
        id: 'app-1',
        vendorId: 'vendor-2', // The Honest Loaf
        marketId: 'market-3', // Oakwood Artisan Fair
        date: '2024-08-10',
        status: 'pending',
        customResponses: [
            { question: 'Please link to your online portfolio or social media.', answer: 'instagram.com/honestloaf' }
        ]
    }
];