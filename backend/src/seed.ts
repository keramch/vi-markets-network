/**
 * Seed script — writes mock data to Firestore.
 *
 * Safe to run multiple times: each document is written with set({ merge: true })
 * using the same ID as in the mock data, so re-running will upsert rather than
 * duplicate.
 *
 * Usage:
 *   npm run seed
 */

import { db, auth } from "./firebase";

// ---------------------------------------------------------------------------
// Mock data (values are the resolved strings from frontend/types.ts constants)
// ---------------------------------------------------------------------------

const users = [
  {
    id: "user-owner-market-1",
    email: "manager@citycentermarket.com",
    emailLower: "manager@citycentermarket.com",
    postalCode: "V9R 1A1",
    membership: "market-pro-annual",
    ownedMarketId: "market-1",
    autoRenew: true,
    isFoundingMember: false,
  },
  {
    id: "user-owner-vendor-1",
    email: "contact@greenthumb.com",
    emailLower: "contact@greenthumb.com",
    postalCode: "V9S 1B1",
    membership: "vendor-pro-annual",
    ownedVendorId: "vendor-1",
    autoRenew: false,
    isFoundingMember: false,
  },
  {
    id: "user-admin-1",
    email: "admin@vimarkets.com",
    emailLower: "admin@vimarkets.com",
    postalCode: "V9T 1C1",
    membership: "free",
    isAdmin: true,
    autoRenew: false,
    isFoundingMember: false,
  },
];

const vendors = [
  {
    id: "vendor-1",
    ownerId: "user-owner-vendor-1",
    name: "Green Thumb Organics",
    logoUrl: "https://picsum.photos/seed/logo-v1/200",
    description:
      "Certified organic vegetables, herbs, and seasonal fruits. We believe in sustainable farming practices that nurture the soil and produce the healthiest food for your family.",
    category: "Produce",
    tags: ["Organic", "Sustainable", "Family Farm", "Local Ingredients"],
    photos: [
      "https://picsum.photos/seed/v1/600/400",
      "https://picsum.photos/seed/v1a/600/400",
    ],
    contact: {
      email: "contact@greenthumb.com",
      website: "greenthumb.com",
      socials: { instagram: "greenthumb", facebook: "greenthumborganics" },
    },
    priceRange: "moderate",
    isFeatured: true,
    reviews: [
      {
        id: "r1",
        author: "Jane D.",
        rating: 5,
        comment: "The freshest carrots I have ever tasted!",
        date: "2023-10-15",
        status: "approved",
      },
      {
        id: "r2",
        author: "Mark T.",
        rating: 4,
        comment: "Great selection, a bit pricey but worth it.",
        date: "2023-10-12",
        status: "approved",
      },
    ],
    attendingMarketIds: ["market-1", "market-2"],
    originStory:
      "Started from a small backyard garden, Green Thumb Organics has grown into a local leader in sustainable agriculture, all while maintaining our family-run roots and commitment to quality.",
    productHighlights: ["Rainbow Carrots", "Heirloom Tomatoes", "Spicy Arugula Mix"],
    sustainabilityPractices:
      "We use no-till farming methods, compost all organic waste, and utilize drip irrigation to conserve water. Our packaging is 100% compostable.",
    certifications: ["Certified Organic", "BC SPCA Certified"],
    joinDate: "2023-05-10",
    status: "active",
  },
  {
    id: "vendor-2",
    name: "The Honest Loaf",
    logoUrl: "https://picsum.photos/seed/logo-v2/200",
    description:
      "Artisanal sourdough bread and pastries, baked fresh daily using locally sourced flour. Our long-fermentation process ensures maximum flavor and digestibility.",
    category: "Bakery",
    tags: ["Handmade", "Local Ingredients", "Vegan"],
    photos: [
      "https://picsum.photos/seed/v2/600/400",
      "https://picsum.photos/seed/v2a/600/400",
    ],
    contact: { email: "baker@honestloaf.com" },
    priceRange: "affordable",
    reviews: [
      {
        id: "r3",
        author: "Sarah P.",
        rating: 5,
        comment: "Best sourdough in the city, hands down.",
        date: "2023-10-14",
        status: "approved",
      },
    ],
    attendingMarketIds: ["market-1"],
    productHighlights: ["Classic Country Sourdough", "Chocolate Croissants", "Seeded Rye Bread"],
    sustainabilityPractices:
      "We source our flour from Vancouver Island grain growers and use renewable energy for our ovens.",
    joinDate: "2024-06-20",
    status: "active",
  },
  {
    id: "vendor-3",
    name: "Hive & Honey Co.",
    description:
      "Raw, unfiltered honey from our own local apiaries. We offer various honey types depending on the season, from light clover to rich buckwheat.",
    category: "Prepared Foods",
    tags: ["Local Ingredients", "Sustainable"],
    photos: ["https://picsum.photos/seed/v3/600/400"],
    contact: { email: "buzz@hivehoney.com", website: "hivehoney.com" },
    priceRange: "moderate",
    reviews: [],
    attendingMarketIds: ["market-2", "market-3"],
    originStory:
      "Our journey began with a single hive to help pollinate our garden. Today, we manage over 50 hives across the Saanich Peninsula, promoting bee health and delicious honey.",
    productHighlights: ["Wildflower Honey", "Creamed Honey", "Honeycomb Frames"],
    joinDate: "2024-07-01",
    status: "active",
  },
  {
    id: "vendor-4",
    name: "Clay Creations",
    logoUrl: "https://picsum.photos/seed/logo-v4/200",
    description:
      "Handmade pottery, from functional mugs and bowls to decorative vases. Each piece is unique and crafted with love and attention to detail.",
    category: "Pottery & Glass",
    tags: ["Handmade", "Ethical", "Ceramic"],
    photos: [
      "https://picsum.photos/seed/v4/600/400",
      "https://picsum.photos/seed/v4a/600/400",
    ],
    contact: {
      email: "clay@creations.com",
      socials: { pinterest: "claycreations", etsy: "claycreationsshop" },
    },
    priceRange: "premium",
    reviews: [
      {
        id: "r4",
        author: "Chris G.",
        rating: 5,
        comment: "Beautiful and functional art. I love my new new mug!",
        date: "2023-09-28",
        status: "approved",
      },
    ],
    attendingMarketIds: ["market-1", "market-3"],
    sustainabilityPractices:
      "We reclaim and recycle all our clay scraps and use a kiln powered by renewable energy.",
    certifications: ["Island Crafted Certified"],
    joinDate: "2023-09-15",
    status: "active",
  },
  {
    id: "vendor-5",
    name: "Silver & Stone",
    logoUrl: "https://picsum.photos/seed/logo-v5/200",
    description:
      "Handcrafted silver jewelry inspired by the natural beauty of the West Coast. Each piece incorporates unique stones sourced ethically.",
    category: "Jewelry",
    tags: ["Handmade", "Metal", "Beadwork", "Ethical"],
    photos: ["https://picsum.photos/seed/v5/600/400"],
    contact: { email: "contact@silverstone.com", socials: { etsy: "silverstone" } },
    priceRange: "premium",
    reviews: [],
    attendingMarketIds: ["market-3"],
    joinDate: "2024-08-01",
    status: "active",
  },
  {
    id: "vendor-6",
    name: "The Retro Find",
    logoUrl: "https://picsum.photos/seed/logo-v6/200",
    description:
      "A curated collection of vintage clothing, retro housewares, and unique collectibles from the mid-20th century.",
    category: "Vintage & Collectible",
    tags: [],
    photos: ["https://picsum.photos/seed/v6/600/400"],
    contact: { email: "finder@retro.com" },
    priceRange: "moderate",
    reviews: [],
    attendingMarketIds: ["market-3"],
    joinDate: "2024-08-05",
    status: "active",
  },
];

