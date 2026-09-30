import { Router } from "express";
import { db } from "../firebase";
import { requireAuth, isAdminUser } from "../middleware/auth";
import { ownsListing } from "../utils/listingAccess";

const router = Router();

// GET /applications → applications the caller is involved in:
//   admin → all; vendor → their own; market owner → ones sent to their market;
//   signed out → none. (Applications can contain vendors' private answers.)
router.get("/", async (req, res) => {
  if (!req.user) return res.json([]);

  try {
    const uid = req.user.uid;
    if (await isAdminUser(uid)) {
      const snapshot = await db.collection("applications").get();
      return res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    const user = (await db.collection("users").doc(uid).get()).data() ?? {};
    const queries: Promise<FirebaseFirestore.QuerySnapshot>[] = [];
    if (user.ownedVendorId) {
      queries.push(db.collection("applications").where("vendorId", "==", user.ownedVendorId).get());
    }
    if (user.ownedMarketId) {
      queries.push(db.collection("applications").where("marketId", "==", user.ownedMarketId).get());
    }

    const byId = new Map<string, Record<string, unknown>>();
    for (const snap of await Promise.all(queries)) {
      snap.docs.forEach(doc => byId.set(doc.id, { id: doc.id, ...doc.data() }));
    }
    res.json([...byId.values()]);
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// POST /applications → a vendor applies to a market (own vendor profile only)
// body: { vendorId, marketId, customResponses }
router.post("/", requireAuth, async (req, res) => {
  const { vendorId, marketId, customResponses } = req.body as {
    vendorId: string;
    marketId: string;
    customResponses: { question: string; answer: string }[];
  };

  if (!vendorId || !marketId) {
    return res.status(400).json({ error: "vendorId and marketId are required" });
  }

  try {
    if (!(await ownsListing(req.user!.uid, "vendors", vendorId))) {
      return res.status(403).json({ error: "You can only apply with your own vendor profile." });
    }

    const now = new Date();
    const newApplication = {
      vendorId,
      marketId,
      customResponses: Array.isArray(customResponses) ? customResponses : [],
      status: "pending",
      date: now.toISOString().split("T")[0], // YYYY-MM-DD like your mock
      createdAt: now.getTime()
    };

    const docRef = await db.collection("applications").add(newApplication);
    res.json({ id: docRef.id, ...newApplication });
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ error: "Failed to create application" });
  }
});

// PATCH /applications/:id → the receiving market's owner sets approved/rejected.
// Admins may update any field.
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = db.collection("applications").doc(id);
    const existing = await docRef.get();
    if (!existing.exists) {
      return res.status(404).json({ error: "Application not found" });
    }

    let updates = (req.body ?? {}) as Record<string, unknown>;
    if (!(await isAdminUser(req.user!.uid))) {
      if (!(await ownsListing(req.user!.uid, "markets", existing.data()?.marketId))) {
        return res.status(403).json({ error: "Only the market that received this application can update it." });
      }
      if (updates.status !== "approved" && updates.status !== "rejected") {
        return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
      }
      updates = { status: updates.status };
    }

    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating application:", err);
    res.status(500).json({ error: "Failed to update application" });
  }
});

export default router;
