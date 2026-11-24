/**
 * backend/scripts/inventory.ts — READ-ONLY.
 *
 * Counts documents and field shapes in every collection, so a data change can
 * be planned against what is really stored. Prints counts and field names
 * only: never names, emails or other personal details. Writes nothing.
 *
 * Run from `backend` (PowerShell):
 *   $env:FIREBASE_SERVICE_ACCOUNT = Get-Content serviceAccountKey.json -Raw
 *   npx ts-node scripts/inventory.ts
 */
import { db } from "../src/firebase";

const COLLECTIONS = [
  "users", "markets", "vendors", "marketEvents", "reviews", "follows", "applications",
  "organizerAccounts", "marketApplications", "vendorApplications",
];

// Values worth seeing in full: small fixed sets, never personal data
const ENUM_FIELDS = new Set([
  "accountType", "status", "type", "targetType", "entityType", "userType", "role",
  "schedule.recurrenceFrequency",
]);

function walk(obj: any, prefix: string, keys: Map<string, number>, enums: Map<string, Map<string, number>>) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const path = prefix ? `${prefix}.${k}` : k;
    keys.set(path, (keys.get(path) ?? 0) + 1);
    if (ENUM_FIELDS.has(path) && (typeof v === "string" || typeof v === "boolean")) {
      const m = enums.get(path) ?? new Map();
      m.set(String(v), (m.get(String(v)) ?? 0) + 1);
      enums.set(path, m);
    }
    // One level into plain objects (schedule, location, subscription…), not arrays
    if (v && typeof v === "object" && !Array.isArray(v) && !prefix) walk(v, path, keys, enums);
  }
}

async function run() {
  for (const name of COLLECTIONS) {
    const snap = await db.collection(name).get();
    const keys = new Map<string, number>();
    const enums = new Map<string, Map<string, number>>();
    snap.docs.forEach(d => walk(d.data(), "", keys, enums));
    console.log(`\n## ${name}: ${snap.size} docs`);
    console.log("fields: " + [...keys].sort().map(([k, n]) => `${k}(${n})`).join(", "));
    for (const [f, m] of enums) console.log(`  ${f}: ` + [...m].map(([v, n]) => `${v}=${n}`).join(", "));
  }
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
