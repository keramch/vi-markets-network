import { Router } from "express";
import { db } from "../firebase";
import { requireAuth } from "../middleware/auth";

const router = Router();

// (The old POST /auth/login — email + postal code, no password — was removed.
// Login happens in Firebase Auth on the frontend, then calls GET /auth/me.)

// GET /auth/me → the signed-in member's own Firestore user document.
// Identity comes from the verified Firebase ID token only; the legacy
// ?email= query param is ignored so nobody can look up another member.
router.get("/me", requireAuth, async (req, res) => {
  const { uid, email } = req.user!;

  try {
    // Normal case: users doc ID == Firebase Auth UID
    const byUid = await db.collection("users").doc(uid).get();
    if (byUid.exists) {
      return res.json({ id: byUid.id, ...byUid.data() });
    }

    // Fallback for older docs not keyed by UID — match on the token's own email
    if (email) {
      let snapshot = await db
        .collection("users")
        .where("emailLower", "==", email.toLowerCase())
        .limit(1)
        .get();

      if (snapshot.empty) {
        snapshot = await db
          .collection("users")
          .where("email", "==", email)
          .limit(1)
          .get();
      }

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return res.json({ id: doc.id, ...doc.data() });
      }
    }

    return res.status(404).json({ error: "User not found" });
  } catch (err) {
    console.error("/auth/me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
