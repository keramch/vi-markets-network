/**
 * backend/scripts/markets-stage1.ts — T128, stage 1 of the markets/organizers rebuild.
 * Plan: docs/markets-stage1-spec.md.
 *
 * Today `markets` holds organizer profiles and `marketEvents` holds markets.
 * Afterwards `organizers` holds organizer profiles and `markets` holds markets
 * (events, plus the unclaimed "markets" vendors added, converted to markets).
 *
 * Modes (run from `backend`, PowerShell):
 *   $env:FIREBASE_SERVICE_ACCOUNT = Get-Content serviceAccountKey.json -Raw
 *   npx ts-node scripts/markets-stage1.ts            → dry run: READS ONLY
 *   npx ts-node scripts/markets-stage1.ts --apply    → backup, then convert
 *   npx ts-node scripts/markets-stage1.ts --undo     → restore from the backup
 *
 * The dry run writes a report and every converted record to
 * backend/stage1-output/ (git-ignored: it holds member data). --apply and
 * --undo also need CONFIRM=yes in the environment, so neither runs by accident.
 */
import * as fs from "fs";
import * as path from "path";
import { db } from "../src/firebase";
import { slugify, firstFreeSlug } from "../src/utils/slug";
import { syncMemberIfVerified } from "../src/utils/brevoSync";

type Doc = Record<string, any> & { id: string };
type Col = "organizers" | "markets" | "users" | "follows" | "reviews" | "vendors" | "applications";

// Collections the conversion writes to; each is backed up first
const TOUCHED = ["markets", "marketEvents", "users", "follows", "reviews", "vendors", "applications"] as const;
const BACKUP_PREFIX = "stage1Backup_";
const OUT_DIR = path.join(__dirname, "..", "stage1-output");

const mode = process.argv.includes("--apply") ? "apply" : process.argv.includes("--undo") ? "undo" : "dry-run";

// ── helpers ─────────────────────────────────────────────────────────────────

