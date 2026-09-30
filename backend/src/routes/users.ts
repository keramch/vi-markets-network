import { Router } from "express";
import { db, auth } from "../firebase";
import { requireAuth, requireAdmin, isAdminUser } from "../middleware/auth";

const router = Router();

// Fields a member may change on their own users doc. Everything else
// (isAdmin, subscription, email, ownedMarketId, ...) is admin-only.
const SELF_EDITABLE_USER_FIELDS = new Set([
  "firstName",
  "lastName",
  "displayName",
  "city",
  "postalCode",
  "notificationSettings",
  "autoRenew",
]);

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

// GET /users → return all users (admin only — contains every member's email)
router.get("/", requireAdmin, async (_req, res) => {
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

// ── Shared member creation ────────────────────────────────────────────────────
// Used by both email/password signup (/register) and social sign-in signup
// (/register-oauth). Writes the users doc, the vendor or market profile, and
// syncs the contact to Brevo. The Firebase Auth user must already exist.

type AccountType = "vendor" | "market" | "community";

interface MemberProfileInput {
  firstName: string;
  lastName: string;
  accountType: AccountType;
  businessName?: string;
  city?: string;
  description?: string;
  plan?: string;
  vendorTypes?: string[];
  categories?: string[];
  tags?: string[];
  marketCategories?: string[];
  newsletterOptIn?: boolean;
}

async function createMemberRecords(
  userId: string,
  email: string,
  input: MemberProfileInput,
  authProvider: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const {
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
  } = input;
  const emailLower = email.toLowerCase();

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
      termEnds: null,
      introRate: false,
      stripeCustomerId: null,
      stripePaymentId: null,
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
    authProvider,
    createdAt: Date.now(),
  };

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
        return { status: 200, body: { id: userId, ...userDoc.data(), ownedMarketId: existingMarket.docs[0].id } };
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
        return { status: 200, body: { id: userId, ...userDoc.data(), ownedVendorId: existingVendor.docs[0].id } };
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
        attendingMarkets: [],
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

  // ── Brevo contact sync ──────────────────────────────────────────────────────
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
  // ── End Brevo sync ──────────────────────────────────────────────────────────

  return {
    status: 201,
    body: {
      id: userId,
      ...newUser,
      ownedMarketId,
      ownedVendorId,
    },
  };
}

// POST /users/register → create a new user account from the signup wizard
router.post("/register", async (req, res) => {
  const { email, password, ...profile } = req.body as MemberProfileInput & {
    email: string;
    password: string;
  };
  const { firstName, lastName, accountType } = profile;

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
      // Never return the existing record — the caller hasn't proven they own it
      return res.status(409).json({
        error: "An account with this email already exists. Try logging in instead.",
        field: "email",
      });
    }

    // Create Firebase Auth user and use its UID as the Firestore document ID
    const firebaseUser = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    const result = await createMemberRecords(firebaseUser.uid, email, profile, "password");
    return res.status(result.status).json(result.body);
  } catch (err) {
    const code = (err as { code?: string })?.code;
    const message = err instanceof Error ? err.message : String(err);

    // Firebase password policy (set in Firebase Console): min 8 chars + 1 special character
    if (message.includes("PASSWORD_DOES_NOT_MEET_REQUIREMENTS")) {
      return res.status(400).json({
        error: "Your password needs at least 8 characters, including at least one special character (like ! @ # $). Please choose a different password and try again.",
        field: "password",
      });
    }
    if (code === "auth/email-already-exists") {
      return res.status(409).json({
        error: "An account with this email already exists. Try logging in instead.",
        field: "email",
      });
    }

    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// POST /users/register-oauth → create the member profile for someone who has
// already signed in with a social provider (Google). Identity (uid + email)
// comes ONLY from the verified Firebase ID token, never from the request body.
// If the member already has a profile, it is returned unchanged (status 200).
router.post("/register-oauth", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Please sign in again and retry." });
  }

  let decoded: Awaited<ReturnType<typeof auth.verifyIdToken>>;
  try {
    decoded = await auth.verifyIdToken(authHeader.split("Bearer ")[1]);
  } catch {
    return res.status(401).json({ error: "Please sign in again and retry." });
  }

  const provider = decoded.firebase?.sign_in_provider ?? "";
  const email = decoded.email;
  if (provider === "password") {
    return res.status(400).json({ error: "Use the email signup form for email and password accounts." });
  }
  if (!email || decoded.email_verified !== true) {
    return res.status(400).json({
      error: "We couldn't get a verified email address from that sign-in. Please sign up with your email instead.",
      field: "email",
    });
  }

  const body = (req.body ?? {}) as Partial<MemberProfileInput>;
  const accountType = body.accountType;
  if (accountType !== "vendor" && accountType !== "market" && accountType !== "community") {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (accountType !== "community" && !body.businessName?.trim()) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Names: prefer what the member typed, fall back to their provider profile name
  const [tokenFirst = "", ...tokenRest] = (decoded.name ?? "").trim().split(/\s+/);
  const firstName = body.firstName?.trim() || tokenFirst || "Member";
  const lastName = body.lastName?.trim() || tokenRest.join(" ");

  try {
    // Already has a profile → return it (they're an existing member)
    const byUid = await db.collection("users").doc(decoded.uid).get();
    if (byUid.exists) {
      return res.status(200).json({ id: byUid.id, ...byUid.data() });
    }

    // A different account already uses this email
    const byEmail = await db
      .collection("users")
      .where("emailLower", "==", email.toLowerCase())
      .limit(1)
      .get();
    if (!byEmail.empty) {
      return res.status(409).json({
        error: "An account with this email already exists. Try logging in with your email and password instead.",
        field: "email",
      });
    }

    const result = await createMemberRecords(
      decoded.uid,
      email,
      {
        firstName,
        lastName,
        accountType,
        businessName: body.businessName?.trim(),
        city: body.city,
        description: body.description,
        vendorTypes: body.vendorTypes,
        marketCategories: body.marketCategories,
        newsletterOptIn: body.newsletterOptIn,
      },
      provider,
    );
    return res.status(result.status).json(result.body);
  } catch (err) {
    console.error("Register (oauth) error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// PATCH /users/:id → update user (notifications, city, etc.)
// Members can edit only their own doc and only SELF_EDITABLE_USER_FIELDS.
// Admins can edit any user and any field (e.g. founding member toggle).
router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const updates = (req.body ?? {}) as Record<string, unknown>;

  try {
    const callerIsAdmin = await isAdminUser(req.user!.uid);
    if (!callerIsAdmin) {
      if (req.user!.uid !== id) {
        return res.status(403).json({ error: "You can only update your own account." });
      }
      const blocked = Object.keys(updates).filter(key => !SELF_EDITABLE_USER_FIELDS.has(key));
      if (blocked.length > 0) {
        return res.status(403).json({ error: `These fields can't be changed: ${blocked.join(", ")}` });
      }
    }

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
