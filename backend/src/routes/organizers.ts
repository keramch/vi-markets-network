import { Router } from "express";
import { db } from "../firebase";
import { getFoundingMemberUids } from "../utils/foundingMembers";
import { getApprovedReviewsByEntity } from "../utils/reviews";
import { requireAuth, isAdminUser } from "../middleware/auth";
import { ownsListing, sanitizeListingUpdate } from "../utils/listingAccess";
import { checkListingUrls } from "../utils/urlSafety";
import { slugify } from "../utils/slug";

// Organizers (OD-16): the people or groups who put markets on, e.g. a farmers
// market society or an arts council. Until stage 1 (T128) these were stored as
// "markets"; the markets themselves are in routes/markets.ts.

const router = Router();

// A readable link part for an organizer, unique among organizers (base, base-2, ...)
async function uniqueOrganizerSlug(name: string, ownId?: string): Promise<string> {
  const base = slugify(name) || "organizer";
  let candidate = base;
  for (let n = 2; ; n++) {
    const snap = await db.collection("organizers").where("slug", "==", candidate).limit(2).get();
    if (snap.docs.every(d => d.id === ownId)) return candidate;
    candidate = `${base}-${n}`;
  }
}

// GET /organizers → every organizer. Hidden ones (archived, e.g. the admin
// page, T036) only for admins. An organizer whose page isn't public yet
// (pageHidden, T140) comes back to everyone else as just its id, so its
// markets still count as claimed but nothing about the member shows.
router.get("/", async (req, res) => {
  try {
    const [snapshot, foundingUids, reviewsByEntity, callerIsAdmin] = await Promise.all([
      db.collection("organizers").get(),
      getFoundingMemberUids(),
      getApprovedReviewsByEntity(),
      req.user ? isAdminUser(req.user.uid) : Promise.resolve(false),
    ]);
    const organizers = snapshot.docs
      .filter(doc => callerIsAdmin || doc.data().status !== "archived")
      .map(doc => (doc.data().pageHidden === true && !callerIsAdmin && doc.data().ownerId !== req.user?.uid
        ? { id: doc.id, pageHidden: true, status: doc.data().status }
        : {
            id: doc.id,
            ...doc.data(),
            ownerFoundingMember: foundingUids.has(doc.data().ownerId),
            // Approved reviews from the reviews collection (computed, never stored)
            reviews: reviewsByEntity.get(doc.id) ?? [],
          }));
    res.json(organizers);
  } catch (err) {
    console.error("Error fetching organizers:", err);
    res.status(500).json({ error: "Failed to fetch organizers" });
  }
});

// PATCH /organizers/:id → owner or admin only. Non-admins can't change
// ownerId, status, isFeatured, etc. (sanitizeListingUpdate).
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Never create a record by editing one that doesn't exist
    if (!(await db.collection("organizers").doc(id).get()).exists) {
      return res.status(404).json({ error: "Not found" });
    }
    const callerIsAdmin = await isAdminUser(req.user!.uid);
    if (!callerIsAdmin && !(await ownsListing(req.user!.uid, "organizers", id))) {
      return res.status(403).json({ error: "You can only edit your own organizer profile." });
    }
    const updates = sanitizeListingUpdate((req.body ?? {}) as Record<string, unknown>, callerIsAdmin, "organizers") as Record<string, any>;
    if ("pageHidden" in updates) {
      if (typeof updates.pageHidden !== "boolean") {
        return res.status(400).json({ error: "pageHidden must be true or false" });
      }
      // A page can only go public with a name (it makes the page's address)
      const name = "name" in updates ? String(updates.name ?? "").trim() : String((await db.collection("organizers").doc(id).get()).data()?.name ?? "").trim();
      if (updates.pageHidden === false && !name) {
        return res.status(400).json({ error: "Please give your organizer page a name before showing it." });
      }
    }
    const urlProblem = checkListingUrls(updates);
    if (urlProblem) {
      return res.status(400).json({ error: urlProblem });
    }

    const docRef = db.collection("organizers").doc(id);
    await docRef.set(updates, { merge: true });
    let updated = await docRef.get();
    if (!updated.data()?.slug && updated.data()?.name) {
      await docRef.update({ slug: await uniqueOrganizerSlug(String(updated.data()!.name), id) });
      updated = await docRef.get();
    }

    // ── Users collection sync (non-fatal) ────────────────────────────────────
    // When the name changes, keep users.businessName in step
    if (updates.name) {
      try {
        const userSnap = await db.collection('users')
          .where('ownedOrganizerId', '==', id)
          .limit(1)
          .get();
        if (!userSnap.empty) {
          await userSnap.docs[0].ref.update({ businessName: updates.name });
        }
      } catch (userSyncErr) {
        console.error('User businessName sync failed (non-fatal):', userSyncErr);
      }
    }

    // ── Brevo type sync (non-fatal) ──────────────────────────────────────────
    try {
      const brevoApiKey = process.env.BREVO_API_KEY ?? '';
      if (brevoApiKey && updates.marketTypes && Array.isArray(updates.marketTypes)) {
        const ownerSnap = await db.collection('users')
          .where('ownedOrganizerId', '==', id)
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

    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating organizer:", err);
    res.status(500).json({ error: "Failed to update organizer" });
  }
});

export default router;
