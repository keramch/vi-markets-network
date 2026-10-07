import { Router } from "express";
import { db } from "../firebase";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { toPublicReview } from "../utils/reviews";
import { ownsListing } from "../utils/listingAccess";
import { escapeHtml } from "../utils/escapeHtml";

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
      .map(doc => {
        const data = doc.data();
        return {
          ...toPublicReview(doc.id, data),
          entityType: data.entityType,
          entityId: data.entityId,
          // The owner sees the state of their own request (not who/when internals)
          ...(data.removalRequest
            ? { removalRequest: { reason: data.removalRequest.reason, requestedAt: data.removalRequest.requestedAt, status: data.removalRequest.status } }
            : {}),
        };
      });
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

// POST /reviews/:id/removal-request → the reviewed listing's owner asks the
// admin to remove a review (e.g. abusive, not constructive). Only an admin
// can actually remove it. Emails hello@vimarkets.ca so requests aren't missed.
router.post("/:id/removal-request", requireAuth, async (req, res) => {
  const { id } = req.params;
  const reason = String(req.body?.reason ?? "").trim();
  if (!reason) {
    return res.status(400).json({ error: "Please tell us why this review should be removed." });
  }
  if (reason.length > 1000) {
    return res.status(400).json({ error: "Please keep the reason under 1000 characters." });
  }

  try {
    const docRef = db.collection("reviews").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Review not found" });
    }
    const review = doc.data()!;
    const collection = review.entityType === "vendor" ? "vendors" : "markets";
    if (!(await ownsListing(req.user!.uid, collection, review.entityId))) {
      return res.status(403).json({ error: "You can only request removal of reviews of your own listing." });
    }
    if (review.removalRequest?.status === "open") {
      return res.status(409).json({ error: "You've already requested removal of this review." });
    }

    const removalRequest = {
      reason,
      requestedBy: req.user!.uid,
      requestedAt: new Date().toISOString(),
      status: "open",
    };
    await docRef.set({ removalRequest }, { merge: true });

    // Let the admin know (non-fatal)
    try {
      const listingName = (await db.collection(collection).doc(review.entityId).get()).data()?.name ?? "a listing";
      const lines = [
        `${listingName} has asked for a review to be removed.`,
        "",
        `Review by ${review.author} (${review.rating}/5): "${review.comment}"`,
        "",
        `Reason given: ${reason}`,
        "",
        "Decide in Admin HQ → Reviews → Removal requests: https://www.vimarkets.ca/hq",
      ];
      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY ?? "" },
        body: JSON.stringify({
          sender: { name: "VI Markets Network", email: "hello@vimarkets.ca" },
          to: [{ email: "hello@vimarkets.ca", name: "VI Markets Admin" }],
          subject: `Review removal requested: ${listingName}`,
          htmlContent: `<div style="font-family: sans-serif; font-size: 16px; color: #2C2828;">${lines.map(l => escapeHtml(l)).join("<br>")}</div>`,
          textContent: lines.join("\n"),
        }),
      });
    } catch (emailErr) {
      console.error("Removal request notification email failed (non-fatal):", emailErr);
    }

    res.json({ ok: true, removalRequest: { reason, requestedAt: removalRequest.requestedAt, status: "open" } });
  } catch (err) {
    console.error("Error creating removal request:", err);
    res.status(500).json({ error: "Failed to send removal request" });
  }
});

// POST /reviews/:id/removal-request/resolve → admin decides: "remove" declines
// the review (hidden everywhere), "keep" leaves it published.
router.post("/:id/removal-request/resolve", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const action = req.body?.action;
  if (action !== "remove" && action !== "keep") {
    return res.status(400).json({ error: "action must be 'remove' or 'keep'" });
  }

  try {
    const docRef = db.collection("reviews").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Review not found" });
    }
    const resolution = {
      "removalRequest.status": action === "remove" ? "accepted" : "dismissed",
      "removalRequest.resolvedAt": new Date().toISOString(),
      ...(action === "remove" ? { status: "declined" } : {}),
    };
    await docRef.update(resolution);
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error resolving removal request:", err);
    res.status(500).json({ error: "Failed to resolve removal request" });
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
