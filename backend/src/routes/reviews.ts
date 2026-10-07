import { Router } from "express";
import { db } from "../firebase";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { toPublicReview } from "../utils/reviews";

const router = Router();

// GET /reviews → list all reviews, including pending/declined (admin only)
router.get("/", requireAdmin, async (_req, res) => {
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

// GET /reviews/mine → reviews about the caller's own market/vendor listing,
// pending and approved (declined ones are hidden). Read-only for owners —
// only admins approve/decline.
router.get("/mine", requireAuth, async (req, res) => {
  try {
    const user = (await db.collection("users").doc(req.user!.uid).get()).data() ?? {};
    const listingIds = [user.ownedMarketId, user.ownedVendorId].filter(Boolean) as string[];
    const snaps = await Promise.all(
      listingIds.map(id => db.collection("reviews").where("entityId", "==", id).get())
    );
    const reviews = snaps
      .flatMap(snap => snap.docs)
      .filter(doc => doc.data().status !== "declined")
      .sort((a, b) => (b.data().createdAt ?? 0) - (a.data().createdAt ?? 0))
      .map(doc => ({ ...toPublicReview(doc.id, doc.data()), entityType: doc.data().entityType, entityId: doc.data().entityId }));
    res.json(reviews);
  } catch (err) {
    console.error("Error fetching own listing reviews:", err);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /reviews → create a new review (signed-in members only)
// expected body: { entityType: 'market' | 'vendor', entityId, rating, comment }
// The author name, userId and account type come from the reviewer's own
// account, so nobody can post a review under someone else's name.
router.post("/", requireAuth, async (req, res) => {
  const { entityType, entityId, comment } = req.body as {
    entityType: "market" | "vendor";
    entityId: string;
    comment: string;
  };
  const rating = Number(req.body?.rating);

  if (!entityType || !entityId || !comment) {
    return res.status(400).json({ error: "Missing required review fields" });
  }
  if (entityType !== "market" && entityType !== "vendor") {
    return res.status(400).json({ error: "entityType must be 'market' or 'vendor'" });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be a whole number from 1 to 5" });
  }
  if (String(comment).length > 2000) {
    return res.status(400).json({ error: "Reviews can be at most 2000 characters" });
  }

  try {
    const userId = req.user!.uid;

    // The listing must exist and be public
    const listing = await db.collection(entityType === "market" ? "markets" : "vendors").doc(entityId).get();
    if (!listing.exists || (listing.data()?.status && listing.data()?.status !== "active")) {
      return res.status(404).json({ error: "This listing can't be reviewed right now." });
    }

    // One review per member per listing (a declined review doesn't count)
    const previous = await db
      .collection("reviews")
      .where("userId", "==", userId)
      .where("entityId", "==", entityId)
      .get();
    if (previous.docs.some(doc => doc.data().status !== "declined")) {
      return res.status(409).json({ error: "You've already reviewed this listing." });
    }

    const reviewer = (await db.collection("users").doc(userId).get()).data() ?? {};
    const author = reviewer.firstName && reviewer.lastName
      ? `${reviewer.firstName} ${String(reviewer.lastName).charAt(0)}.`
      : (req.user!.email ?? "Member").split("@")[0];
    const reviewerAccountType = reviewer.accountType as string | undefined;

    const now = new Date();
    const newReview = {
      entityType,
      entityId,
      rating,
      comment: String(comment),
      author,
      userId,
      ...(reviewerAccountType ? { reviewerAccountType } : {}),
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

// PATCH /reviews/:id → update review status (approved / declined) — admin only
router.patch("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: "approved" | "declined" };

  if (!status || !["approved", "declined"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    const docRef = db.collection("reviews").doc(id);
    // Never create a record by editing one that doesn't exist
    if (!(await docRef.get()).exists) {
      return res.status(404).json({ error: "Review not found" });
    }
    await docRef.set({ status }, { merge: true });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating review:", err);
    res.status(500).json({ error: "Failed to update review" });
  }
});

export default router;
