import { Router } from "express";
import { db, auth } from "../firebase";

const router = Router();

// ── Slug helpers ──────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(
  name: string,
  col: 'markets' | 'vendors',
): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;
  while (true) {
    const snap = await db.collection(col).where('slug', '==', candidate).limit(1).get();
    if (snap.empty) return candidate;
    candidate = `${base}-${suffix}`;
    suffix++;
  }
}

// GET /users → return all users
router.get("/", async (_req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /users/register → create a new user account from the signup wizard
router.post("/register", async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    accountType,
    businessName,
    city,
    description,
    plan,
    vendorTypes,
    categories,
    tags,
    marketCategories,
    newsletterOptIn,
  } = req.body as {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    accountType: "vendor" | "market" | "community";
    businessName?: string;
    city?: string;
    description?: string;
    plan?: string;
    vendorTypes?: string[];
    categories?: string[];
    tags?: string[];
    marketCategories?: string[];
    newsletterOptIn?: boolean;
  };

  if (!email || !password || !firstName || !lastName || !accountType) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const emailLower = email.toLowerCase();

    // Prevent duplicate accounts
    const existing = await db
      .collection("users")
      .where("emailLower", "==", emailLower)
      .limit(1)
      .get();
    if (!existing.empty) {
      const existingDoc = existing.docs[0];
      return res.status(200).json({ id: existingDoc.id, ...existingDoc.data() });
    }

    const newUser = {
      email,
      emailLower,
      postalCode: "",
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      subscription: {
        tier: "free",
        billingCycle: null,
        foundingMember: false,
      },
      ownedMarketId: "",
      ownedVendorId: "",
      isAdmin: false,
      autoRenew: false,
      accountType,
      businessName: businessName ?? '',
      city: city ?? '',
      description: description || "",
      notificationSettings: {
        favoriteMarket: true,
        favoriteVendor: true,
        nearbyMarket: false,
      },
      createdAt: Date.now(),
    };

    // Create Firebase Auth user and use its UID as the Firestore document ID
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    const userId = firebaseUser.uid;
    await db.collection("users").doc(userId).set(newUser);

    // Create the vendor or market profile document
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let ownedMarketId = "";
    let ownedVendorId = "";

    if (accountType !== "community") {
      if (accountType === "market") {
        const existingMarket = await db.collection("markets").where("ownerId", "==", userId).limit(1).get();
        if (!existingMarket.empty) {
          const userDoc = await db.collection("users").doc(userId).get();
          return res.status(200).json({ id: userId, ...userDoc.data(), ownedMarketId: existingMarket.docs[0].id });
        }
        const slug = await generateUniqueSlug(businessName!, "markets");
        const marketDoc = {
          ownerId: userId,
          name: businessName,
          slug,
          description: description || "",
          marketTypes: marketCategories || [],
          photos: [],
          contact: { email },
          location: {
            address: city ?? '',
            coordinates: { lat: 0, lng: 0 },
          },
          schedule: { rules: [] },
          vendorIds: [],
          reviews: [],
          isFeatured: false,
          joinDate: today,
          status: "active",
        };
        const marketRef = await db.collection("markets").add(marketDoc);
        ownedMarketId = marketRef.id;
      } else {
        const existingVendor = await db.collection("vendors").where("ownerId", "==", userId).limit(1).get();
        if (!existingVendor.empty) {
          const userDoc = await db.collection("users").doc(userId).get();
          return res.status(200).json({ id: userId, ...userDoc.data(), ownedVendorId: existingVendor.docs[0].id });
        }
        const slug = await generateUniqueSlug(businessName!, "vendors");
        const vendorDoc = {
          ownerId: userId,
          name: businessName,
          slug,
          description: description || "",
          category: "Artisan & Crafts",
          photos: [],
          contact: { email },
          vendorTypes: vendorTypes || [],
          categories: categories || [],
          tags: tags || [],
          priceRange: "moderate",
          attendingMarketIds: [],
          reviews: [],
          isFeatured: false,
          joinDate: today,
          status: "active",
        };
        const vendorRef = await db.collection("vendors").add(vendorDoc);
        ownedVendorId = vendorRef.id;
      }
    }

    // Update the user document with the new profile ID
    await db.collection("users").doc(userId).update({ ownedMarketId, ownedVendorId });

    // ── Brevo contact sync ────────────────────────────────────────────────────
    if (newsletterOptIn !== false) {
      try {
        const brevoListId = parseInt(process.env.BREVO_LIST_ID ?? "");
        if (!isNaN(brevoListId)) {
          const brevoAttributes: Record<string, string | boolean> = {
            FIRSTNAME: firstName,
            LASTNAME: lastName,
            CITY: city ?? '',
            MEMBERTYPE: accountType === "vendor" ? "Vendor" : accountType === "market" ? "Market" : "Community",
            IS_MEMBER: true,
            SUBSCRIPTION_TIER: plan ?? "free",
            FOUNDING_MEMBER: false,
          };

          if (businessName) brevoAttributes.BUSINESSNAME = businessName;

          if (accountType === "vendor" && vendorTypes && vendorTypes.length > 0) {
            brevoAttributes.VENDOR_TYPES = vendorTypes.join("|");
          }
          if (accountType === "market" && marketCategories && marketCategories.length > 0) {
            brevoAttributes.MARKET_TYPES = marketCategories.join("|");
          }

          const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api-key": process.env.BREVO_API_KEY ?? "",
            },
            body: JSON.stringify({
              email,
              attributes: brevoAttributes,
              listIds: [brevoListId],
              updateEnabled: true,
            }),
          });

          if (!brevoResponse.ok) {
            const errorBody = await brevoResponse.text();
            console.error("Brevo sync error during registration:", brevoResponse.status, errorBody);
          }
        } else {
          console.warn("BREVO_LIST_ID not set -- skipping Brevo sync");
        }
      } catch (brevoErr) {
        console.error("Brevo sync failed (non-fatal):", brevoErr);
      }
    }
    // ── End Brevo sync ────────────────────────────────────────────────────────

    return res.status(201).json({
      id: userId,
      ...newUser,
      ownedMarketId,
      ownedVendorId,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// PATCH /users/:id → update user (for membership, notifications, etc.)
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const docRef = db.collection("users").doc(id);
    await docRef.set(updates, { merge: true });
    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
