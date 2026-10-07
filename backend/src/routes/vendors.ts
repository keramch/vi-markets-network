import { Router } from "express";
import { db } from "../firebase";
import { getFoundingMemberUids } from "../utils/foundingMembers";
import { getApprovedReviewsByEntity } from "../utils/reviews";
import { requireAuth, isAdminUser } from "../middleware/auth";
import { ownsListing, sanitizeListingUpdate } from "../utils/listingAccess";

const router = Router();

// GET /vendors → return all vendors
router.get("/", async (_req, res) => {
  try {
    const [snapshot, foundingUids, reviewsByEntity] = await Promise.all([
      db.collection("vendors").get(),
      getFoundingMemberUids(),
      getApprovedReviewsByEntity(),
    ]);
    const vendors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      ownerFoundingMember: foundingUids.has(doc.data().ownerId),
      // Approved reviews from the reviews collection (computed, never stored)
      reviews: reviewsByEntity.get(doc.id) ?? [],
    }));
    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// PATCH /vendors/:id → update vendor
// Owner or admin only. Non-admins can't change ownerId, status, isFeatured, etc.
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Never create a record by editing one that doesn't exist
    if (!(await db.collection("vendors").doc(id).get()).exists) {
      return res.status(404).json({ error: "Not found" });
    }
    const callerIsAdmin = await isAdminUser(req.user!.uid);
    if (!callerIsAdmin && !(await ownsListing(req.user!.uid, "vendors", id))) {
      return res.status(403).json({ error: "You can only edit your own vendor profile." });
    }
    const updates = sanitizeListingUpdate((req.body ?? {}) as Record<string, unknown>, callerIsAdmin) as Record<string, any>;

    const docRef = db.collection("vendors").doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();

    // ── Users collection sync (non-fatal) ────────────────────────────────────
    // When vendor.name is updated, also update users.businessName to keep in sync
    if (updates.name) {
      try {
        const userSnap = await db.collection('users')
          .where('ownedVendorId', '==', id)
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
      if (brevoApiKey && updates.vendorTypes && Array.isArray(updates.vendorTypes)) {
        const ownerSnap = await db.collection('users')
          .where('ownedVendorId', '==', id)
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
                  VENDOR_TYPES: updates.vendorTypes.join('|'),
                },
              }),
            });
          }
        }
      }
    } catch (brevoErr) {
      console.error('Brevo vendor type sync failed (non-fatal):', brevoErr);
    }
    // ── End Brevo sync ────────────────────────────────────────────────────────

    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating vendor:", err);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

export default router;
