import { db } from "../firebase";

// ── Reviews ───────────────────────────────────────────────────────────────────
// The `reviews` collection is the single source of truth. Market/vendor docs
// may still carry an old (always empty) `reviews` array — GET /markets and
// GET /vendors replace it with the approved reviews from this collection.

// Fields safe to show the public on a profile page
export function toPublicReview(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    author: data.author,
    rating: data.rating,
    comment: data.comment,
    date: data.date,
    status: data.status,
    userId: data.userId,
    reviewerAccountType: data.reviewerAccountType,
  };
}

// Approved reviews grouped by the market/vendor they're about, newest first
export async function getApprovedReviewsByEntity(): Promise<Map<string, ReturnType<typeof toPublicReview>[]>> {
  const byEntity = new Map<string, ReturnType<typeof toPublicReview>[]>();
  try {
    const snap = await db.collection("reviews").where("status", "==", "approved").get();
    const docs = snap.docs.sort((a, b) => (b.data().createdAt ?? 0) - (a.data().createdAt ?? 0));
    for (const doc of docs) {
      const entityId = doc.data().entityId as string;
      if (!entityId) continue;
      if (!byEntity.has(entityId)) byEntity.set(entityId, []);
      byEntity.get(entityId)!.push(toPublicReview(doc.id, doc.data()));
    }
  } catch (err) {
    console.error("Failed to load approved reviews (non-fatal):", err);
  }
  return byEntity;
}
