/**
 * backend/scripts/createTestManager.ts
 *
 * Creates a test market manager account for testing organizer calendar features.
 *
 * What it does:
 *  1. Lists the first market page found in Firestore so you can confirm the ID
 *  2. Creates a Firebase Auth user: testmanager@test.com / Test1234!
 *  3. Creates a Firestore `users` doc linked to that market page via `ownedMarketId`
 *  4. Sets `organizerUid` on the market page doc to this user's UID
 *
 * Safe to re-run: if the Auth user already exists it updates the password instead.
 *
 * Run from the `backend` directory:
 *   npx ts-node scripts/createTestManager.ts
 *
 * To target a specific market, set the MARKET_ID env var:
 *   MARKET_ID=abc123 npx ts-node scripts/createTestManager.ts
 */

import { db, auth } from "../src/firebase";

const TEST_EMAIL    = process.env.EMAIL    ?? "testmanager@test.com";
const TEST_PASSWORD = process.env.PASSWORD ?? "Test1234!";

async function run() {
  // ── 1. Resolve market page ID ──────────────────────────────────────────────
  let marketId = process.env.MARKET_ID ?? "";

  if (!marketId) {
    const snap = await db.collection("markets").limit(1).get();
    if (snap.empty) {
      console.error("No markets found in Firestore. Create a market first, or pass MARKET_ID=<id>.");
      process.exit(1);
    }
    marketId = snap.docs[0].id;
    const marketName = (snap.docs[0].data().name as string) ?? "(unnamed)";
    console.log(`Using first market found: "${marketName}" (${marketId})`);
  } else {
    const doc = await db.collection("markets").doc(marketId).get();
    if (!doc.exists) {
      console.error(`Market ${marketId} not found.`);
      process.exit(1);
    }
    console.log(`Using market: "${doc.data()?.name}" (${marketId})`);
  }

  // ── 2. Create (or update) Firebase Auth user ───────────────────────────────
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(TEST_EMAIL);
    uid = existing.uid;
    await auth.updateUser(uid, { password: TEST_PASSWORD });
    console.log(`Auth user already existed — password reset. UID: ${uid}`);
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      const created = await auth.createUser({
        email:         TEST_EMAIL,
        password:      TEST_PASSWORD,
        emailVerified: true,
        displayName:   "Test Manager",
      });
      uid = created.uid;
      console.log(`Auth user created. UID: ${uid}`);
    } else {
      throw err;
    }
  }

  // ── 3. Create / update Firestore user doc ──────────────────────────────────
  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    await userRef.set({ ownedMarketId: marketId, userType: "organizer" }, { merge: true });
    console.log("Firestore user doc updated.");
  } else {
    await userRef.set({
      email:          TEST_EMAIL,
      membership:     "free",
      userType:       "organizer",
      ownedMarketId:  marketId,
      postalCode:     "V8W 1A1",
      isFoundingMember: false,
      autoRenew:      false,
    });
    console.log("Firestore user doc created.");
  }

  // ── 4. Stamp organizerUid on the market page ───────────────────────────────
  await db.collection("markets").doc(marketId).set(
    { organizerUid: uid, updatedAt: new Date().toISOString() },
    { merge: true }
  );
  console.log(`Market page updated with organizerUid: ${uid}`);

  console.log("\n✓ Done. Test credentials:");
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Password: ${TEST_PASSWORD}`);
  console.log(`  Market:   ${marketId}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
