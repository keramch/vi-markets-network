import { db } from "../firebase";

// ── Ownership checks for organizers, vendors and their markets ────────────────

export type ListingCollection = "organizers" | "vendors";

// True if `uid` owns the organizer/vendor doc (its ownerId field)
export async function ownsListing(uid: string, collection: ListingCollection, id: string): Promise<boolean> {
  if (!id) return false;
  const doc = await db.collection(collection).doc(id).get();
  return doc.exists && doc.data()?.ownerId === uid;
}

// Never stored — computed on read (id is the doc ID; ownerFoundingMember and
// reviews are added by GET /organizers and GET /vendors from other collections)
const COMPUTED_LISTING_FIELDS = ["id", "ownerFoundingMember", "reviews"];

// The only fields an owner may change on their own listing (T101). Everything
// else is admin-only: ownership (ownerId, organizerUid, coManagerUids), status,
// Featured placement, joinDate, slug, an organizer's vendorIds, and any made-up
// field. The profile editor sends the whole listing back on save, so other
// fields are silently dropped rather than rejected.
// Taken from Organizer and Vendor in frontend/types.ts plus the fields live
// listings hold (category, categories and attendingMarketIds are legacy).
const SHARED_OWNER_FIELDS = [
  "name",
  "logoUrl",
  "headerPhotoUrl",
  "headerPhotoPosition",
  "description",
  "photos",
  "contact",
  "tags",
  "promotions",
  "updatedAt",
];
const OWNER_EDITABLE_FIELDS: Record<ListingCollection, Set<string>> = {
  organizers: new Set([
    ...SHARED_OWNER_FIELDS,
    "marketTypes",
    "location",
    "schedule",
    "amenities",
    "paymentOptions",
    "seasonalInfo",
    "accessibility",
    "applicationFormQuestions",
    "allowedVendorCategories",
    "externalEventUrl",
  ]),
  vendors: new Set([
    ...SHARED_OWNER_FIELDS,
    "vendorTypes",
    "category",
    "categories",
    "priceRange",
    "attendingMarkets",
    "attendingMarketIds",
    "productHighlights",
    "sustainabilityPractices",
    "certifications",
    "originStory",
    "city",
  ]),
};

export function sanitizeListingUpdate(
  updates: Record<string, unknown>,
  callerIsAdmin: boolean,
  collection: ListingCollection,
): Record<string, unknown> {
  const clean = { ...updates };
  for (const key of COMPUTED_LISTING_FIELDS) delete clean[key];
  if (!callerIsAdmin) {
    for (const key of Object.keys(clean)) {
      if (!OWNER_EDITABLE_FIELDS[collection].has(key)) delete clean[key];
    }
  }
  return clean;
}
