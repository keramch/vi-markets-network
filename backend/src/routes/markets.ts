import { Router } from "express";
import { db } from "../firebase";
import { getFoundingMemberUids } from "../utils/foundingMembers";
import { getApprovedReviewsByEntity } from "../utils/reviews";
import { requireAuth, isAdminUser } from "../middleware/auth";
import { ownsListing, sanitizeListingUpdate } from "../utils/listingAccess";
import { checkListingUrls } from "../utils/urlSafety";
import { slugify } from "../utils/slug";

const router = Router();

// A readable link part for a market, unique among markets (base, base-2, ...)
async function uniqueMarketSlug(name: string, ownId?: string): Promise<string> {
  const base = slugify(name) || "market";
  let candidate = base;
  for (let n = 2; ; n++) {
    const snap = await db.collection("markets").where("slug", "==", candidate).limit(2).get();
    if (snap.docs.every(d => d.id === ownId)) return candidate;
    candidate = `${base}-${n}`;
  }
}

// GET /markets → returns all markets from Firestore
router.get("/", async (_req, res) => {
  try {
    const [snapshot, foundingUids, reviewsByEntity] = await Promise.all([
      db.collection("markets").get(),
      getFoundingMemberUids(),
      getApprovedReviewsByEntity(),
    ]);
    const markets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      ownerFoundingMember: foundingUids.has(doc.data().ownerId),
      // Approved reviews from the reviews collection (computed, never stored)
      reviews: reviewsByEntity.get(doc.id) ?? [],
    }));
    res.json(markets);
  } catch (err) {
    console.error("Error fetching markets:", err);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
});

// POST /markets → create an unclaimed market record.
// A vendor adding a market to their own profile (vendorId = their vendor
// profile), or an admin adding one directly from HQ (no vendorId needed, T105).
// Every new market gets a slug, so it can have a public page (T020).
router.post("/", requireAuth, async (req, res) => {
  const { name, vendorId, city, address, marketTypes } = req.body ?? {};
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const cleanName = text(name, 120);
  if (!cleanName) {
    return res.status(400).json({ error: "Please give the market a name." });
  }

  const callerIsAdmin = await isAdminUser(req.user!.uid);
  if (vendorId !== undefined && vendorId !== null && vendorId !== "") {
    if (typeof vendorId !== "string") {
      return res.status(400).json({ error: "vendorId must be text" });
    }
    if (!callerIsAdmin && !(await ownsListing(req.user!.uid, "vendors", vendorId))) {
      return res.status(403).json({ error: "You can only add markets to your own vendor profile." });
    }
  } else if (!callerIsAdmin) {
    return res.status(400).json({ error: "name and vendorId are required" });
  }

  // Market types only from admins (vendors add a name, town and address)
  const types = callerIsAdmin && Array.isArray(marketTypes)
    ? marketTypes.filter((t: unknown): t is string => typeof t === "string" && t.length <= 60).slice(0, 12)
    : [];

  try {
    const data = {
      name: cleanName,
      slug: await uniqueMarketSlug(cleanName),
      description: '',
      marketTypes: types,
      photos: [],
      contact: { email: '' },
      location: {
        address: text(address, 200),
        city: text(city, 80),
        coordinates: { lat: 0, lng: 0 },
      },
      schedule: { rules: [] },
      vendorIds: vendorId ? [vendorId] : [],
      reviews: [],
      joinDate: new Date().toISOString(),
      status: 'unclaimed',
    };
    const docRef = await db.collection("markets").add(data);
    res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error("Error creating market:", err);
    res.status(500).json({ error: "Failed to create market" });
  }
});

// PATCH /markets/:id → api.updateMarket(id, updates)
// Owner or admin only. Non-admins can't change ownerId, status, isFeatured, etc.
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Never create a record by editing one that doesn't exist
    if (!(await db.collection("markets").doc(id).get()).exists) {
      return res.status(404).json({ error: "Not found" });
    }
    const callerIsAdmin = await isAdminUser(req.user!.uid);
    if (!callerIsAdmin && !(await ownsListing(req.user!.uid, "markets", id))) {
      return res.status(403).json({ error: "You can only edit your own market." });
    }
    const updates = sanitizeListingUpdate((req.body ?? {}) as Record<string, unknown>, callerIsAdmin, "markets") as Record<string, any>;
    const urlProblem = checkListingUrls(updates);
    if (urlProblem) {
      return res.status(400).json({ error: urlProblem });
    }

    const docRef = db.collection("markets").doc(id);
    await docRef.set(updates, { merge: true });
    let updated = await docRef.get();
    // Older unclaimed markets have no slug: give them one on their next save (T105)
    if (!updated.data()?.slug && updated.data()?.name) {
      await docRef.update({ slug: await uniqueMarketSlug(String(updated.data()!.name), id) });
      updated = await docRef.get();
    }

    // ── Users collection sync (non-fatal) ────────────────────────────────────
    // When market.name is updated, also update users.businessName to keep in sync
    if (updates.name) {
      try {
        const userSnap = await db.collection('users')
          .where('ownedMarketId', '==', id)
          .limit(1)
          .get();
        if (!userSnap.empty) {
          await userSnap.docs[0].ref.update({ businessName: updates.name });
        }
      } catch (userSyncErr) {
        console.error('User businessName sync failed (non-fatal):', userSyncErr);
      }
    }
    // ── End Users sync ────────────────────────────────────────────────────────

    // ── Brevo type sync (non-fatal) ──────────────────────────────────────────
    try {
      const brevoApiKey = process.env.BREVO_API_KEY ?? '';
      if (brevoApiKey && updates.marketTypes && Array.isArray(updates.marketTypes)) {
        const ownerSnap = await db.collection('users')
          .where('ownedMarketId', '==', id)
          .limit(1)
          .get();
        if (!ownerSnap.empty) {
          const ownerEmail = ownerSnap.docs[0].data().email;
          if (ownerEmail) {
            await fetch('https://api.brevo.com/v3/contacts/' + encodeURIComponent(ownerEmail), {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'api-key': brevoApiKey,
              },
              body: JSON.stringify({
                attributes: {
                  MARKET_TYPES: updates.marketTypes.join('|'),
                },
              }),
            });
          }
        }
      }
    } catch (brevoErr) {
      console.error('Brevo market type sync failed (non-fatal):', brevoErr);
    }
    // ── End Brevo sync ────────────────────────────────────────────────────────

    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating market:", err);
    res.status(500).json({ error: "Failed to update market" });
  }
});

export default router;
