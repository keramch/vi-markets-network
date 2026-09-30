import { db } from "../firebase";

// ── Ownership checks for markets, vendors and their events ────────────────────

export type ListingCollection = "markets" | "vendors";

// True if `uid` owns the market/vendor doc (its ownerId field)
export async function ownsListing(uid: string, collection: ListingCollection, id: string): Promise<boolean> {
  if (!id) return false;
  const doc = await db.collection(collection).doc(id).get();
  return doc.exists && doc.data()?.ownerId === uid;
}

// Never stored — computed on read (id is the doc ID, ownerFoundingMember is
// added by GET /markets and GET /vendors)
const COMPUTED_LISTING_FIELDS = ["id", "ownerFoundingMember"];

// Only admins (or trusted server code like the Stripe webhook) may set these.
// The profile editor sends the whole listing back on save, so for non-admins
// these are silently dropped rather than rejected.
const ADMIN_ONLY_LISTING_FIELDS = [
  "ownerId",
  "status",
  "isFeatured",
  "featuredUntil",
  "impressionCount",
  "joinDate",
  "slug",
  "reviews",
];

export function sanitizeListingUpdate(
  updates: Record<string, unknown>,
  callerIsAdmin: boolean,
): Record<string, unknown> {
  const clean = { ...updates };
  for (const key of COMPUTED_LISTING_FIELDS) delete clean[key];
  if (!callerIsAdmin) {
    for (const key of ADMIN_ONLY_LISTING_FIELDS) delete clean[key];
  }
  return clean;
}
