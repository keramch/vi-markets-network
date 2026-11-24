# Stage 1 (T128): markets stand on their own

Written Nov 23, 2026. Status: **approved by Kera Nov 23**, with her changes: past dates, names, duplicates, and renaming the collections. Nothing has been built or run yet.

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
- **Past dates aren't shown.** This is a new site and doesn't need to look historical. A market whose known dates have all passed keeps its page, saying *"No upcoming dates announced"*. That suits yearly markets, which shoppers will search for again next year. Past dates stay in the record but aren't displayed.
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
- **Names stay as entered otherwise**, abbreviations included ("CVHBBA"). Local shoppers know them, and a claiming organizer can adjust. The conversion only trims stray spaces.

### Duplicates
**Markets are merged only when the name, dates and location all match.** Anything else is treated as a different market. "Winterfaire" (Courtenay Legion) and Cumberland Museum's "Cumberland Winterfaire 2026" are different markets, and both stay. The dry run lists near-matches for Kera to look at; it never merges them by itself.

---

## Renaming the collections now (Kera, Nov 23)

The site is out of beta and the numbers are small, so the code's names get fixed now rather than later. The current mismatch is what caused the confusion over HQ's Edit button.

| Today | After stage 1 |
|---|---|
| `markets` collection (organizer profiles) | `organizers` |
| `marketEvents` collection (the markets) | `markets` |
| an event's `marketPageId` | `organizerId` |
| a member's `ownedMarketId` | `ownedOrganizerId` |
| account type `market` | `organizer` |
| API `/markets` and `/market-events` | `/organizers` and `/markets` |

It's done in the same conversion, so there's one switch-over, not two. The conversion **copies** into the new collections and leaves the old ones untouched as a backup, which makes going back simple.

**Brevo is the one outside system affected.** Its MEMBERTYPE field says "Market" for organizers. It keeps receiving "Market" unless Kera changes the Brevo segments to "Organizer" first.

## How it's done safely

1. **Build everything on `dev`:** the server and the pages, using the new names. Nothing live changes while it's built.
2. **Dry run.** A one-off script reads the live data and writes a report of every change it *would* make: each market converted, each save or review moved, each new web address, each near-duplicate. It changes nothing. You read the report.
3. **Check against real data without going live.** I run the new server on this computer and read every page's data back, against a test copy of the converted data. It only reads.
4. **Switch-over, at a quiet time and with your OK:**
   1. The script copies everything into the new collections. The old collections are left exactly as they are.
   2. You push `main`, and the new server and pages go live together (about 5 minutes on Render).
   3. Until the new server is up, the live site keeps working on the old data.
5. **Catch-up and check.** The script runs once more to pick up anything changed during those minutes. I read the live site back, and you click through it.

**Going back,** if something's badly wrong: put `main` back to the previous commit. The old collections are untouched, so the old site works as before. Anything entered after the switch-over would need copying back by hand.

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

- **Collections are renamed** (see the table above): `organizers` holds organizer profiles, `markets` holds markets. The rename is done by copying, so the old `markets` and `marketEvents` collections stay as a backup until Kera agrees to delete them.
- **`markets` (new):**
  - `organizerId` (was `marketPageId`) becomes optional. Empty means unclaimed.
  - `organizerUid` stays as "who added it".
  - New fields:
    - `slug`, unique across all markets, not per organizer;
    - `addedBy: { vendorId?, uid }`;
    - `hqCheckedAt` (the stage 3 lock, and the T106 "last checked" date);
    - `schedule.dates: string[]` and `dateSources?: Record<date, 'vendor'>`.
  - `startTime` and `endTime` become optional.
  - `type: 'oneTime'` with `schedule.date` is converted to `schedule.dates: [date]`.
- **IDs are kept:**
  - Converted unclaimed markets keep the same document ID as their old `markets` doc, so `vendor.attendingMarkets[].marketId` now points straight at the real market, and vendors aren't touched until stage 3.
  - Organizer profiles keep their IDs in `organizers`.
  - Every market (old `marketEvents`) keeps its ID too.
- **Also renamed:**
  - `applications.marketId` → `organizerId`;
  - `users.ownedMarketId` → `ownedOrganizerId`;
  - `accountType: 'market'` → `'organizer'`;
  - the follows and reviews `targetType`/`entityType` values.

  `marketApplications` and `organizerAccounts` (no UI) are copied unchanged.
- **Storage:**
  - Existing image URLs keep working, because the files don't move.
  - New uploads go to `organizers/{id}/` and `markets/{id}/`.
  - `storage.rules` looks up ownership in `organizers`, and for a market, through its `organizerId`.
  - `firestore.rules` gets the new collection names.
- **Access:**
  - An unclaimed market (no `organizerId`) is editable by admins only.
  - The market access checks treat a missing `organizerId` as admin-only.
  - Public GETs return published markets regardless of claim state.
- **Routes:**
  - `/markets/:slug` → market page (today's EventPage, extended).
  - `/organizers/:slug` → today's MarketProfile.
  - `/markets/:orgSlug/:eventSlug` → redirect to `/markets/<new market slug>`.
  - `/markets/:slug` with no matching market but a matching organizer → redirect to `/organizers/:slug`.
  - Link previews (`api/og` or equivalent) must follow the same rules. Check `frontend/vercel.json`.
- **Follows:** `targetType` gains `'organizer'`. The migration moves organizer follows to the single market where there is exactly one, and otherwise sets `targetType: 'organizer'`. Reviews (`entityId`) follow the same rule.
- **Script:** `backend/scripts/markets-stage1.ts`, safe to re-run. It writes a JSON log of every change. Three modes:
  - `--dry-run` (default);
  - `--apply`;
  - `--catch-up`, which re-copies docs whose `updatedAt` changed since the first run.
- **Order:**
  1. Build on dev.
  2. Dry run.
  3. Local read-only smoke test of the new backend against the converted data.
  4. Apply.
  5. Kera pushes main (backend and frontend together).
  6. Catch-up.
  7. Read-back check.

  Browsers with an old page open get errors until they reload, which is acceptable for a few minutes.
