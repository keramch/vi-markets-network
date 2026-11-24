import { Router } from "express";
import { db } from "../firebase";
import { requireAuth, isAdminUser } from "../middleware/auth";
import { ownsListing } from "../utils/listingAccess";
import { sanitizeMarketInput } from "../utils/marketInput";
import { getApprovedReviewsByEntity } from "../utils/reviews";
import { slugify, firstFreeSlug } from "../utils/slug";

// Markets (OD-16): the event people go to — one-off, on several dates, or
// repeating. A market may have an organizer (organizerId) or be unclaimed
// (organizerId null), added by a vendor or by HQ. Stored as `marketEvents`
// until stage 1 (T128).

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// A readable link part, unique across all markets so /markets/<slug> works on
// its own and never changes when a market is claimed. Archived markets keep
// theirs reserved so an old shared link never points at a different market.
async function uniqueMarketSlug(name: string, ownId?: string): Promise<string> {
  const base = slugify(name) || "market";
  const snap = await db.collection("markets").where("slug", ">=", base).where("slug", "<=", base + "\uf8ff").get();
  const taken = new Set<string>();
  snap.docs.forEach(d => {
    const s = d.data().slug;
    if (d.id !== ownId && typeof s === "string" && s) taken.add(s);
  });
  return firstFreeSlug(base, taken);
}

// Can the caller see and manage unpublished markets for this organizer?
// Unclaimed markets (no organizer) are managed by admins only.
async function canManageOrganizerMarkets(uid: string | undefined, organizerId: string | null | undefined): Promise<boolean> {
  if (!uid) return false;
  if (await isAdminUser(uid)) return true;
  return !!organizerId && ownsListing(uid, "organizers", organizerId);
}

// Can the caller edit/archive this market? Rights come from its organizer, not
// from who added it, so a claimed market's new organizer gets it straight away.
async function checkMarketAccess(uid: string, marketId: string): Promise<"admin" | "owner" | "forbidden" | "not-found"> {
  const doc = await db.collection("markets").doc(marketId).get();
  if (!doc.exists) return "not-found"; // never create a market by editing a missing one
  if (await isAdminUser(uid)) return "admin";
  const organizerId = doc.data()!.organizerId;
  if (organizerId && (await ownsListing(uid, "organizers", organizerId))) return "owner";
  return "forbidden";
}

const router = Router();

// GET /markets?organizerId=xxx&status=published
// Everyone gets published markets. Organizers also see their own drafts;
// admins see everything. Dates are expanded on the client.
router.get("/", async (req, res) => {
  const { organizerId, status } = req.query as { organizerId?: string; status?: string };

  try {
    let query: FirebaseFirestore.Query = db.collection("markets");
    const callerIsAdmin = !!req.user && (await isAdminUser(req.user.uid));
    let effectiveStatus = status;
    if (status !== "published" && !callerIsAdmin && !(organizerId && (await canManageOrganizerMarkets(req.user?.uid, organizerId)))) {
      effectiveStatus = "published";
    }
    if (organizerId) query = query.where("organizerId", "==", organizerId);
    if (effectiveStatus) query = query.where("status", "==", effectiveStatus);

    const [snapshot, reviewsByEntity] = await Promise.all([query.get(), getApprovedReviewsByEntity()]);
    const markets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      reviews: reviewsByEntity.get(doc.id) ?? [],
    }));
    return res.json(markets);
  } catch (err) {
    console.error("Error fetching markets:", err);
    return res.status(500).json({ error: "Failed to fetch markets" });
  }
});

// GET /markets/:id → one market
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection("markets").doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: "Market not found" });
    const data = doc.data()!;
    if (data.status !== "published" && !(await canManageOrganizerMarkets(req.user?.uid, data.organizerId))) {
      return res.status(404).json({ error: "Market not found" });
    }
    return res.json({ id: doc.id, ...data });
  } catch (err) {
    console.error("Error fetching market:", err);
    return res.status(500).json({ error: "Failed to fetch market" });
  }
});

