import type { Coordinates, MarketEvent, EventException } from './types';

/**
 * Calculates the distance between two geographical coordinates in kilometers.
 * @param coords1 - The first set of coordinates.
 * @param coords2 - The second set of coordinates.
 * @returns The distance in kilometers.
 */
export const getDistance = (coords1: Coordinates, coords2: Coordinates): number => {
    if (!coords1 || !coords2) return Infinity;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(coords2.lat - coords1.lat);
    const dLon = toRad(coords2.lng - coords1.lng);
    const lat1 = toRad(coords1.lat);
    const lat2 = toRad(coords2.lat);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Formats a "HH:MM" time string into a more readable "h:mm am/pm" format.
 * @param time - The time string in 24-hour format.
 * @returns The formatted time string.
 */
export const formatTime = (time: string): string => {
  const [hour, minute] = time.split(':').map(Number);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${formattedHour}${minute === 0 ? '' : `:${String(minute).padStart(2, '0')}`}${ampm}`;
};

// ─── Calendar helpers ──────────────────────────────────────────────────────────

export interface CalendarOccurrence {
  event: MarketEvent;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM (may be overridden by exception)
  endTime: string;    // HH:MM
  cancelled?: boolean; // only present when asked for with includeCancelled
  changed?: boolean;   // this date has its own hours or note
  note?: string;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isInMonth(dateStr: string, year: number, month: number): boolean {
  // Parse without timezone shift by treating it as a local date
  const [y, mo] = dateStr.split('-').map(Number);
  return y === year && mo - 1 === month;
}

function weekOfMonth(d: Date): number {
  return Math.ceil(d.getDate() / 7);
}

/**
 * Expands a list of MarketEvent documents into individual calendar occurrences
 * for the given year/month (0-based month, Jan=0).
 * Only published events are included. Cancelled exceptions are suppressed.
 */
export function expandOccurrences(
  events: MarketEvent[],
  year: number,
  month: number,
  // Event pages show cancelled dates crossed out; everywhere else drops them
  options: { includeCancelled?: boolean } = {}
): CalendarOccurrence[] {
  const results: CalendarOccurrence[] = [];
  const monthStart = new Date(year, month, 1);
  const monthEnd   = new Date(year, month + 1, 0); // last day of month

  for (const event of events) {
    if (event.status !== 'published') continue;

    const { schedule, exceptions } = event;

    // Build fast lookup: date string → exception
    const exMap = new Map<string, EventException>();
    for (const ex of exceptions ?? []) exMap.set(ex.date, ex);

    const pushOccurrence = (dateStr: string) => {
      const ex = exMap.get(dateStr);
      if (ex?.type === 'cancelled' && !options.includeCancelled) return;
      results.push({
        event,
        date: dateStr,
        startTime: ex?.modifiedStartTime ?? schedule.startTime,
        endTime:   ex?.modifiedEndTime   ?? schedule.endTime,
        ...(ex?.type === 'cancelled' ? { cancelled: true } : {}),
        ...(ex?.type === 'modified' ? { changed: true } : {}),
        ...(ex?.note ? { note: ex.note } : {}),
      });
    };

    if (event.type === 'oneTime') {
      if (schedule.date && isInMonth(schedule.date, year, month)) {
        pushOccurrence(schedule.date);
      }
      continue;
    }

    // recurring / specialEdition — walk days in the month that fall within the
    // event's active range
    const eventStart = schedule.startDate ? new Date(schedule.startDate + 'T12:00:00') : monthStart;
    const eventEnd   = schedule.endDate   ? new Date(schedule.endDate   + 'T12:00:00') : monthEnd;

    const rangeStart = new Date(Math.max(monthStart.getTime(), eventStart.getTime()));
    const rangeEnd   = new Date(Math.min(monthEnd.getTime(),   eventEnd.getTime()));
    // Compare whole days. eventStart/eventEnd are at noon but monthEnd is at
    // midnight, so without this the last day of a series' first month was
    // dropped (T002).
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);

    if (rangeStart > rangeEnd) continue;

    const recurrenceDays = schedule.recurrenceDays ?? [];
    const freq = schedule.recurrenceFrequency ?? 'weekly';

    // Reference week start (for biweekly parity)
    const refWeekStart = new Date(eventStart);
    refWeekStart.setDate(refWeekStart.getDate() - refWeekStart.getDay());

    // Reference week-of-month ordinal (for monthly)
    const refWeekOrdinal = weekOfMonth(eventStart);

    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      const dow = cursor.getDay();

      if (recurrenceDays.includes(dow)) {
        let include = false;

        if (freq === 'weekly') {
          include = true;
        } else if (freq === 'biweekly') {
          const curWeekStart = new Date(cursor);
          curWeekStart.setDate(cursor.getDate() - cursor.getDay());
          const weekDiff = Math.round(
            (curWeekStart.getTime() - refWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          include = weekDiff % 2 === 0;
        } else if (freq === 'monthly') {
          include = weekOfMonth(cursor) === refWeekOrdinal;
        }

        if (include) pushOccurrence(toIsoDate(cursor));
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return results.sort((a, b) =>
    a.date === b.date
      ? a.startTime.localeCompare(b.startTime)
      : a.date.localeCompare(b.date)
  );
}

/**
 * The next date an event actually happens, on or after today in the visitor's
 * local time (not UTC, so an event stays listed for its whole day). Uses
 * expandOccurrences, so it reads the right schedule fields for the event's
 * type and skips cancelled dates. Returns null if nothing is coming up within
 * the next 24 months (T001, T096).
 */
export function nextOccurrence(event: MarketEvent, from: Date = new Date()): CalendarOccurrence | null {
  const todayIso = toIsoDate(from);
  for (let i = 0; i < 24; i++) {
    const monthDate = new Date(from.getFullYear(), from.getMonth() + i, 1);
    const next = expandOccurrences([event], monthDate.getFullYear(), monthDate.getMonth())
      .find(o => o.date >= todayIso);
    if (next) return next;
  }
  return null;
}

/**
 * Every date in the next `days` days (today included, local time), across all
 * the given events, soonest first. An event with nothing in that window still
 * appears once with its next date, so a series starting later doesn't vanish
 * (T099).
 */
export function upcomingOccurrences(
  events: MarketEvent[],
  days = 42,
  from: Date = new Date(),
  options: { includeCancelled?: boolean } = {}
): CalendarOccurrence[] {
  const todayIso = toIsoDate(from);
  const endIso = toIsoDate(new Date(from.getFullYear(), from.getMonth(), from.getDate() + days - 1));

  const inWindow: CalendarOccurrence[] = [];
  const endDate = new Date(endIso + 'T12:00:00');
  for (
    let m = new Date(from.getFullYear(), from.getMonth(), 1);
    m <= endDate;
    m = new Date(m.getFullYear(), m.getMonth() + 1, 1)
  ) {
    for (const o of expandOccurrences(events, m.getFullYear(), m.getMonth(), options)) {
      if (o.date >= todayIso && o.date <= endIso) inWindow.push(o);
    }
  }

  const shown = new Set(inWindow.map(o => o.event.id));
  for (const e of events) {
    if (shown.has(e.id)) continue;
    const next = nextOccurrence(e, from);
    if (next) inWindow.push(next);
  }

  return inWindow.sort((a, b) =>
    a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
  );
}

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** "Every Sat", "Every other Sat/Sun", "Monthly, Sat". Empty for one-time events. */
export function recurrenceSummary(event: MarketEvent): string {
  if (event.type === 'oneTime') return '';
  // Monday first, so weekend markets read "Sat/Sun"
  const days = [...(event.schedule.recurrenceDays ?? [])]
    .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7))
    .map(d => SHORT_DAYS[d])
    .join('/');
  if (!days) return '';
  switch (event.schedule.recurrenceFrequency) {
    case 'biweekly': return `Every other ${days}`;
    case 'monthly':  return `Monthly, ${days}`;
    default:         return `Every ${days}`;
  }
}

// ─── Event page links ─────────────────────────────────────────────────────────

/**
 * The event page path: /markets/<market slug>/<event slug>. Events saved before
 * slugs existed use their ID until their next save; the page accepts both.
 * `date` (YYYY-MM-DD) opens the page on that one date.
 */
export function eventPath(marketSlug: string, event: Pick<MarketEvent, 'id' | 'slug'>, date?: string): string {
  const path = `/markets/${marketSlug}/${encodeURIComponent(event.slug || event.id)}`;
  return date ? `${path}?date=${date}` : path;
}

/** Full link for sharing or copying. */
export function eventUrl(marketSlug: string, event: Pick<MarketEvent, 'id' | 'slug'>, date?: string): string {
  return `${window.location.origin}${eventPath(marketSlug, event, date)}`;
}

/**
 * Share buttons open the phone's share sheet on phones and tablets. On a
 * computer they copy the link instead: the desktop share panel (e.g. Windows')
 * is clumsy and can't be closed by clicking outside it.
 */
export function prefersShareSheet(): boolean {
  return typeof navigator.share === 'function'
    && window.matchMedia('(pointer: coarse)').matches;
}

/** Google Maps directions to an event's venue. */
export function directionsUrl(event: MarketEvent): string {
  const { venueName, address, city, province } = event.location;
  const destination = [venueName, address, city, province].filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

// ─── Google Calendar link (.ics downloads dropped Nov 10; see T102) ─────────────────────────────────────────────

export function buildGoogleCalendarUrl(
  event: MarketEvent,
  date: string,
  startTime: string,
  endTime: string
): string {
  const dtStart = `${date.replace(/-/g, '')}T${startTime.replace(':', '')}00`;
  const dtEnd   = `${date.replace(/-/g, '')}T${endTime.replace(':', '')}00`;
  const loc = `${event.location.venueName}, ${event.location.address}, ${event.location.city}`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${dtStart}/${dtEnd}`,
    location: loc,
    ctz: 'America/Vancouver',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ── Password policy ──────────────────────────────────────────────────────────
// Must match the Firebase Auth password policy (Firebase Console → Authentication
// → Settings → Password policy). If the policy changes there, update it here too.
// Special characters are the set Firebase accepts for "require special character".
const PASSWORD_SPECIAL_CHARS = /[\^$*.[\]{}()?"!@#%&/\,><':;|_~`=+-]/;

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { id: 'special', label: 'At least one special character, like ! @ # $ or ?', test: (pw: string) => PASSWORD_SPECIAL_CHARS.test(pw) },
] as const;

export const passwordMeetsPolicy = (pw: string): boolean =>
  PASSWORD_RULES.every((rule) => rule.test(pw));

// Shown when a new password fails the policy (signup, reset, change password)
export const PASSWORD_POLICY_MESSAGE =
  'Your password needs at least 8 characters, including at least one special character.';

// ── Vendor types ─────────────────────────────────────────────────────────────
// A vendor's real types (chosen at signup / in the profile editor). The old
// `category` field was filled with "Artisan & Crafts" for everyone, so it's
// only a fallback for very old records.
export const getVendorTypes = (vendor: { vendorTypes?: string[]; category?: string }): string[] =>
  vendor.vendorTypes && vendor.vendorTypes.length > 0
    ? vendor.vendorTypes
    : vendor.category ? [vendor.category] : [];

export const vendorTypeLabel = (vendor: { vendorTypes?: string[]; category?: string }): string =>
  getVendorTypes(vendor).join(' · ');
