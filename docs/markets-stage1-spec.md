# Stage 1 (T128): markets stand on their own

Written Nov 23, 2026. Status: **draft for Kera's approval.** Nothing in this plan has been built or run yet.

Background: OD-16 decides that a **market** is the event people go to (one-off, seasonal or recurring), and an **organizer** is who puts it on. The code was built the other way round: what it calls "market profiles" are really organizer profiles. Stage 1 makes markets the main listing. Stages 2–5 (T129–T132) follow.

---

## What changes for people

### Shoppers
- **Every market has its own page at `vimarkets.ca/markets/<market-name>`**, e.g. `/markets/river-city-christmas-market`. This includes unclaimed markets.
- **A market page shows:**
  - name, dates, times, venue and town;
  - poster and description, when there are any;
  - the vendors who've said they'll be there;
  - a Save heart;
  - for a claimed market, a link to its organizer;
  - for an unclaimed market, a short note: *"Listed by VI Markets from vendor and public information. Is this your market?"* The link goes to the contact form until claiming exists (stage 5).
- **Browse › Markets, search and the home page list markets**, not organizer profiles. Unclaimed markets show everywhere, as decided.
- **The calendar and "Coming up" include every market with dates**, claimed or not.
- **Old links keep working.** `vimarkets.ca/markets/cumberland-museum/cumberland-winterfaire-2026` forwards to the market's new address. A link to an organizer's old page forwards to `vimarkets.ca/organizers/<name>`.

### Vendors
- **Nothing changes yet.** Their "Find us at" list keeps working, because each converted market keeps the same ID it has today. Stage 3 reworks how vendors pick markets and dates.

### Organizers (today's "market profile" owners)
- **Their profile moves to `/organizers/<name>`** and otherwise looks the same until stage 4 simplifies it.
- **My Market works as now.** Their events become their markets, with the same editing as today.

### Kera
- **Unclaimed markets become real market listings.** Until stage 2 gives HQ its market editor, changes go through me, or wait for stage 2. Stage 2 comes straight after.
- **The "Vi Markets Guide Admin" page disappears from public view** (T036). Its one event, Bilston Farm Yuletide Market, becomes an unclaimed market ready for Bilston Farm to claim.

---

## Dates

- **Markets get a third way to describe dates: "On these dates".** It's a simple list of days, e.g. River City Christmas Market on Nov 7 and Dec 12, or Winterfaire on Sat 28 and Sun 29. It replaces "One-Time" (a one-time market is just a list with one date). It also removes the need for the multi-day workaround (T015).
- **Repeating markets ("every Saturday") work as now.**
- **For an unclaimed market, the vendors' dates are the dates we know.** The page marks them *"Date from a vendor"* until Kera or the organizer confirms them.
- **Times are optional for unclaimed markets.** Without them, the page says *"Times to be confirmed"*. Vendors never gave times.
- **A market with no dates at all still gets a page** saying *"No dates announced yet"*. It shows in Browse and search, but not on the calendar.
- **Market names shouldn't include a year or dates.** "Cumberland Winterfaire" can hold this year's dates and next year's. Foggy Mountain Fall Fair already has vendors for both 2026 and 2027.

---

## Saves and reviews

- **Markets and vendors get Saved (the heart). Organizers get Followed.**
- **Existing saves on an organizer that has exactly one market move to that market:**
  - Cumberland Museum moves to Cumberland Winterfaire 2026.
  - École Robb Road Winter Fair moves to ERR Winter Fair.
  - The admin page moves to Bilston Farm Yuletide Market.
- **Organizers with several markets or none keep theirs as follows:** Health Light & Love (2 markets), Gather Comox and Elevate Arts Society (none yet).
- **Reviews follow the same rule.** The live site has no approved reviews on any organizer profile today. The migration will report any waiting for approval.

---

## What gets converted (live data, read Nov 23)

**17 unclaimed "markets" become 17 unclaimed market listings** (16 if you delete the test entry first).

| Market | Town | Known dates (from vendors) |
|---|---|---|
| Art in the Garden (Fri 10-Sun 12) | Nanoose Bay | none |
| Canada Day Market | Campbell River | none |
| Chemainus Street Market | Chemainus | none |
| Christmas at Filberg Night Market | Comox | Nov 21, 2026 |
| Courtenay Market Day | Courtenay | Jul 25, 2026 |
| Crown Isle Christmas Market | Courtenay | Nov 22, 2026 |
| CVHBBA  Witches High Tea | Courtenay | Oct 24, 2026 |
| Foggy Mountain Fall Fair | Cumberland | Sep 20, 2026; Sep 19, 2027 |
| Fungus Fest Night Bazaar | Cumberland | Oct 2, 2026 |
| Haig-Brown Festival | Campbell River | Sep 27, 2026 |
| Kick Off to Summer | Qualicum Beach | none |
| Ribfest (Fri 21-23) | Cumberland | none |
| River City Christmas Market | Campbell River | Nov 7, Dec 12, 2026 |
| Summer by the Sea (Every Tuesday till August 25) | Parksville | none |
| Toy & Craft Market | Campbell River | Nov 28, 2026 |
| Winter Bazaar In My Dreams *(test entry)* | — | Dec 24, 2026 |
| Winterfaire | Courtenay | Nov 14, 2026 |

