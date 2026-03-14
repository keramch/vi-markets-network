import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// GET /market-applications?marketEventId=xxx&status=open
router.get("/", async (req, res) => {
  const { marketEventId, marketPageId, status } = req.query as {
    marketEventId?: string;
    marketPageId?: string;
    status?: string;
  };

  try {
    let query: FirebaseFirestore.Query = db.collection("marketApplications");

    if (marketEventId) {
      query = query.where("marketEventId", "==", marketEventId);
    } else if (marketPageId) {
      query = query.where("marketPageId", "==", marketPageId);
    }
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(applications);
  } catch (err) {
    console.error("Error fetching market applications:", err);
    return res.status(500).json({ error: "Failed to fetch market applications" });
  }
});

// GET /market-applications/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection("marketApplications").doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Market application not found" });
    }
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("Error fetching market application:", err);
    return res.status(500).json({ error: "Failed to fetch market application" });
  }
});

// POST /market-applications → create a new application call
router.post("/", async (req, res) => {
  const {
    marketEventId, marketPageId, organizerUid,
    applicationType, title, description, seekingCategories = [],
    deadline, capacity, capacityAlertThreshold = 0.8,
    customFields = [], status = "draft",
  } = req.body;

  if (!marketEventId || !marketPageId || !organizerUid || !applicationType || !title || !deadline) {
    return res.status(400).json({
      error: "marketEventId, marketPageId, organizerUid, applicationType, title, and deadline are required",
    });
  }

  const now = new Date().toISOString();
  const data = {
    marketEventId,
    marketPageId,
    organizerUid,
    applicationType,
    status,
    title,
    description: description ?? "",
    seekingCategories,
    deadline,
    ...(capacity !== undefined ? { capacity } : {}),
    capacityAlertThreshold,
    registeredCount: 0,
    customFields,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await db.collection("marketApplications").add(data);
    return res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error("Error creating market application:", err);
    return res.status(500).json({ error: "Failed to create market application" });
  }
});

// PATCH /market-applications/:id → update fields (status, deadline, customFields, etc.)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;

  try {
    const docRef = db.collection("marketApplications").doc(id);
    await docRef.set({ ...updates, updatedAt: new Date().toISOString() }, { merge: true });
    const updated = await docRef.get();
    return res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating market application:", err);
    return res.status(500).json({ error: "Failed to update market application" });
  }
});

export default router;
