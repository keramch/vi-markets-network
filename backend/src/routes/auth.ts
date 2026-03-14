import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// POST /auth/login → behaves like your mock login:
// find user by email, or auto-create a "free" user if not found.
router.post("/login", async (req, res) => {
  const { email, postalCode } = req.body as { email: string; postalCode: string };

  if (!email || !postalCode) {
    return res.status(400).json({ error: "Email and postalCode are required" });
  }

  try {
    const emailLower = email.toLowerCase();

    // Try emailLower first (new documents), fall back to email field (seeded/legacy docs)
    let snapshot = await db
      .collection("users")
      .where("emailLower", "==", emailLower)
      .limit(1)
      .get();

    if (snapshot.empty) {
      snapshot = await db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      // Auto-create like your mock api.ts does
      const newUser = {
        email,
        emailLower,
        postalCode,
        membership: "free",
        isAdmin: false,
        autoRenew: false,
        isFoundingMember: false,
        notificationSettings: {
          favoriteMarket: true,
          favoriteVendor: true,
          nearbyMarket: false
        },
        createdAt: Date.now()
      };

      const docRef = await db.collection("users").add(newUser);
      return res.json({ id: docRef.id, ...newUser });
    } else {
      const doc = snapshot.docs[0];
      const user = { id: doc.id, ...doc.data() };
      return res.json(user);
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// GET /auth/me?email=xxx → fetch the Firestore user document by email (used by client-side auth state listener)
router.get("/me", async (req, res) => {
  const { email } = req.query as { email?: string };
  if (!email) return res.status(400).json({ error: "email query param required" });

  try {
    const emailLower = email.toLowerCase();

    let snapshot = await db
      .collection("users")
      .where("emailLower", "==", emailLower)
      .limit(1)
      .get();

    if (snapshot.empty) {
      snapshot = await db
        .collection("users")
        .where("email", "==", email)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      return res.status(404).json({ error: "User not found" });
    }

    const doc = snapshot.docs[0];
    return res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error("/auth/me error:", err);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
