import { Router } from "express";
import { db } from "../firebase";
import { requireAuth, isAdminUser } from "../middleware/auth";

const router = Router();

// All follow routes act on the signed-in member's own follows. Any
// followerUid sent by the client is ignored in favour of the auth token.
router.use(requireAuth);

// GET /follows?targetType=market
// Returns all of the caller's follows, optionally filtered by targetType.
router.get("/", async (req, res) => {
  const { targetType } = req.query as { targetType?: "market" | "vendor" };
  const followerUid = req.user!.uid;

  try {
    let query: FirebaseFirestore.Query = db
      .collection("follows")
      .where("followerUid", "==", followerUid);

    if (targetType) {
      query = query.where("targetType", "==", targetType);
    }

    const snapshot = await query.get();
    const follows = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.json(follows);
  } catch (err) {
    console.error("Error fetching follows:", err);
    return res.status(500).json({ error: "Failed to fetch follows" });
  }
});

// POST /follows → follow a market or vendor
// body: { targetId, targetType }
router.post("/", async (req, res) => {
  const { targetId, targetType } = req.body as {
    targetId: string;
    targetType: "market" | "vendor";
  };
  const followerUid = req.user!.uid;

  if (!targetId || !targetType) {
    return res.status(400).json({ error: "targetId and targetType are required" });
  }
  if (targetType !== "market" && targetType !== "vendor") {
    return res.status(400).json({ error: "targetType must be 'market' or 'vendor'" });
  }

  try {
    // Prevent duplicate follows
    const existing = await db
      .collection("follows")
      .where("followerUid", "==", followerUid)
      .where("targetId", "==", targetId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: "Already following this target" });
    }

    const data = {
      followerUid,
      targetId,
      targetType,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("follows").add(data);
    return res.status(201).json({ id: docRef.id, ...data });
  } catch (err) {
    console.error("Error creating follow:", err);
    return res.status(500).json({ error: "Failed to create follow" });
  }
});

// DELETE /follows/:id → unfollow (own follows only, or admin)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const docRef = db.collection("follows").doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: "Follow not found" });
    }
    if (doc.data()?.followerUid !== req.user!.uid && !(await isAdminUser(req.user!.uid))) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await docRef.delete();
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting follow:", err);
    return res.status(500).json({ error: "Failed to delete follow" });
  }
});

// DELETE /follows?targetId=yyy → unfollow by lookup (no doc ID needed)
router.delete("/", async (req, res) => {
  const { targetId } = req.query as { targetId?: string };
  const followerUid = req.user!.uid;

  if (!targetId) {
    return res.status(400).json({ error: "targetId is required" });
  }

  try {
    const snapshot = await db
      .collection("follows")
      .where("followerUid", "==", followerUid)
      .where("targetId", "==", targetId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Follow not found" });
    }

    await snapshot.docs[0].ref.delete();
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting follow:", err);
    return res.status(500).json({ error: "Failed to delete follow" });
  }
});

export default router;
