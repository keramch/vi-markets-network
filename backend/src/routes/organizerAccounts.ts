import { Router } from "express";
import { db } from "../firebase";
import { TIER_MAX_LISTINGS, SubscriptionTier } from "../types/models";

const router = Router();

// GET /organizer-accounts/:uid → get an organizer account by uid
router.get("/:uid", async (req, res) => {
  const { uid } = req.params;
  try {
    const doc = await db.collection("organizerAccounts").doc(uid).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Organizer account not found" });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error fetching organizer account:", err);
    return res.status(500).json({ error: "Failed to fetch organizer account" });
  }
});

// POST /organizer-accounts → create or upsert an organizer account
// body: { uid, orgName, contactEmail, tier, billingCycle }
router.post("/", async (req, res) => {
  const { uid, orgName, contactEmail, tier = "free", billingCycle = "annual" } = req.body as {
    uid: string;
    orgName: string;
    contactEmail: string;
    tier?: SubscriptionTier;
    billingCycle?: "monthly" | "annual";
  };

  if (!uid || !orgName || !contactEmail) {
    return res.status(400).json({ error: "uid, orgName, and contactEmail are required" });
  }

  const now = new Date().toISOString();
  const maxActiveListings = TIER_MAX_LISTINGS[tier] ?? 1;

  const data = {
    uid,
    orgName,
    contactEmail,
    subscription: {
      tier,
      billingCycle,
      foundingMember: false,
      activeListingCount: 0,
      maxActiveListings,
    },
    marketPageIds: [],
    updatedAt: now,
  };

  try {
    const docRef = db.collection("organizerAccounts").doc(uid);
    const existing = await docRef.get();
    if (existing.exists) {
      // Merge updates but preserve createdAt and marketPageIds
      await docRef.set({ ...data, createdAt: existing.data()?.createdAt ?? now }, { merge: true });
    } else {
      await docRef.set({ ...data, createdAt: now });
    }
    const updated = await docRef.get();
    return res.status(existing.exists ? 200 : 201).json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error creating organizer account:", err);
    return res.status(500).json({ error: "Failed to create organizer account" });
  }
});

// PATCH /organizer-accounts/:uid → update organizer account fields
router.patch("/:uid", async (req, res) => {
  const { uid } = req.params;
  const updates = req.body as Record<string, unknown>;

  try {
    const docRef = db.collection("organizerAccounts").doc(uid);
    await docRef.set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating organizer account:", err);
    return res.status(500).json({ error: "Failed to update organizer account" });
  }
});

export default router;
