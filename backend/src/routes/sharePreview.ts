import { Router } from "express";
import { db } from "../firebase";

// GET /share-preview?path=/markets/<slug>[/<event>] or /vendors/<slug>
// What a link preview card needs (title, description, image) for one public
// page. Used by the Vercel link-preview function when Facebook, iMessage etc.
// read a shared link (T097). Only public information: active markets and
// vendors, published events. Anything else gets 404 and the site-wide card.

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

// "Every Sat", "Every other Sat/Sun", "Monthly, Wed" (Monday first, like the site)
function repeats(event: FirebaseFirestore.DocumentData): string {
  if (event.type === "oneTime") return "";
  const days = [...(event.schedule?.recurrenceDays ?? [])]
    .filter((d: unknown) => Number.isInteger(d) && (d as number) >= 0 && (d as number) <= 6)
    .sort((a: number, b: number) => ((a + 6) % 7) - ((b + 6) % 7))
    .map((d: number) => DAYS[d])
    .join("/");
  if (!days) return "";
  const freq = event.schedule?.recurrenceFrequency;
  return freq === "biweekly" ? `Every other ${days}` : freq === "monthly" ? `Monthly, ${days}` : `Every ${days}`;
}

async function activeListing(collection: "markets" | "vendors", slug: string) {
  const snap = await db.collection(collection).where("slug", "==", slug).limit(1).get();
  const doc = snap.docs[0];
  if (!doc || doc.data().status !== "active") return null;
  return { id: doc.id, ...doc.data() } as FirebaseFirestore.DocumentData & { id: string };
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
    } else if (section === "markets") {
      const market = await activeListing("markets", slug);
      if (market && !eventSlug) {
        preview = {
          title: String(market.name ?? "VI Markets market"),
          description: clip(market.description),
          image: httpsUrl(market.headerPhotoUrl) ?? httpsUrl(market.logoUrl),
        };
      } else if (market && eventSlug) {
        const events = await db.collection("marketEvents")
          .where("marketPageId", "==", market.id)
          .where("status", "==", "published")
          .get();
        const doc = events.docs.find(d => d.data().slug === eventSlug) ?? events.docs.find(d => d.id === eventSlug);
        if (doc) {
          const e = doc.data();
          const every = repeats(e);
          const hours = [shortTime(e.schedule?.startTime), shortTime(e.schedule?.endTime)].filter(Boolean).join(" – ");
          const oneDate = e.type === "oneTime" && typeof e.schedule?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e.schedule.date)
            ? new Date(`${e.schedule.date}T12:00:00Z`).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" })
            : "";
          const when = [every || oneDate, hours].filter(Boolean).join(", ");
          const where = [e.location?.venueName, e.location?.city].filter(Boolean).join(", ");
          preview = {
            title: every ? `${e.name} · ${every}` : String(e.name ?? "Market event"),
            // e.g. "Every Sat, 9am – 2pm at Waterfront Park, Nanaimo. Hosted by Harbourside Market Society."
            description: clip(
              `${[when, where && `at ${where}`].filter(Boolean).join(" ")}${when || where ? ". " : ""}Hosted by ${market.name}.`
            ),
            image: httpsUrl(e.tileUrl) ?? httpsUrl(market.headerPhotoUrl) ?? httpsUrl(market.logoUrl),
          };
        }
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
