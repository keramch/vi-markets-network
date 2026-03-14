import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// (Optional) GET /reviews → list all reviews
// Not used by your UI yet, but handy for testing.
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("reviews").get();
    const reviews = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(reviews);
  } catch (err) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /reviews → create a new review
// expected body: { entityType: 'market' | 'vendor', entityId, rating, comment, author }
router.post("/", async (req, res) => {
  const { entityType, entityId, rating, comment, author } = req.body as {
    entityType: "market" | "vendor";
    entityId: string;
    rating: number;
    comment: string;
    author: string;
  };

  if (!entityType || !entityId || !rating || !comment || !author) {
    return res.status(400).json({ error: "Missing required review fields" });
  }

  try {
    const now = new Date();
    const newReview = {
      entityType,
      entityId,
      rating,
      comment,
      author,
      status: "pending",
      date: now.toISOString().split("T")[0], // YYYY-MM-DD like your mock
      createdAt: now.getTime()
    };

    const docRef = await db.collection("reviews").add(newReview);
    res.json({ id: docRef.id, ...newReview });
  } catch (err) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: "Failed to create review" });
  }
});

// PATCH /reviews/:id → update review status (approved / declined)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: "approved" | "declined" };

  if (!status || !["approved", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const docRef = db.collection("reviews").doc(id);
    await docRef.set({ status }, { merge: true });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Failed to update review" });
  }
});

export default router;
