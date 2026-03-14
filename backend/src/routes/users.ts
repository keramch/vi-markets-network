import { Router } from "express";
import { db, auth } from "../firebase";

const router = Router();

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
  const { email, password, firstName, lastName, accountType, businessName, city, description, plan } = req.body as {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    accountType: "vendor" | "market";
    businessName: string;
    city: string;
    description?: string;
    plan?: string;
  };

  if (!email || !password || !firstName || !lastName || !accountType || !businessName || !city) {
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
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const newUser = {
      email,
      emailLower,
      postalCode: "",
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      membership: "free",
      ownedMarketId: "",
      ownedVendorId: "",
      isAdmin: false,
      isFoundingMember: plan === "founding",
      autoRenew: false,
      accountType,
      businessName,
      city,
      description: description || "",
      selectedPlan: plan || "free",
      notificationSettings: {
        favoriteMarket: true,
        favoriteVendor: true,
        nearbyMarket: false,
      },
      createdAt: Date.now(),
    };

    // Create Firebase Auth user (enables signInWithEmailAndPassword on the client)
    await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Create the user document first
    const userRef = await db.collection("users").add(newUser);
    const userId = userRef.id;

    // Create the vendor or market profile document
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let ownedMarketId = "";
    let ownedVendorId = "";

    if (accountType === "market") {
      const marketDoc = {
        ownerId: userId,
        name: businessName,
        description: description || "",
        category: "Farmers Market",
        photos: [],
        contact: { email },
        location: {
          address: city,
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
      const vendorDoc = {
        ownerId: userId,
        name: businessName,
        description: description || "",
        category: "Artisan & Crafts",
        photos: [],
        contact: { email },
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

    // Update the user document with the new profile ID
    await userRef.update({ ownedMarketId, ownedVendorId });

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
