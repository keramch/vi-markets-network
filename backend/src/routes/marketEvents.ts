import { Router } from "express";
import { db } from "../firebase";
import { requireAuth, isAdminUser } from "../middleware/auth";
import { ownsListing } from "../utils/listingAccess";

// Can the caller see/manage non-published events for this market?
async function canManageMarketEvents(uid: string | undefined, marketPageId: string | undefined): Promise<boolean> {
  if (!uid) return false;
  if (await isAdminUser(uid)) return true;
  return !!marketPageId && ownsListing(uid, "markets", marketPageId);
}

// Can the caller edit/archive this specific event?
async function checkEventAccess(uid: string, eventId: string): Promise<"admin" | "owner" | "forbidden" | "not-found"> {
  const doc = await db.collection("marketEvents").doc(eventId).get();
  if (!doc.exists) return "not-found"; // never create an event by editing a missing one
  if (await isAdminUser(uid)) return "admin";
  const data = doc.data()!;
  if (data.organizerUid === uid) return "owner";
  if (data.marketPageId && (await ownsListing(uid, "markets", data.marketPageId))) return "owner";
  return "forbidden";
}

const router = Router();

// GET /market-events?marketPageId=xxx&status=published&month=3&year=2026
// Returns events filtered by marketPageId and/or status.
// month/year are accepted for API consistency but NOT used in the Firestore query —
// recurring events span many dates and must be expanded on the client side.
router.get("/", async (req, res) => {
  const { marketPageId, status } = req.query as {
    marketPageId?: string;
    status?: string;
    month?: string;
    year?: string;
  };

  try {
    let query: FirebaseFirestore.Query = db.collection("marketEvents");

    // Drafts/cancelled/archived events are only visible to the market's owner and admins
    let effectiveStatus = status;
    if (status !== "published" && !(await canManageMarketEvents(req.user?.uid, marketPageId))) {
      effectiveStatus = "published";
    }

    if (marketPageId) {
      query = query.where("marketPageId", "==", marketPageId);
    }
    if (effectiveStatus) {
      query = query.where("status", "==", effectiveStatus);
    }

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(events);
  } catch (err) {
    console.error("Error fetching market events:", err);
    return res.status(500).json({ error: "Failed to fetch market events" });
  }
});

// GET /market-events/:id → get one event
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection("marketEvents").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Market event not found" });
    }
    const data = doc.data()!;
    if (data.status !== "published" && !(await canManageMarketEvents(req.user?.uid, data.marketPageId))) {
      return res.status(404).json({ error: "Market event not found" });
    }
    return res.json({ id: doc.id, ...data });
  } catch (err) {
    console.error("Error fetching market event:", err);
    return res.status(500).json({ error: "Failed to fetch market event" });
  }
});

// POST /market-events → create a new event
// body: MarketEvent fields (minus id, createdAt, updatedAt)
// Only the market's owner (or an admin) can add events to it.
router.post("/", requireAuth, async (req, res) => {
  const { marketPageId, name, type, marketTags, location, schedule, status = "draft", photos = [], externalEventUrl, exceptions = [] } = req.body;
  let { organizerUid } = req.body;

  if (!marketPageId || !name || !type || !location || !schedule) {
    return res.status(400).json({ error: "marketPageId, name, type, location, and schedule are required" });
  }

  const callerIsAdmin = await isAdminUser(req.user!.uid);
  if (!callerIsAdmin) {
    if (!(await ownsListing(req.user!.uid, "markets", marketPageId))) {
      return res.status(403).json({ error: "You can only add events to your own market." });
    }
    organizerUid = req.user!.uid;
  }
  if (!organizerUid) {
    return res.status(400).json({ error: "organizerUid is required" });
  }

  const now = new Date().toISOString();
  const data = {
    marketPageId,
    organizerUid,
    name,
    type,
    marketTags: marketTags ?? [],
    location,
    schedule,
    exceptions,
    status,
    photos,
    ...(externalEventUrl ? { externalEventUrl } : {}),
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await db.collection("marketEvents").add(data);
    return res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error("Error creating market event:", err);
    return res.status(500).json({ error: "Failed to create market event" });
  }
});

// PATCH /market-events/:id → update an event
// Organizer who created it, the market's owner, or an admin.
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = { ...(req.body ?? {}) } as Record<string, unknown>;

  try {
    const docRef = db.collection("marketEvents").doc(id);
    const access = await checkEventAccess(req.user!.uid, id);
    if (access === "not-found") return res.status(404).json({ error: "Market event not found" });
    if (access === "forbidden") return res.status(403).json({ error: "You can only edit your own market's events." });

    // Which market an event belongs to, and who created it, never change via edit
    delete updates.id;
    delete updates.createdAt;
    if (access !== "admin") {
      delete updates.marketPageId;
      delete updates.organizerUid;
    }

    await docRef.set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating market event:", err);
    return res.status(500).json({ error: "Failed to update market event" });
  }
});

// DELETE /market-events/:id → soft-delete by setting status to 'archived'
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const access = await checkEventAccess(req.user!.uid, id);
    if (access === "not-found") return res.status(404).json({ error: "Market event not found" });
    if (access === "forbidden") return res.status(403).json({ error: "You can only remove your own market's events." });

    const docRef = db.collection("marketEvents").doc(id);
    await docRef.set({ status: "archived", updatedAt: new Date().toISOString() }, { merge: true });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error archiving market event:", err);
    return res.status(500).json({ error: "Failed to archive market event" });
  }
});

export default router;