const markets = [
  {
    id: "market-1",
    ownerId: "user-owner-market-1",
    name: "City Center Farmers Market",
    logoUrl: "https://picsum.photos/seed/logo-m1/200",
    description:
      "The largest and oldest farmers market in the city, located in the heart of downtown. A vibrant gathering place for the community to connect with local farmers and artisans.",
    category: "Farmers Market",
    photos: [
      "https://picsum.photos/seed/m1/800/400",
      "https://picsum.photos/seed/m1a/800/400",
    ],
    contact: {
      email: "manager@citycentermarket.com",
      website: "citycentermarket.com",
      socials: { facebook: "citycenterfarmersmarket", instagram: "citycenterfarmers" },
    },
    location: {
      address: "123 Main St, Anytown, USA",
      coordinates: { lat: 34.0522, lng: -118.2437 },
    },
    schedule: {
      rules: [{ dayOfWeek: "Saturday", startTime: "08:00", endTime: "13:00" }],
      notes: "Year-round",
    },
    vendorIds: ["vendor-1", "vendor-2", "vendor-4"],
    reviews: [
      {
        id: "mr1",
        author: "Sarah P.",
        rating: 5,
        comment: "My favorite Saturday morning spot!",
        date: "2023-10-21",
        status: "approved",
      },
      {
        id: "mr2",
        author: "Tom H.",
        rating: 4,
        comment: "Great variety of vendors and a wonderful atmosphere.",
        date: "2023-10-21",
        status: "approved",
      },
    ],
    amenities: ["Public Restrooms", "Pet-friendly", "Live Music", "Free Parking"],
    paymentOptions: ["Cash", "Credit/Debit", "E-Transfer"],
    accessibility: "Fully wheelchair accessible with paved pathways.",
    seasonalInfo:
      "Look for the annual Harvest Festival in October with pumpkin carving and cider pressing.",
    joinDate: "2023-01-20",
    applicationFormQuestions: [
      "What are your power requirements?",
      "Please provide a photo of your stall setup.",
    ],
    allowedVendorCategories: [
      "Produce",
      "Bakery",
      "Dairy & Cheese",
      "Meat & Seafood",
      "Prepared Foods",
      "Beverages",
      "Plants & Flowers",
    ],
    status: "active",
  },
  {
    id: "market-2",
    name: "Willow Creek Community Market",
    description:
      "A cozy and friendly market in the beautiful Willow Creek park. Perfect for a family outing. Features live music and a kids' corner.",
    category: "Farmers Market",
    photos: ["https://picsum.photos/seed/m2/800/400"],
    contact: { email: "willowcreek@market.org" },
    location: {
      address: "456 Park Ave, Anytown, USA",
      coordinates: { lat: 34.06, lng: -118.25 },
    },
    schedule: {
      rules: [{ dayOfWeek: "Sunday", startTime: "10:00", endTime: "14:00" }],
      notes: "May to October",
    },
    vendorIds: ["vendor-1", "vendor-3"],
    isFeatured: true,
    reviews: [
      {
        id: "mr3",
        author: "Emily R.",
        rating: 5,
        comment: "Smaller but has amazing vendors. Love the park setting.",
        date: "2023-10-22",
        status: "approved",
      },
    ],
    amenities: ["Kids' Playground", "Picnic Area", "Street Parking"],
    paymentOptions: ["Cash Recommended"],
    accessibility: "Accessible on paved park paths, some vendors are on grass.",
    joinDate: "2023-04-15",
    applicationFormQuestions: ["Do you require a tent space?"],
    status: "active",
  },
  {
    id: "market-3",
    name: "Oakwood Artisan Fair",
    logoUrl: "https://picsum.photos/seed/logo-m3/200",
    description:
      "A curated market focusing on high-quality, handmade crafts, art, and gourmet foods. Discover unique gifts and treats from talented local makers.",
    category: "Artisan Fair",
    photos: [
      "https://picsum.photos/seed/m3/800/400",
      "https://picsum.photos/seed/m3a/800/400",
    ],
    contact: {
      email: "manager@oakwoodfair.com",
      website: "oakwoodfair.com",
      socials: { pinterest: "oakwoodartisanfair" },
    },
    location: {
      address: "789 Oak St, Anytown, USA",
      coordinates: { lat: 34.045, lng: -118.23 },
    },
    schedule: {
      rules: [{ dayOfWeek: "Saturday", startTime: "11:00", endTime: "16:00" }],
      notes: "First Saturday of the month",
    },
    vendorIds: ["vendor-3", "vendor-4", "vendor-5", "vendor-6"],
    reviews: [],
    amenities: ["Indoor Venue", "Public Restrooms"],
    paymentOptions: ["Credit/Debit", "Cash"],
    accessibility: "Fully wheelchair accessible.",
    seasonalInfo:
      "Features a special Holiday edition in December with festive crafts and mulled wine.",
    joinDate: "2024-07-12",
    applicationFormQuestions: [
      "Please link to your online portfolio or social media.",
    ],
    allowedVendorCategories: [
      "Apparel & Textiles",
      "Art & Decor",
      "Body Care",
      "Jewelry",
      "Kids & Toys",
      "Paper Goods",
      "Pet Supplies",
      "Pottery & Glass",
      "Wood, Leather & Metal",
      "Specialty Crafts",
      "Vintage & Collectible",
    ],
    status: "active",
  },
];