**The 6 organizer profiles stay as organizers:** Vi Markets Guide Admin (to be hidden), Gather Comox, Cumberland Museum, Health Light & Love, École Robb Road Winter Fair, Elevate Arts Society. Their 5 published events become their claimed markets.

### Tidy in HQ before the conversion (Kera)
- **Delete "Winter Bazaar In My Dreams"**, the test entry.
- **Take dates out of names:**
  - "Art in the Garden (Fri 10-Sun 12)"
  - "Ribfest (Fri 21-23)"
  - "Summer by the Sea (Every Tuesday till August 25)"

  Put those details into dates instead, once there's somewhere to enter them (stage 2), or tell me and I'll add them during the conversion.
- **"CVHBBA  Witches High Tea"** has a double space and an abbreviation shoppers may not know.

### One question for you
**Is "Winterfaire" (Courtenay Legion, Nov 14, added by Jams Jellies and More) the same market as Cumberland Museum's "Cumberland Winterfaire 2026"?** If it is, the conversion merges them: the vendor's link moves to the museum's market, and the duplicate goes. If not, it stays separate.

---

## How it's done safely

1. **The server learns both shapes first.** It accepts markets with or without an organizer, but nothing changes for visitors yet. Merged to `main`, because the server only runs from `main`.
2. **Dry run.** A one-off script reads the live data and writes a report of every change it *would* make: each market converted, each save or review moved, each new web address. It changes nothing. You read the report.
3. **With your OK, the real run.** It's the same script, and it keeps a record of everything it changed. The old unclaimed records are kept, hidden, not deleted, so the conversion can be undone.
4. **The new pages go live** in the same push, so the site never shows half the change.
5. **Check.** I read the live site back (read-only) and you click through it.

You test the new pages on the dev preview between steps 3 and 4. The preview uses the live server, so it shows the converted data.

---

## Not in stage 1
- **HQ market editor** (stage 2, T129). Until then, unclaimed markets change through me.
- **Vendors picking markets and dates, and fixing ones they added** (stage 3, T130).
- **The simpler organizer profile and organizer Follow button** (stage 4, T131). The organizer page stays as it is, just at a new address.
- **"This is my market" and claiming** (stage 5, T132). Stage 1 links to the contact form.
- **Featured placements stay on organizer profiles** until stage 4 decides how Featured works for markets.
- **Applications (vendors applying from a profile) stay on organizer profiles** until the organizer tools (T022).

---

## For developers

- **Collection names stay** (`markets` = organizers, `marketEvents` = markets) to avoid a risky rename; the UI and the docs use the new words. A rename can come with post-beta cleanup.
- **`marketEvents`:**
  - `marketPageId` becomes optional. Empty means unclaimed; set means it's the organizer.
  - `organizerUid` stays as "who added it".
  - New fields:
    - `slug`, unique across all markets, not per organizer;
    - `addedBy: { vendorId?, uid }`;
    - `hqCheckedAt` (the stage 3 lock, and the T106 "last checked" date);
    - `schedule.dates: string[]` and `dateSources?: Record<date, 'vendor'>`.
  - `startTime` and `endTime` become optional.
  - `type: 'oneTime'` with `schedule.date` is converted to `schedule.dates: [date]`.
- **Converted unclaimed markets get the same document ID as their old `markets` doc**, so `vendor.attendingMarkets[].marketId` resolves without touching vendors until stage 3. The old docs get `status: 'converted'` and are hidden from all lists.
- **Access:**
  - An unclaimed market (no `marketPageId`) is editable by admins only.
  - `checkEventAccess` and `canManageMarketEvents` treat a missing `marketPageId` as admin-only.
  - Public GETs return published markets regardless of claim state.
- **Routes:**
  - `/markets/:slug` → market page (today's EventPage, extended).
  - `/organizers/:slug` → today's MarketProfile.
  - `/markets/:orgSlug/:eventSlug` → redirect to `/markets/<new market slug>`.
  - `/markets/:slug` with no matching market but a matching organizer → redirect to `/organizers/:slug`.
  - Link previews (`api/og` or equivalent) must follow the same rules. Check `frontend/vercel.json`.
- **Follows:** `targetType` gains `'organizer'`. The migration moves organizer follows to the single market where there is exactly one, and otherwise sets `targetType: 'organizer'`. Reviews (`entityId`) follow the same rule.
- **Script:** `backend/scripts/markets-stage1.ts`, with `--dry-run` (default) and `--apply`. It writes a JSON log of every change, and an undo script reads that log.
- **Order of deploys:** backend (both shapes) → dry run → apply → frontend. Never apply while the live frontend still expects the old shape for follows.