const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" }); // YYYY-MM-DD
const isDate = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const tidyName = (s: string) => String(s ?? "").replace(/\s+/g, " ").trim();
const norm = (s: string) => tidyName(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

async function readAll(name: string): Promise<Doc[]> {
  const snap = await db.collection(name).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

const withoutId = ({ id, ...rest }: Doc) => rest;

// A repeating series that starts and ends within one week: its actual days
// (mirrors shortSeriesRange in frontend/utils.ts), else null
function shortSeriesDays(schedule: Record<string, any>): string[] | null {
  const { startDate, endDate } = schedule;
  const days: number[] = schedule.recurrenceDays ?? [];
  if (!isDate(startDate) || !isDate(endDate)) return null;
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const span = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (span < 0 || span > 6) return null;
  const out: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (days.includes(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
  }
  return out.length ? out : null;
}

// ── the plan: every write, worked out from a read of the live data ──────────

interface Write { col: Col; id: string; data: Record<string, any>; note: string }

async function plan() {
  const [oldMarkets, events, users, follows, reviews, vendors, applications] = await Promise.all(
    ["markets", "marketEvents", "users", "follows", "reviews", "vendors", "applications"].map(readAll)
  );

  const writes: Write[] = [];
  const report: string[] = [];
  const problems: string[] = [];
  const say = (s = "") => report.push(s);

  const adminUids = new Set(users.filter(u => u.isAdmin).map(u => u.id));
  const organizerDocs = oldMarkets.filter(m => m.status !== "unclaimed");
  const unclaimedDocs = oldMarkets.filter(m => m.status === "unclaimed");
  const organizerById = new Map(organizerDocs.map(o => [o.id, o]));
  // The "Vi Markets Guide Admin" page: owned by an admin, not a real organizer (T036)
  const adminPageIds = new Set(organizerDocs.filter(o => o.ownerId && adminUids.has(o.ownerId)).map(o => o.id));

  // Same document ID across the two old collections would make two markets collide
  const eventIds = new Set(events.map(e => e.id));
  for (const m of unclaimedDocs) if (eventIds.has(m.id)) problems.push(`ID clash: unclaimed market ${m.id} and an event share an ID`);

  // ── 1. organizers ─────────────────────────────────────────────────────────
  say("## Organizers (copied from today's market profiles)");
  for (const o of organizerDocs) {
    const isAdminPage = adminPageIds.has(o.id);
    const data = { ...withoutId(o), ...(isAdminPage ? { status: "archived", hiddenReason: "admin page (T036)" } : {}) };
    writes.push({ col: "organizers", id: o.id, data, note: o.name });
    say(`- ${o.name}${isAdminPage ? " — HIDDEN (admin page)" : ""} → /organizers/${o.slug ?? "(no web address yet)"}`);
  }

  // ── 2. markets ────────────────────────────────────────────────────────────
  // Web addresses are unique across all markets now. Published markets pick first,
  // so they keep the address closest to their name.
  const takenSlugs = new Set<string>();
  const pickSlug = (preferred: string | undefined, name: string) => {
    const base = (preferred && slugify(preferred)) || slugify(name) || "market";
    const s = firstFreeSlug(base, takenSlugs);
    takenSlugs.add(s);
    return s;
  };

  const newMarkets: Doc[] = [];
  const statusRank: Record<string, number> = { published: 0, draft: 1, cancelled: 2, archived: 3 };
  const sortedEvents = [...events].sort((a, b) => (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9));

  say("");
  say("## Markets from today's events");
  for (const e of sortedEvents) {
    // Kera, Nov 23: every draft on the admin page was a test. Left out (still in the backup).
    if (adminPageIds.has(e.marketPageId) && e.status === "draft") {
      say(`- ${e.name} [draft, admin page test] → LEFT OUT`);
      continue;
    }
    const org = organizerById.get(e.marketPageId);
    const unclaimed = !org || adminPageIds.has(e.marketPageId);
    const { marketPageId, ...rest } = withoutId(e);
    const schedule = { ...(e.schedule ?? {}) };
    let type = e.type;
    // One-time becomes "on these dates", a list of one; other remembered fields are kept (T094)
    if (e.type === "oneTime") {
      type = "dates";
      schedule.dates = isDate(schedule.date) ? [schedule.date] : [];
    } else if (e.type !== "oneTime") {
      // The T015 workaround: "repeats" within one week was really a few set days
      const days = shortSeriesDays(schedule);
      if (days) {
        type = "dates";
        schedule.dates = days;
        say(`  (${tidyName(e.name)}: a series within one week, stored as the dates ${days.join(", ")})`);
      }
    }
    const slug = pickSlug(e.slug, e.name);
    // Old links used the event's slug, or its ID before slugs existed (T013)
    const legacyPaths = org?.slug ? [...new Set([e.slug, e.id].filter(Boolean).map(x => `${org.slug}/${x}`))] : [];
    const market = {
      ...rest,
      name: tidyName(e.name),
      type,
      schedule,
      organizerId: unclaimed ? null : e.marketPageId,
      slug,
      legacyPaths,
      addedBy: { uid: e.organizerUid ?? null },
      id: e.id,
    };
    newMarkets.push(market);
    if (!org && e.marketPageId) problems.push(`Event "${e.name}" points at a missing profile ${e.marketPageId}`);
    say(`- ${market.name} [${e.status}] → /markets/${slug}` +
      (unclaimed ? " — UNCLAIMED" + (org ? ` (was on ${org.name})` : "") : ` — organizer: ${org!.name}`) +
      (legacyPaths.length ? ` · old link /markets/${legacyPaths[0]} forwards here` : ""));
  }

  say("");
  say("## Markets from unclaimed listings (same ID, so vendors' links keep working)");
  for (const m of [...unclaimedDocs].sort((a, b) => a.name.localeCompare(b.name))) {
    const links = vendors.flatMap(v => (v.attendingMarkets ?? []).filter((a: any) => a.marketId === m.id).map((a: any) => ({ v, date: a.date })));
    const dates = [...new Set(links.map(l => l.date).filter(isDate))].sort();
    const adder = vendors.find(v => (m.vendorIds ?? [])[0] === v.id) ?? links[0]?.v;
    const slug = pickSlug(m.slug, m.name);
    const market = {
      name: tidyName(m.name),
      type: "dates",
      schedule: { dates, startTime: "", endTime: "" },
      dateSources: Object.fromEntries(dates.map(d => [d, "vendor"])),
      location: {
        venueName: "",
        address: tidyName(m.location?.address ?? ""),
        city: tidyName(m.location?.city ?? ""),
        province: "BC",
      },
      marketType: m.marketTypes ?? [],
      marketTags: [],
      exceptions: [],
      photos: m.photos ?? [],
      ...(m.description ? { description: m.description } : {}),
      ...(m.logoUrl ? { logoUrl: m.logoUrl } : {}),
      ...(m.contact?.website ? { externalEventUrl: m.contact.website } : {}),
      status: "published",
      organizerId: null,
      slug,
      legacyPaths: m.slug && m.slug !== slug ? [m.slug] : [],
      addedBy: { vendorId: adder?.id ?? null, uid: adder?.ownerId ?? null },
      createdAt: m.joinDate ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      id: m.id,
    };
    newMarkets.push(market);
    const upcoming = dates.filter(d => d >= today);
    say(`- ${market.name} (${market.location.city || "no town"}) → /markets/${slug} · ` +
      (dates.length ? `dates ${dates.join(", ")}${upcoming.length ? "" : " (all past)"}` : "no dates yet") +
      ` · added by ${adder?.name ?? "HQ"}`);
  }

  for (const m of newMarkets) writes.push({ col: "markets", id: m.id, data: withoutId(m), note: m.name });

  // ── duplicates: merge only on an exact name + dates + town match ─────────
  say("");
  say("## Possible duplicates (nothing is merged automatically)");
  let dupes = 0;
  for (let i = 0; i < newMarkets.length; i++) for (let j = i + 1; j < newMarkets.length; j++) {
    const a = newMarkets[i], b = newMarkets[j];
    const na = norm(a.name), nb = norm(b.name);
    const exact = na === nb && norm(a.location?.city ?? "") === norm(b.location?.city ?? "")
      && JSON.stringify(a.schedule?.dates ?? []) === JSON.stringify(b.schedule?.dates ?? []);
    const near = na === nb || (Math.min(na.length, nb.length) >= 6 && (na.includes(nb) || nb.includes(na)));
    if (exact) { problems.push(`Exact duplicate: "${a.name}" and "${b.name}" — handle by hand before applying`); dupes++; }
    else if (near) { say(`- "${a.name}" (${a.location?.city || "?"}) and "${b.name}" (${b.location?.city || "?"}): kept separate`); dupes++; }
  }
  if (!dupes) say("- none");

  // Which market an organizer's saves/reviews/vendor links move to: its only market, if it has exactly one
  const marketsOf = (orgId: string) => newMarkets.filter(m =>
    (m.organizerId === orgId || (adminPageIds.has(orgId) && events.find(e => e.id === m.id)?.marketPageId === orgId))
    && m.status !== "archived");
  const onlyMarket = (orgId: string) => { const ms = marketsOf(orgId); return ms.length === 1 ? ms[0] : null; };
  const marketIds = new Set(newMarkets.map(m => m.id));

  // ── 3. saves (follows) ──────────────────────────────────────────────────
  say("");
  say("## Saves");
  for (const f of follows.filter(f => f.targetType === "market")) {
    if (marketIds.has(f.targetId)) { say(`- save on ${newMarkets.find(m => m.id === f.targetId)!.name}: unchanged (same ID)`); continue; }
    const org = organizerById.get(f.targetId);
    if (!org) { problems.push(`Save ${f.id} points at a missing market ${f.targetId}`); continue; }
    const to = onlyMarket(org.id);
    if (to) {
      writes.push({ col: "follows", id: f.id, data: { ...withoutId(f), targetId: to.id, targetType: "market" }, note: `save → ${to.name}` });
      say(`- save on ${org.name} → moves to the market ${to.name}`);
    } else {
      writes.push({ col: "follows", id: f.id, data: { ...withoutId(f), targetType: "organizer" }, note: `save → follow ${org.name}` });
      say(`- save on ${org.name} → becomes a follow of the organizer (${marketsOf(org.id).length} markets)`);
    }
  }

  // ── 4. reviews ──────────────────────────────────────────────────────────
  say("");
  say("## Reviews");
  for (const r of reviews.filter(r => r.entityType === "market")) {
    if (marketIds.has(r.entityId)) { say(`- ${r.status} review: unchanged (same ID)`); continue; }
    const org = organizerById.get(r.entityId);
    if (!org) { problems.push(`Review ${r.id} points at a missing market ${r.entityId}`); continue; }
    const to = onlyMarket(org.id);
    if (to) {
      writes.push({ col: "reviews", id: r.id, data: { ...withoutId(r), entityId: to.id }, note: `review → ${to.name}` });
      say(`- ${r.status} review of ${org.name} → moves to the market ${to.name}`);
    } else {
      writes.push({ col: "reviews", id: r.id, data: { ...withoutId(r), entityType: "organizer" }, note: `review → organizer ${org.name}` });
      say(`- ${r.status} review of ${org.name} → stays with the organizer`);
    }
  }

  // ── 5. vendors' "Find us at" links ───────────────────────────────────────
  say("");
  say("## Vendor links (Find us at)");
  // Links to markets Kera deleted in HQ before stage 1 (T133), decided Nov 23:
  // the deleted River City duplicate's link moves to the River City market kept;
  // the deleted test market's link is dropped.
  const riverCity = newMarkets.find(m => norm(m.name) === norm("River City Christmas Market"));
  const DELETED_MOVES: Record<string, string | null> = {
    Ikl04feE9OXk94DxmSnV: riverCity?.id ?? null, // River City duplicate
    GyOK0pGBvzjkIB4f65e1: null,                  // "Winter Bazaar In My Dreams" test
  };
  for (const v of vendors) {
    const list: any[] = v.attendingMarkets ?? [];
    let changed = false;
    const next = list.flatMap(a => {
      if (marketIds.has(a.marketId)) return [a];
      if (a.marketId in DELETED_MOVES) {
        changed = true;
        const to = DELETED_MOVES[a.marketId];
        if (!to) { say(`- ${v.name} on ${a.date}: link to a deleted test market removed`); return []; }
        say(`- ${v.name} on ${a.date}: link to the deleted duplicate → ${riverCity!.name}`);
        return [{ ...a, marketId: to }];
      }
      const org = organizerById.get(a.marketId);
      if (!org) { problems.push(`${v.name} links to a missing market ${a.marketId} (${a.date}): left as is, sorted in stage 3`); return [a]; }
      const to = onlyMarket(org.id);
      if (!to) { say(`- ${v.name} at ${org.name} on ${a.date}: organizer has ${marketsOf(org.id).length} markets — left for stage 3`); return [a]; }
      changed = true;
      say(`- ${v.name} at ${org.name} on ${a.date} → ${to.name}`);
      return [{ ...a, marketId: to.id }];
    });
    if (changed) writes.push({ col: "vendors", id: v.id, data: { ...withoutId(v), attendingMarkets: next }, note: v.name });
  }

  // ── 6. users and applications: renamed fields ───────────────────────────
  let userChanges = 0;
  for (const u of users) {
    const data = { ...withoutId(u), ownedOrganizerId: u.ownedMarketId ?? null } as Record<string, any>;
    delete data.ownedMarketId;
    if (u.accountType === "market") data.accountType = "organizer";
    writes.push({ col: "users", id: u.id, data, note: "rename fields" });
    if (u.ownedMarketId || u.accountType === "market") userChanges++;
  }
  for (const a of applications) {
    const data = { ...withoutId(a), organizerId: a.marketId ?? null } as Record<string, any>;
    delete data.marketId;
    writes.push({ col: "applications", id: a.id, data, note: "rename marketId" });
  }
  say("");
  say("## Members and applications");
  say(`- ${users.length} member records get the renamed fields (ownedMarketId → ownedOrganizerId; account type "market" → "organizer"); ${userChanges} of them are organizers.`);
  say(`- ${applications.length} application(s): marketId → organizerId.`);
  say(`- Brevo: ${users.filter(u => u.accountType === "market").length} organizer contacts get MEMBERTYPE "Organizer".`);

  // ── automatic checks on the result ──────────────────────────────────────
  const slugs = newMarkets.map(m => m.slug);
  if (new Set(slugs).size !== slugs.length) problems.push("Two markets ended up with the same web address");
  for (const m of newMarkets) {
    if (m.organizerId && !organizerById.has(m.organizerId)) problems.push(`${m.name}: organizer ${m.organizerId} missing`);
    for (const d of m.schedule?.dates ?? []) if (!isDate(d)) problems.push(`${m.name}: bad date "${d}"`);
    if (m.type === "recurring" && !isDate(m.schedule?.startDate)) problems.push(`${m.name}: repeating market without a start date`);
  }

  return { writes, report, problems, newMarkets };
}

// ── backup, apply, undo ─────────────────────────────────────────────────────

async function commitInBatches(ops: ((b: FirebaseFirestore.WriteBatch) => void)[]) {
  for (let i = 0; i < ops.length; i += 400) {
    const batch = db.batch();
    ops.slice(i, i + 400).forEach(op => op(batch));
    await batch.commit();
  }
}

async function backup() {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dump: Record<string, Doc[]> = {};
  for (const name of TOUCHED) dump[name] = await readAll(name);
  fs.writeFileSync(path.join(OUT_DIR, `backup-${stamp}.json`), JSON.stringify(dump, null, 1));
  const ops: ((b: FirebaseFirestore.WriteBatch) => void)[] = [];
  for (const name of TOUCHED) for (const d of dump[name]) {
    ops.push(b => b.set(db.collection(BACKUP_PREFIX + name).doc(d.id), withoutId(d)));
  }
  await commitInBatches(ops);
  console.log(`Backed up ${Object.values(dump).reduce((n, l) => n + l.length, 0)} documents (Firestore ${BACKUP_PREFIX}* and backup-${stamp}.json).`);
}

async function apply(writes: Write[]) {
  if (!(await db.collection("organizers").limit(1).get()).empty) {
    throw new Error("organizers already has documents: the conversion has run before. Use --undo first.");
  }
  await backup();
  const keepInMarkets = new Set(writes.filter(w => w.col === "markets").map(w => w.id));
  const ops: ((b: FirebaseFirestore.WriteBatch) => void)[] = [];
  // Organizer profiles leave `markets` (they're in `organizers` and the backup)
  for (const d of await readAll("markets")) if (!keepInMarkets.has(d.id)) ops.push(b => b.delete(db.collection("markets").doc(d.id)));
  // Full replacement (not merge): each record ends exactly as planned
  for (const w of writes) ops.push(b => b.set(db.collection(w.col).doc(w.id), w.data));
  await commitInBatches(ops);
  console.log(`Applied ${writes.length} writes.`);

  // Brevo: organizers' MEMBERTYPE becomes "Organizer" (verified members only,
  // the same rule as everywhere else). Without the key here, it happens on
  // each organizer's next login instead (/auth/me syncs then).
  const organizerUids = writes.filter(w => w.col === "users" && w.data.accountType === "organizer").map(w => w.id);
  if (process.env.BREVO_API_KEY) {
    for (const uid of organizerUids) await syncMemberIfVerified(uid).catch(() => false);
    console.log(`Brevo: re-synced ${organizerUids.length} organizer contacts.`);
  } else {
    console.log(`Brevo: no BREVO_API_KEY here, so ${organizerUids.length} organizer contacts update on their next login.`);
  }
}

async function undo() {
  const ops: ((b: FirebaseFirestore.WriteBatch) => void)[] = [];
  const backed: Record<string, Doc[]> = {};
  for (const name of TOUCHED) backed[name] = await readAll(BACKUP_PREFIX + name);
  if (backed.markets.length === 0) throw new Error("No backup found: nothing to undo.");
  for (const d of await readAll("organizers")) ops.push(b => b.delete(db.collection("organizers").doc(d.id)));
  for (const name of TOUCHED) {
    const keep = new Set(backed[name].map(d => d.id));
    for (const d of await readAll(name)) if (!keep.has(d.id)) ops.push(b => b.delete(db.collection(name).doc(d.id)));
    for (const d of backed[name]) ops.push(b => b.set(db.collection(name).doc(d.id), withoutId(d)));
  }
  await commitInBatches(ops);
  console.log("Restored every touched collection from the backup and emptied organizers.");
}

// ── run ─────────────────────────────────────────────────────────────────────

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  if (mode === "undo") {
    if (process.env.CONFIRM !== "yes") throw new Error("Undo writes to the live database. Set CONFIRM=yes to run it.");
    return undo();
  }
  const { writes, report, problems, newMarkets } = await plan();
  const header = [
    `# Stage 1 conversion — ${mode === "apply" ? "APPLY" : "dry run"} — ${new Date().toISOString()}`,
    "",
    `${writes.length} records would be written. Problems: ${problems.length ? problems.length : "none"}.`,
    ...problems.map(p => `- PROBLEM: ${p}`),
    "",
  ];
  fs.writeFileSync(path.join(OUT_DIR, "report.md"), [...header, ...report].join("\n"));
  fs.writeFileSync(path.join(OUT_DIR, "converted-markets.json"), JSON.stringify(newMarkets, null, 1));
  console.log([...header, ...report].join("\n"));
  if (mode !== "apply") return;
  if (problems.length) throw new Error("Not applying: fix the problems above first.");
  if (process.env.CONFIRM !== "yes") throw new Error("Apply writes to the live database. Set CONFIRM=yes to run it.");
  await apply(writes);
}

run().then(() => process.exit(0)).catch(err => { console.error(err.message ?? err); process.exit(1); });
