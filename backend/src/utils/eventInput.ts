import { isSafeWebUrl } from "./urlSafety";

// Checks and cleans what the event form sends to POST and PATCH /market-events.
// Only the form's own fields get through, each in the shape the app expects.
// Anything else (slug, createdAt, made-up fields) is dropped, and wrong shapes
// are refused with a message instead of being saved.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;
const TYPES = ["recurring", "oneTime", "specialEdition"];
const FREQUENCIES = ["weekly", "biweekly", "monthly"];
const OWNER_STATUSES = ["draft", "published"];
const ADMIN_STATUSES = ["draft", "published", "cancelled", "archived"];
const MAX_TEXT = 200;
const MAX_NOTE = 500;
const MAX_DESCRIPTION = 2000;
// Poster and tile must be images uploaded through the app, never an outside address
const OUR_STORAGE = "https://firebasestorage.googleapis.com/v0/b/";

type Result = { data: Record<string, unknown> } | { error: string };

class InputError extends Error {}
const fail = (msg: string): never => { throw new InputError(msg); };

function text(value: unknown, label: string, max = MAX_TEXT): string {
  if (typeof value !== "string") fail(`${label} must be text.`);
  const s = (value as string).trim();
  if (s.length > max) fail(`${label} can be at most ${max} characters.`);
  return s;
}

function textList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length > 50) fail(`${label} must be a list.`);
  return (value as unknown[]).map(v => text(v, label, 100));
}

function dateOrEmpty(value: unknown, label: string): string {
  if (value === "") return "";
  if (typeof value !== "string" || !DATE.test(value)) fail(`${label} must be a date.`);
  return value as string;
}

function time(value: unknown, label: string): string {
  if (typeof value !== "string" || !TIME.test(value)) fail(`${label} must be a time.`);
  return value as string;
}

function location(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") fail("Location is missing.");
  const v = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of ["venueName", "address", "city", "province"]) {
    if (key in v) out[key] = text(v[key], `Location ${key}`);
  }
  for (const key of ["lat", "lng"]) {
    if (key in v) {
      if (typeof v[key] !== "number" || !isFinite(v[key] as number)) fail("Location coordinates must be numbers.");
      out[key] = v[key];
    }
  }
  return out;
}

// Only the keys that were sent are returned, so PATCH's merge still leaves the
// rest of the saved schedule alone (that's how switching type back restores details).
function schedule(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") fail("Schedule is missing.");
  const v = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  if ("date" in v) out.date = dateOrEmpty(v.date, "Date");
  if ("startDate" in v) out.startDate = dateOrEmpty(v.startDate, "Start date");
  if ("endDate" in v) out.endDate = dateOrEmpty(v.endDate, "End date");
  if ("startTime" in v) out.startTime = time(v.startTime, "Start time");
  if ("endTime" in v) out.endTime = time(v.endTime, "End time");
  if ("recurrenceDays" in v) {
    const days = v.recurrenceDays;
    if (!Array.isArray(days) || days.length > 7 || !days.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
      fail("Repeat days must be days of the week.");
    }
    out.recurrenceDays = days;
  }
  if ("recurrenceFrequency" in v) {
    if (!FREQUENCIES.includes(v.recurrenceFrequency as string)) fail("Repeat frequency is not valid.");
    out.recurrenceFrequency = v.recurrenceFrequency;
  }
  return out;
}

function exceptions(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value) || value.length > 400) fail("Exceptions must be a list.");
  return (value as unknown[]).map(item => {
    if (!item || typeof item !== "object") fail("Each exception must be an object.");
    const e = item as Record<string, unknown>;
    if (e.type !== "cancelled" && e.type !== "modified") fail("Exception type is not valid.");
    const out: Record<string, unknown> = { date: dateOrEmpty(e.date, "Exception date"), type: e.type };
    if (e.modifiedStartTime !== undefined) out.modifiedStartTime = time(e.modifiedStartTime, "Changed start time");
    if (e.modifiedEndTime !== undefined) out.modifiedEndTime = time(e.modifiedEndTime, "Changed end time");
    if (e.note !== undefined) out.note = text(e.note, "Exception note", MAX_NOTE);
    return out;
  });
}

function imageList(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 10) fail("Photos must be a list of up to 10.");
  return (value as unknown[]).map(url => {
    if (typeof url !== "string" || !isSafeWebUrl(url)) fail("Each photo must be a normal web address.");
    return url as string;
  });
}

export function sanitizeEventInput(body: unknown, opts: { isAdmin: boolean }): Result {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "Nothing to save." };
  const b = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  try {
    if ("name" in b) {
      out.name = text(b.name, "Event name");
      if (!out.name) fail("Event name can't be empty.");
    }
    if ("type" in b) {
      if (!TYPES.includes(b.type as string)) fail("Event type is not valid.");
      out.type = b.type;
    }
    if ("status" in b) {
      const allowed = opts.isAdmin ? ADMIN_STATUSES : OWNER_STATUSES;
      if (!allowed.includes(b.status as string)) fail("Status is not valid.");
      out.status = b.status;
    }
    if ("marketTags" in b) out.marketTags = textList(b.marketTags, "Market tags");
    if ("marketType" in b) out.marketType = textList(b.marketType, "Market type");
    if ("location" in b) out.location = location(b.location);
    if ("schedule" in b) out.schedule = schedule(b.schedule);
    if ("exceptions" in b) out.exceptions = exceptions(b.exceptions);
    if ("photos" in b) out.photos = imageList(b.photos);
    if ("externalEventUrl" in b) {
      const url = b.externalEventUrl;
      if (url !== "" && (typeof url !== "string" || !isSafeWebUrl(url))) {
        fail("Please enter a normal web address for the event link, like https://mysite.ca/event");
      }
      out.externalEventUrl = url;
    }
    if ("description" in b) out.description = text(b.description, "Description", MAX_DESCRIPTION);
    for (const key of ["posterUrl", "tileUrl"]) {
      if (key in b) {
        const url = b[key];
        // '' clears it
        if (url !== "" && (typeof url !== "string" || !url.startsWith(OUR_STORAGE) || !isSafeWebUrl(url))) {
          fail("Images must be uploaded through the event form.");
        }
        out[key] = url;
      }
    }
    // Moving an event to another market or organizer is admin-only
    if (opts.isAdmin) {
      if ("marketPageId" in b) out.marketPageId = text(b.marketPageId, "Market");
      if ("organizerUid" in b) out.organizerUid = text(b.organizerUid, "Organizer");
    }
  } catch (err) {
    if (err instanceof InputError) return { error: err.message };
    throw err;
  }
  return { data: out };
}
