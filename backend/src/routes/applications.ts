import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// GET /applications → return all applications
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("applications").get();
    const applications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(applications);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// POST /applications → create a new application
// body: { vendorId, marketId, customResponses }
router.post("/", async (req, res) => {
  const { vendorId, marketId, customResponses } = req.body as {
    vendorId: string;
    marketId: string;
    customResponses: { question: string; answer: string }[];
  };

  if (!vendorId || !marketId) {
    return res.status(400).json({ error: "vendorId and marketId are required" });
  }

  try {
    const now = new Date();
    const newApplication = {
      vendorId,
      marketId,
      customResponses: customResponses || [],
      status: "pending",
      date: now.toISOString().split("T")[0], // YYYY-MM-DD like your mock
      createdAt: now.getTime()
    };

    const docRef = await db.collection("applications").add(newApplication);
    res.json({ id: docRef.id, ...newApplication });
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ error: "Failed to create application" });
  }
});

// PATCH /applications/:id → update status (approved/rejected) or other fields
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const docRef = db.collection("applications").doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating application:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

export default router;