// POST /markets → a new market.
// An organizer adds one under their own organizer profile; an admin can add one
// under any organizer or unclaimed (organizerId null, from HQ).
router.post("/", requireAuth, async (req, res) => {
  const callerIsAdmin = await isAdminUser(req.user!.uid);
  const checked = sanitizeMarketInput(req.body, { isAdmin: callerIsAdmin });
  if ("error" in checked) return res.status(400).json({ error: checked.error });
  const { name, type, location, schedule } = checked.data;
  if (!name || !type || !location || !schedule) {
    return res.status(400).json({ error: "name, type, location and schedule are required" });
  }

  let organizerId: string | null;
  if (callerIsAdmin) {
    const asked = (req.body ?? {}).organizerId;
    organizerId = typeof asked === "string" && asked ? asked : null;
    if (organizerId && !(await db.collection("organizers").doc(organizerId).get()).exists) {
      return res.status(400).json({ error: "That organizer doesn't exist." });
    }
  } else {
    organizerId = typeof (req.body ?? {}).organizerId === "string" ? req.body.organizerId : "";
    if (!organizerId || !(await ownsListing(req.user!.uid, "organizers", organizerId))) {
      return res.status(403).json({ error: "You can only add markets to your own organizer profile." });
    }
  }

  const now = new Date().toISOString();
  try {
    const { organizerId: _o, externalEventUrl, ...fields } = checked.data;
    const data = {
      marketTags: [],
      exceptions: [],
      photos: [],
      status: "draft",
      ...fields,
      organizerId,
      slug: await uniqueMarketSlug(String(name)),
      addedBy: { uid: req.user!.uid },
      ...(externalEventUrl ? { externalEventUrl } : {}),
      ...(callerIsAdmin ? { hqCheckedAt: now } : {}),
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection("markets").add(data);
    return res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error("Error creating market:", err);
    return res.status(500).json({ error: "Failed to create market" });
  }
});

// POST /markets/from-vendor → a vendor adds a market they'll be at that isn't
// listed yet. It goes up straight away as an unclaimed market, with the date
// they gave marked "from a vendor" (T128). body: { vendorId, name, city, address, date }
router.post("/from-vendor", requireAuth, async (req, res) => {
  const { vendorId, name, city, address, date } = req.body ?? {};
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
  const cleanName = text(name, 120);
  if (!cleanName) return res.status(400).json({ error: "Please give the market a name." });
  if (typeof vendorId !== "string" || !vendorId) return res.status(400).json({ error: "vendorId is required" });

  const callerIsAdmin = await isAdminUser(req.user!.uid);
  if (!callerIsAdmin && !(await ownsListing(req.user!.uid, "vendors", vendorId))) {
    return res.status(403).json({ error: "You can only add markets to your own vendor profile." });
  }
  const dates = typeof date === "string" && DATE.test(date) ? [date] : [];

  try {
    const now = new Date().toISOString();
    const data = {
      name: cleanName,
      type: "dates",
      schedule: { dates, startTime: "", endTime: "" },
      dateSources: Object.fromEntries(dates.map(d => [d, "vendor"])),
      location: { venueName: "", address: text(address, 200), city: text(city, 80), province: "BC" },
      marketType: [],
      marketTags: [],
      exceptions: [],
      photos: [],
      status: "published",
      organizerId: null,
      slug: await uniqueMarketSlug(cleanName),
      addedBy: { vendorId, uid: req.user!.uid },
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await db.collection("markets").add(data);
    return res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error("Error creating market from vendor:", err);
    return res.status(500).json({ error: "Failed to add market" });
  }
});

// PATCH /markets/:id → the market's organizer, or an admin.
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = db.collection("markets").doc(id);
    const access = await checkMarketAccess(req.user!.uid, id);
    if (access === "not-found") return res.status(404).json({ error: "Market not found" });
    if (access === "forbidden") return res.status(403).json({ error: "You can only edit your own markets." });

    // Only the form's own fields get through. Which organizer runs it changes
    // only for admins. id, createdAt and slug never change here.
    const checked = sanitizeMarketInput(req.body, { isAdmin: access === "admin" });
    if ("error" in checked) return res.status(400).json({ error: checked.error });
    const updates: Record<string, unknown> = checked.data;

    const current = (await docRef.get()).data()!;
    if ("organizerId" in updates && updates.organizerId && updates.organizerId !== current.organizerId) {
      if (!(await db.collection("organizers").doc(String(updates.organizerId)).get()).exists) {
        return res.status(400).json({ error: "That organizer doesn't exist." });
      }
    }
    // The link never changes after it's set, even if the market is renamed, so shared links keep working
    if (!current.slug) {
      const name = typeof updates.name === "string" && updates.name ? updates.name : current.name;
      updates.slug = await uniqueMarketSlug(String(name ?? ""), id);
    }
    // An admin's save counts as checked by HQ: the vendor who added it can no longer change it (stage 3)
    const now = new Date().toISOString();
    if (access === "admin") updates.hqCheckedAt = now;

    // dateSources is replaced whole, never merged, so confirmed dates lose their "from a vendor" mark
    if ("dateSources" in updates) await docRef.update({ dateSources: updates.dateSources });
    const { dateSources: _d, ...rest } = updates;
    await docRef.set({ ...rest, updatedAt: now }, { merge: true });
    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating market:", err);
    return res.status(500).json({ error: "Failed to update market" });
  }
});

// DELETE /markets/:id → archive (organizer or admin).
// DELETE /markets/:id?permanent=1 → admins only, unclaimed markets only: removes
// it and the vendors' "Find us at" links to it (T133).
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const access = await checkMarketAccess(req.user!.uid, id);
    if (access === "not-found") return res.status(404).json({ error: "Market not found" });
    if (access === "forbidden") return res.status(403).json({ error: "You can only remove your own markets." });

    const docRef = db.collection("markets").doc(id);
    if (req.query.permanent === "1") {
      if (access !== "admin") return res.status(403).json({ error: "Only an admin can delete a market." });
      if ((await docRef.get()).data()?.organizerId) {
        return res.status(400).json({ error: "This market has an organizer: archive it instead." });
      }
      const vendors = await db.collection("vendors").get();
      const batch = db.batch();
      vendors.docs.forEach(v => {
        const list = (v.data().attendingMarkets ?? []) as { marketId: string }[];
        if (list.some(a => a.marketId === id)) {
          batch.update(v.ref, { attendingMarkets: list.filter(a => a.marketId !== id) });
        }
      });
      batch.delete(docRef);
      await batch.commit();
      return res.json({ ok: true, deleted: true });
    }

    await docRef.set({ status: "archived", updatedAt: new Date().toISOString() }, { merge: true });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error removing market:", err);
    return res.status(500).json({ error: "Failed to remove market" });
  }
});

export default router;
