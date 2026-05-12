import { Router } from "express";
import { db } from "../firebase";

const router = Router();

// GET /markets → returns all markets from Firestore
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("markets").get();
    const markets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(markets);
  } catch (err) {
    console.error("Error fetching markets:", err);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
});

// PATCH /markets/:id → api.updateMarket(id, updates)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const docRef = db.collection("markets").doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();

    // ── Users collection sync (non-fatal) ────────────────────────────────────
    // When market.name is updated, also update users.businessName to keep in sync
    if (updates.name) {
      try {
        const userSnap = await db.collection('users')
          .where('ownedMarketId', '==', id)
          .limit(1)
          .get();
        if (!userSnap.empty) {
          await userSnap.docs[0].ref.update({ businessName: updates.name });
        }
      } catch (userSyncErr) {
        console.error('User businessName sync failed (non-fatal):', userSyncErr);
      }
    }
    // ── End Users sync ────────────────────────────────────────────────────────

    // ── Brevo type sync (non-fatal) ──────────────────────────────────────────
    try {
      const brevoApiKey = process.env.BREVO_API_KEY ?? '';
      if (brevoApiKey && updates.marketTypes && Array.isArray(updates.marketTypes)) {
        const ownerSnap = await db.collection('users')
          .where('ownedMarketId', '==', id)
          .limit(1)
          .get();
        if (!ownerSnap.empty) {
          const ownerEmail = ownerSnap.docs[0].data().email;
          if (ownerEmail) {
            await fetch('https://api.brevo.com/v3/contacts/' + encodeURIComponent(ownerEmail), {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'api-key': brevoApiKey,
              },
              body: JSON.stringify({
                attributes: {
                  MARKET_TYPES: updates.marketTypes.join('|'),
                },
              }),
            });
          }
        }
      }
    } catch (brevoErr) {
      console.error('Brevo market type sync failed (non-fatal):', brevoErr);
    }
    // ── End Brevo sync ────────────────────────────────────────────────────────

    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating market:", err);
    res.status(500).json({ error: "Failed to update market" });
  }
});

export default router;
