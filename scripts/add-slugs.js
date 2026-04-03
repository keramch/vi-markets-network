/**
 * add-slugs.js
 *
 * One-time migration: add a `slug` field to every market and vendor document
 * in Firestore that does not already have one.
 *
 * Prerequisites:
 *   1. Set the FIREBASE_SERVICE_ACCOUNT env var to the JSON contents of your
 *      Firebase service-account key file, e.g.:
 *        export FIREBASE_SERVICE_ACCOUNT=$(cat path/to/serviceAccountKey.json)
 *   2. Run from the project root:
 *        node scripts/add-slugs.js
 *
 * The script is idempotent — documents that already have a `slug` are skipped.
 */

import admin from "firebase-admin";

// ── Firebase init ─────────────────────────────────────────────────────────────

if (!admin.apps.length) {
  const rawEnv = process.env.FIREBASE_SERVICE_ACCOUNT || "{}";
  const serviceAccount = JSON.parse(rawEnv);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();

// ── Slug helpers ──────────────────────────────────────────────────────────────

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(name, col, existingSlugs) {
  const base = slugify(name);
  let candidate = base;
  let suffix = 2;

  while (existingSlugs.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }

  return candidate;
}

// ── Migration ─────────────────────────────────────────────────────────────────

async function migrateCollection(colName) {
  console.log(`\n── ${colName} ────────────────────────────────`);
  const snap = await db.collection(colName).get();

  // Build a set of slugs that already exist so we can guarantee uniqueness
  // without hitting Firestore on every collision check.
  const existingSlugs = new Set(
    snap.docs.map((doc) => doc.data().slug).filter(Boolean),
  );

  let skipped = 0;
  let updated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    if (data.slug) {
      skipped++;
      continue;
    }

    if (!data.name) {
      console.warn(`  SKIP  ${doc.id}  — no name field`);
      skipped++;
      continue;
    }

    const slug = await generateUniqueSlug(data.name, colName, existingSlugs);
    existingSlugs.add(slug); // reserve it for the rest of this batch

    await db.collection(colName).doc(doc.id).update({ slug });
    console.log(`  UPDATED  ${doc.id}  "${data.name}"  →  ${slug}`);
    updated++;
  }

  console.log(`  Done: ${updated} updated, ${skipped} skipped.`);
}

async function main() {
  console.log("Starting slug migration…");
  await migrateCollection("markets");
  await migrateCollection("vendors");
  console.log("\nMigration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