const applications = [
  {
    id: "app-1",
    vendorId: "vendor-2",
    marketId: "market-3",
    date: "2024-08-10",
    status: "pending",
    customResponses: [
      {
        question: "Please link to your online portfolio or social media.",
        answer: "instagram.com/honestloaf",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Auth seed helpers
// ---------------------------------------------------------------------------

const TEST_PASSWORD = "Test1234!";

const authUsers = [
  { email: "admin@vimarkets.com",              displayName: "VI Markets Admin" },
  { email: "manager@citycentermarket.com",     displayName: "Market Manager" },
  { email: "contact@greenthumb.com",           displayName: "Green Thumb Organics" },
];

async function seedAuthUsers(): Promise<void> {
  for (const user of authUsers) {
    try {
      // Check if the Auth user already exists
      await auth.getUserByEmail(user.email);
      console.log(`  ↩ auth: ${user.email} already exists — skipped`);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        await auth.createUser({
          email: user.email,
          password: TEST_PASSWORD,
          displayName: user.displayName,
        });
        console.log(`  ✓ auth: ${user.email} created`);
      } else {
        throw err;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

type SeedRecord = { id: string; [key: string]: unknown };

async function seedCollection(
  collectionName: string,
  records: SeedRecord[]
): Promise<void> {
  const batch = db.batch();

  for (const record of records) {
    const { id, ...data } = record;
    const ref = db.collection(collectionName).doc(id);
    batch.set(ref, data, { merge: true });
  }

  await batch.commit();
  console.log(`  ✓ ${collectionName}: ${records.length} document(s) seeded`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("🌱 Seeding Firestore...\n");

  await seedCollection("users", users);
  await seedCollection("vendors", vendors);
  await seedCollection("markets", markets);
  await seedCollection("applications", applications);

  console.log("\n🔐 Seeding Firebase Auth accounts...\n");
  await seedAuthUsers();

  console.log("\n✅ Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
