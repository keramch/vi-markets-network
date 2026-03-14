import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// GET /vendor-applications?marketApplicationId=xxx  (organizer view)
// GET /vendor-applications?vendorUid=xxx            (vendor's own submissions)
router.get("/", async (req, res) => {
  const { marketApplicationId, vendorUid, status } = req.query as {
    marketApplicationId?: string;
    vendorUid?: string;
    status?: string;
  };

  try {
    let query: FirebaseFirestore.Query = db.collection("vendorApplications");

    if (marketApplicationId) {
      query = query.where("marketApplicationId", "==", marketApplicationId);
    } else if (vendorUid) {
      query = query.where("vendorUid", "==", vendorUid);
    }
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(applications);
  } catch (err) {
    console.error("Error fetching vendor applications:", err);
    return res.status(500).json({ error: "Failed to fetch vendor applications" });
  }
});

// GET /vendor-applications/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection("vendorApplications").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Vendor application not found" });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error fetching vendor application:", err);
    return res.status(500).json({ error: "Failed to fetch vendor application" });
  }
});

// POST /vendor-applications → vendor submits an application
router.post("/", async (req, res) => {
  const {
    marketApplicationId, marketEventId, marketPageId, vendorUid,
    prefillSnapshot, customFieldResponses = [], applicationNote,
  } = req.body;

  if (!marketApplicationId || !marketEventId || !marketPageId || !vendorUid || !prefillSnapshot) {
    return res.status(400).json({
      error: "marketApplicationId, marketEventId, marketPageId, vendorUid, and prefillSnapshot are required",
    });
  }

  // Prevent duplicate submissions from the same vendor to the same market application
  try {
    const existing = await db
      .collection("vendorApplications")
      .where("marketApplicationId", "==", marketApplicationId)
      .where("vendorUid", "==", vendorUid)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: "You have already applied to this market application" });
    }

    const now = new Date().toISOString();
    const data = {
      marketApplicationId,
      marketEventId,
      marketPageId,
      vendorUid,
      status: "pending",
      prefillSnapshot,
      customFieldResponses,
      ...(applicationNote ? { applicationNote } : {}),
      submittedAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("vendorApplications").add(data);

    // Increment registeredCount on the parent market application
    const marketAppRef = db.collection("marketApplications").doc(marketApplicationId);
    const marketApp = await marketAppRef.get();
    if (marketApp.exists) {
      const currentCount = (marketApp.data()?.registeredCount ?? 0) as number;
      await marketAppRef.set({ registeredCount: currentCount + 1, updatedAt: now }, { merge: true });
    }

    return res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error("Error creating vendor application:", err);
    return res.status(500).json({ error: "Failed to create vendor application" });
  }
});

// PATCH /vendor-applications/:id → update status, waitlistPosition, etc.
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;

  try {
    const docRef = db.collection("vendorApplications").doc(id);
    await docRef.set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating vendor application:", err);
    return res.status(500).json({ error: "Failed to update vendor application" });
  }
});

// DELETE /vendor-applications/:id → vendor withdraws (sets status to 'cancelled')
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = db.collection("vendorApplications").doc(id);
    await docRef.set({ status: "cancelled", updatedAt: new Date().toISOString() }, { merge: true });
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error cancelling vendor application:", err);
    return res.status(500).json({ error: "Failed to cancel vendor application" });
  }
});

export default router;
