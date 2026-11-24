import { Router } from "express";
import { db } from "../firebase";

// GET /share-preview?path=/markets/<slug>, /organizers/<slug> or /vendors/<slug>
// What a link preview card needs (title, description, image) for one public
// page. Used by the Vercel link-preview function when Facebook, iMessage etc.
// read a shared link (T097). Only public information: published markets,
// active organizers and vendors. Anything else gets 404 and the site-wide card.
// Links from before stage 1 (T128) still get the right card: /markets/<organizer>
// and /markets/<organizer>/<event>.

const router = Router();

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shortTime(t: unknown): string {
  if (typeof t !== "string" || !/^\d{2}:\d{2}$/.test(t)) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

// Cuts long text at a word boundary for the card's description line
function clip(text: unknown, max = 200): string {
  if (typeof text !== "string") return "";
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 120 ? cut.lastIndexOf(" ") : max)}…`;
}

function httpsUrl(value: unknown): string | null {
  return typeof value === "string" && value.startsWith("https://") ? value : null;
}

// A series that starts and ends within one week is a one-off multi-day market
// (the T015 workaround). Shows its first and last real dates instead of
// "Every Sat/Sun". Mirrors shortSeriesRange in frontend/utils.ts.
function shortSeriesRange(event: FirebaseFirestore.DocumentData): string {
  const { startDate, endDate } = event.schedule ?? {};
  const days: unknown[] = event.schedule?.recurrenceDays ?? [];
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (event.type !== "recurring" || typeof startDate !== "string" || typeof endDate !== "string") return "";
  if (!iso.test(startDate) || !iso.test(endDate)) return "";
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (spanDays < 0 || spanDays > 6) return "";
  const dates: Date[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (days.includes(d.getUTCDay())) dates.push(new Date(d));
  }
  if (dates.length === 0) return "";
  const fmt = (d: Date) => d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const first = fmt(dates[0]);
  const last = fmt(dates[dates.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

// "Every Sat", "Every other Sat/Sun", "Monthly, Wed" (Monday first, like the site)
function repeats(event: FirebaseFirestore.DocumentData): string {
  if (event.type !== "recurring") return "";
  const range = shortSeriesRange(event);
  if (range) return range;
  const days = [...(event.schedule?.recurrenceDays ?? [])]
    .filter((d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
    .sort((a: number, b: number) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d: number) => DAYS[d])
    .join("/");
  if (!days) return "";
  const freq = event.schedule?.recurrenceFrequency;
  return freq === "biweekly" ? `Every other ${days}` : freq === "monthly" ? `Monthly, ${days}` : `Every ${days}`;
}

// "Sat, Nov 28", or "Sat, Nov 28 + 2 more dates" for a market on a list of dates:
// the next date to come, else the last one
function nextListedDate(event: FirebaseFirestore.DocumentData): string {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  const dates: string[] = (event.schedule?.dates ?? []).filter((d: unknown) => typeof d === "string" && iso.test(d)).sort();
  if (event.type !== "dates" || dates.length === 0) return "";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
  const upcoming = dates.filter(d => d >= today);
  const first = upcoming[0] ?? dates[dates.length - 1];
  const label = new Date(`${first}T12:00:00Z`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  const more = upcoming.length - 1;
  return more > 0 ? `${label} + ${more} more date${more === 1 ? "" : "s"}` : label;
}

async function publishedMarket(field: "slug" | "legacyPaths", value: string) {
  const query = field === "slug"
    ? db.collection("markets").where("slug", "==", value)
    : db.collection("markets").where("legacyPaths", "array-contains", value);
  const snap = await query.limit(1).get();
  const doc = snap.docs[0];
  if (!doc || doc.data().status !== "published") return null;
  return { id: doc.id, ...doc.data() } as FirebaseFirestore.DocumentData & { id: string };
}

async function activeListing(collection: "organizers" | "vendors", slug: string) {
  const snap = await db.collection(collection).where("slug", "==", slug).limit(1).get();
  const doc = snap.docs[0];
  if (!doc || doc.data().status !== "active") return null;
  return { id: doc.id, ...doc.data() } as FirebaseFirestore.DocumentData & { id: string };
}

function organizerPreview(organizer: FirebaseFirestore.DocumentData) {
  return {
    title: String(organizer.name ?? "VI Markets organizer"),
    description: clip(organizer.description),
    image: httpsUrl(organizer.headerPhotoUrl) ?? httpsUrl(organizer.logoUrl),
  };
}

router.get("/", async (req, res) => {
  const path = typeof req.query.path === "string" ? req.query.path : "";
  let parts: string[];
  try {
    parts = path.split("/").filter(Boolean).map(p => decodeURIComponent(p));
  } catch {
    return res.status(404).json({ error: "No preview" }); // malformed link
  }
  const ok = /^[A-Za-z0-9_-]{1,120}$/;
  if (parts.length < 2 || parts.length > 3 || !parts.slice(1).every(p => ok.test(p))) {
    return res.status(404).json({ error: "No preview" });
  }

  try {
    const [section, slug, eventSlug] = parts;
    let preview: { title: string; description: string; image: string | null } | null = null;

    if (section === "vendors" && !eventSlug) {
      const vendor = await activeListing("vendors", slug);
      if (vendor) {
        preview = {
          title: String(vendor.name ?? "VI Markets vendor"),
          description: clip(vendor.description),
          image: httpsUrl(vendor.headerPhotoUrl) ?? httpsUrl(vendor.logoUrl),
        };
      }
    } else if (section === "organizers" && !eventSlug) {
      const organizer = await activeListing("organizers", slug);
      if (organizer) preview = organizerPreview(organizer);
    } else if (section === "markets") {
      // /markets/<slug>, or an old /markets/<organizer>/<event> link
      const market = eventSlug
        ? await publishedMarket("legacyPaths", `${slug}/${eventSlug}`)
        : (await publishedMarket("slug", slug)) ?? (await publishedMarket("legacyPaths", slug));
      if (market) {
        const organizer = market.organizerId
          ? (await db.collection("organizers").doc(market.organizerId).get()).data()
          : undefined;
        const every = repeats(market) || nextListedDate(market);
        const hours = [shortTime(market.schedule?.startTime), shortTime(market.schedule?.endTime)].filter(Boolean).join(" – ");
        const when = [every, hours].filter(Boolean).join(", ");
        const where = [market.location?.venueName, market.location?.city].filter(Boolean).join(", ");
        const lead = [when, where && `at ${where}`].filter(Boolean).join(" ");
        preview = {
          title: every ? `${market.name} · ${every}` : String(market.name ?? "VI Markets market"),
          // e.g. "Every Sat, 9am – 2pm at Waterfront Park, Nanaimo. Run by Harbourside Market Society."
          description: clip(
            `${lead}${lead ? ". " : ""}${organizer?.name ? `Run by ${organizer.name}.` : ""}`.trim() || market.description
          ),
          image: httpsUrl(market.tileUrl) ?? httpsUrl(organizer?.headerPhotoUrl) ?? httpsUrl(organizer?.logoUrl) ?? httpsUrl(market.logoUrl),
        };
      } else if (!eventSlug) {
        // An old link to an organizer's page, from when organizers were /markets/<slug>
        const organizer = await activeListing("organizers", slug);
        if (organizer) preview = organizerPreview(organizer);
      }
    }

    if (!preview) return res.status(404).json({ error: "No preview" });
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.json(preview);
  } catch (err) {
    console.error("Error building share preview:", err);
    return res.status(500).json({ error: "No preview" });
  }
});

export default router;
