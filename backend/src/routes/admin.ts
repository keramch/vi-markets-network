import { Router, Request, Response, NextFunction } from "express";
import { db, auth } from "../firebase";

const router = Router();

// Verifies the request carries a valid Firebase ID token belonging to an admin user
async function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const token = authHeader.split("Bearer ")[1];

  let decoded: Awaited<ReturnType<typeof auth.verifyIdToken>>;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const userDoc = await db.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists || userDoc.data()?.isAdmin !== true) {
      return res.status(403).json({ error: "Forbidden" });
    }
  } catch {
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
}

router.use(adminAuthMiddleware);

// POST /admin/message → log message details (real email service wired later)
router.post("/message", async (req, res) => {
  const { to, subject, body } = req.body as { to?: string; subject?: string; body?: string };

  if (!to || !subject || !body) {
    return res.status(400).json({ error: "to, subject, and body are required" });
  }

  console.log(`[ADMIN MESSAGE] To: ${to} | Subject: ${subject}\n${body}`);
  return res.json({ ok: true });
});

// DELETE /admin/members/:type/:id → hard-delete a market/vendor + its owner user
router.delete("/members/:type/:id", async (req, res) => {
  const { type, id } = req.params;

  if (type !== "market" && type !== "vendor") {
    return res.status(400).json({ error: "type must be 'market' or 'vendor'" });
  }

  try {
    const collection = type === "market" ? "markets" : "vendors";
    const ownerField = type === "market" ? "ownedMarketId" : "ownedVendorId";

    // 1. Find the owner's Firestore user document
    const userSnap = await db
      .collection("users")
      .where(ownerField, "==", id)
      .limit(1)
      .get();

    // 2. Delete the market/vendor document
    await db.collection(collection).doc(id).delete();

    if (!userSnap.empty) {
      const userDoc = userSnap.docs[0];
      const userData = userDoc.data();

      // 3. Delete the Firebase Auth account (ignore if already gone)
      if (userData.email) {
        try {
          const authUser = await auth.getUserByEmail(userData.email);
          await auth.deleteUser(authUser.uid);
        } catch (authErr: any) {
          if (authErr.code !== "auth/user-not-found") {
            console.warn(`Could not delete Auth user ${userData.email}:`, authErr.message);
          }
        }
      }

      // 4. Delete the Firestore user document
      await userDoc.ref.delete();
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Admin delete member error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

export default router;
