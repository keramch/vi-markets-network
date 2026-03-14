import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// GET /markets → returns all markets from Firestore
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("markets").get();
    const markets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(markets);
  } catch (err) {
    console.error("Error fetching markets:", err);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
});

// PATCH /markets/:id → api.updateMarket(id, updates)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const docRef = db.collection("markets").doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating market:", err);
    res.status(500).json({ error: "Failed to update market" });
  }
});

export default router;
