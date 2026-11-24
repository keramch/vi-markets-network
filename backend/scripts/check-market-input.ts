/**
 * backend/scripts/check-market-input.ts — no database, no network.
 * Runs sample market-form saves through sanitizeMarketInput and prints what
 * gets through, so the checks can be confirmed without the live server.
 * Run from `backend`: npx ts-node scripts/check-market-input.ts
 */
import { sanitizeMarketInput } from "../src/utils/marketInput";

const cases: [string, unknown, boolean][] = [
  ["Market form: on these dates, times to be confirmed", {
    name: "River City Christmas Market", type: "dates",
    schedule: { dates: ["2026-12-12", "2026-11-07", "2026-12-12"], startTime: "", endTime: "" },
    location: { venueName: "", address: "Sportsplex", city: "Campbell River", province: "BC" },
    dateSources: { "2026-12-12": "vendor" }, status: "published", organizerId: null,
  }, true],
  ["Repeating market", {
    name: "Saturday Market", type: "recurring",
    schedule: { startDate: "2026-05-02", endDate: "", recurrenceDays: [6], recurrenceFrequency: "weekly", startTime: "09:00", endTime: "13:00" },
    location: { venueName: "Park", address: "1 Main St", city: "Comox", province: "BC" },
  }, false],
  ["Bad: old one-time type", { type: "oneTime" }, false],
  ["Bad: a date that isn't one", { schedule: { dates: ["next Saturday"] } }, false],
  ["Bad: date source other than vendor", { dateSources: { "2026-12-12": "organizer" } }, false],
  ["Non-admin trying to set the organizer (dropped)", { name: "X", organizerId: "someone-else" }, false],
];

for (const [label, body, isAdmin] of cases) {
  const out = sanitizeMarketInput(body, { isAdmin });
  console.log(`\n${label} (admin: ${isAdmin})`);
  console.log("  " + JSON.stringify(out));
}
