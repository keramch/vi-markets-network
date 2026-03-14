import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// GET /follows?followerUid=xxx&targetType=market
// Returns all follows for a user, optionally filtered by targetType.
router.get("/", async (req, res) => {
  const { followerUid, targetType } = req.query as {
    followerUid?: string;
    targetType?: "market" | "vendor";
  };

  if (!followerUid) {
    return res.status(400).json({ error: "followerUid is required" });
  }

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
// body: { followerUid, targetId, targetType }
router.post("/", async (req, res) => {
  const { followerUid, targetId, targetType } = req.body as {
    followerUid: string;
    targetId: string;
    targetType: "market" | "vendor";
  };

  if (!followerUid || !targetId || !targetType) {
    return res.status(400).json({ error: "followerUid, targetId, and targetType are required" });
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

// DELETE /follows/:id → unfollow
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("follows").doc(id).delete();
    return res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting follow:", err);
    return res.status(500).json({ error: "Failed to delete follow" });
  }
});

// DELETE /follows?followerUid=xxx&targetId=yyy → unfollow by lookup (no doc ID needed)
router.delete("/", async (req, res) => {
  const { followerUid, targetId } = req.query as { followerUid?: string; targetId?: string };

  if (!followerUid || !targetId) {
    return res.status(400).json({ error: "followerUid and targetId are required" });
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
