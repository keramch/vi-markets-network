import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// GET /vendors → return all vendors
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("vendors").get();
    const vendors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(vendors);
  } catch (err) {
    console.error("Error fetching vendors:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// PATCH /vendors/:id → update vendor
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const docRef = db.collection("vendors").doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating vendor:", err);
    res.status(500).json({ error: "Failed to update vendor" });
  }
});

export default router;
