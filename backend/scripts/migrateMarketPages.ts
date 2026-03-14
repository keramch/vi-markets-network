/**
 * backend/scripts/migrateMarketPages.ts
 *
 * One-time migration script for Phase 2A.
 *
 * What it does (idempotent — safe to run multiple times):
 *  1. For every document in the `markets` collection:
 *     - Sets `organizerUid` to the uid of the user whose `ownedMarketId` matches
 *     - Sets `coManagerUids: []` if the field is missing
 *     - Sets `updatedAt` to the current timestamp
 *  2. For every organizer user found:
 *     - Creates (or merges) a doc in `organizerAccounts` with the user's info
 *
 * Run from the `backend` directory:
 *   npx ts-node scripts/migrateMarketPages.ts
 *
 * Or add to package.json scripts:
 *   "migrate": "ts-node scripts/migrateMarketPages.ts"
 * and run:
 *   npm run migrate
 */

import { db } from "../src/firebase";
import { TIER_MAX_LISTINGS, SubscriptionTier } from "../src/types/models";

// Shape of a user document as stored in Firestore.
// Only the fields this script actually reads need to be declared here.
interface FirestoreUserDoc {
  email?: string;
  membership?: string;
  ownedMarketId?: string;
  isFoundingMember?: boolean;
}

// Maps legacy MembershipPlan strings to the new SubscriptionTier buckets.
// Used to initialise the OrganizerAccount subscription tier from existing user data.
function membershipToTier(membership: string): SubscriptionTier {
  if (membership.includes("pro")) return "pro";
  if (membership === "free") return "free";
  return "standard";
}

async function main() {
  console.log("=== VI Markets — Phase 2A Migration ===\n");

  // ── 1. Load all users ────────────────────────────────────────────────────
  const usersSnap = await db.collection("users").get();
  const users = usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as FirestoreUserDoc) }));

  // Build a lookup: marketId → user doc
  const marketOwnerMap: Record<string, typeof users[0]> = {};
  for (const user of users) {
    if (user.ownedMarketId) {
      marketOwnerMap[user.ownedMarketId] = user;
    }
  }

  console.log(`Found ${users.length} users, ${Object.keys(marketOwnerMap).length} with ownedMarketId.\n`);

  // ── 2. Migrate market documents ──────────────────────────────────────────
  const marketsSnap = await db.collection("markets").get();
  console.log(`Processing ${marketsSnap.docs.length} market documents...`);

  let marketsUpdated = 0;
  let marketsSkipped = 0;

  for (const marketDoc of marketsSnap.docs) {
    const data = marketDoc.data();
    const owner = marketOwnerMap[marketDoc.id];

    const updates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Set organizerUid if not already set
    if (!data.organizerUid) {
      if (owner) {
        updates.organizerUid = owner.id;
      } else {
        console.warn(`  ⚠  Market ${marketDoc.id} (${data.name}) has no matching owner user — skipping organizerUid`);
      }
    }

    // Set coManagerUids if not already set
    if (!Array.isArray(data.coManagerUids)) {
      updates.coManagerUids = [];
    }

    const hasChanges = Object.keys(updates).length > 1 || !data.organizerUid || !Array.isArray(data.coManagerUids);
    if (hasChanges) {
      await marketDoc.ref.set(updates, { merge: true });
      console.log(`  ✓ Updated market: ${data.name ?? marketDoc.id}`);
      marketsUpdated++;
    } else {
      marketsSkipped++;
    }
  }

  console.log(`\nMarkets: ${marketsUpdated} updated, ${marketsSkipped} already up-to-date.\n`);

  // ── 3. Create / update organizerAccounts for each organizer user ─────────
  console.log("Processing organizerAccounts...");

  let accountsCreated = 0;
  let accountsMerged = 0;

  for (const user of users) {
    // Only create organizer accounts for users who own a market
    if (!user.ownedMarketId) continue;
    const ownedMarketId = user.ownedMarketId;

    const uid = user.id;
    const email = user.email ?? "";
    const membership = user.membership ?? "free";
    const tier = membershipToTier(membership);
    const maxActiveListings = TIER_MAX_LISTINGS[tier];

    const accountRef = db.collection("organizerAccounts").doc(uid);
    const existingAccount = await accountRef.get();

    const now = new Date().toISOString();

    if (existingAccount.exists) {
      // Merge: add this market to marketPageIds if not already there
      const existingData = existingAccount.data() as Record<string, unknown>;
      const existingIds = (existingData.marketPageIds as string[]) ?? [];
      if (!existingIds.includes(ownedMarketId)) {
        await accountRef.set(
          { marketPageIds: [...existingIds, ownedMarketId], updatedAt: now },
          { merge: true }
        );
        console.log(`  ~ Merged organizerAccount for ${email} — added market ${ownedMarketId}`);
      } else {
        console.log(`  · organizerAccount for ${email} already up-to-date`);
      }
      accountsMerged++;
    } else {
      // Create a new organizer account
      const accountData = {
        uid,
        orgName: email.split("@")[0], // Placeholder; organizer can update later
        contactEmail: email,
        subscription: {
          tier,
          billingCycle: "annual" as const,
          foundingMember: user.isFoundingMember ?? false,
          activeListingCount: 1,          // they already have one market
          maxActiveListings,
        },
        marketPageIds: [ownedMarketId],
        createdAt: now,
        updatedAt: now,
      };

      await accountRef.set(accountData);
      console.log(`  ✓ Created organizerAccount for ${email}`);
      accountsCreated++;
    }
  }

  console.log(`\nOrganizerAccounts: ${accountsCreated} created, ${accountsMerged} merged.\n`);
  console.log("=== Migration complete ===");
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
