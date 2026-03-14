import { Router } from "express";
import { db } from "../firebase";

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

    if (marketPageId) {
      query = query.where("marketPageId", "==", marketPageId);
    }
    if (status) {
      query = query.where("status", "==", status);
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
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error fetching market event:", err);
    return res.status(500).json({ error: "Failed to fetch market event" });
  }
});

// POST /market-events → create a new event
// body: MarketEvent fields (minus id, createdAt, updatedAt)
router.post("/", async (req, res) => {
  const { marketPageId, organizerUid, name, type, marketTags, location, schedule, status = "draft", photos = [], externalEventUrl, exceptions = [] } = req.body;

  if (!marketPageId || !organizerUid || !name || !type || !location || !schedule) {
    return res.status(400).json({ error: "marketPageId, organizerUid, name, type, location, and schedule are required" });
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
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;

  try {
    const docRef = db.collection("marketEvents").doc(id);
    await docRef.set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating market event:", err);
    return res.status(500).json({ error: "Failed to update market event" });
  }
});

// DELETE /market-events/:id → soft-delete by setting status to 'archived'
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = db.collection("marketEvents").doc(id);
    await docRef.set({ status: "archived", updatedAt: new Date().toISOString() }, { merge: true });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error archiving market event:", err);
    return res.status(500).json({ error: "Failed to archive market event" });
  }
});

export default router;
