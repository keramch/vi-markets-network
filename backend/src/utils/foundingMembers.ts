import { db } from "../firebase";

// UIDs of founding members. Lets public market/vendor listings show the
// Founding Member badge without exposing the users collection to the public.
export async function getFoundingMemberUids(): Promise<Set<string>> {
  try {
    const snap = await db
      .collection("users")
      .where("subscription.foundingMember", "==", true)
      .select()
      .get();
    return new Set(snap.docs.map(doc => doc.id));
  } catch (err) {
    console.error("Failed to load founding member UIDs (non-fatal):", err);
    return new Set();
  }
}
