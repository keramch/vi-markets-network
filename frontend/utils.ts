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

/**
 * A series that starts and ends within one week is really a one-off multi-day
 * market (the T015 workaround: Recurring, Sat + Sun, start and end that
 * weekend). Returns its first and last real dates, e.g. "Sat, Nov 28 – Sun,
 * Nov 29", or '' if it isn't one. Mirrored in backend routes/sharePreview.ts.
 */
export function shortSeriesRange(event: MarketEvent): string {
  const { startDate, endDate, recurrenceDays = [] } = event.schedule;
  if (event.type === 'oneTime' || !startDate || !endDate) return '';
  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  const spanDays = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  if (spanDays < 0 || spanDays > 6) return '';
  const dates: Date[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (recurrenceDays.includes(d.getDay())) dates.push(new Date(d));
  }
  if (dates.length === 0) return '';
  const fmt = (d: Date) => d.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
  const first = fmt(dates[0]);
  const last = fmt(dates[dates.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

/** "Every Sat", "Every other Sat/Sun", "Monthly, Sat". Empty for one-time events.
 *  A series within one week shows its dates instead (see shortSeriesRange). */
export function recurrenceSummary(event: MarketEvent): string {
  if (event.type === 'oneTime') return '';
  const range = shortSeriesRange(event);
  if (range) return range;
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

// ── Social and website links ─────────────────────────────────────────────────
// Members type these in every way: "@name", "name", "instagram.com/name",
// "https://www.facebook.com/name", even "www.facebook.com/www.facebook.com/name".
// cleanSocial turns any of those into the plain username (or, for Facebook,
// the page path such as "groups/123" or "profile.php?id=123"), and socialUrl
// builds the working link from it. Profiles call socialUrl on whatever is
// saved, so older entries in the wrong format link correctly too.

export type SocialPlatform = 'instagram' | 'facebook' | 'pinterest' | 'etsy' | 'tiktok';
export const SOCIAL_PLATFORMS: SocialPlatform[] = ['instagram', 'facebook', 'etsy', 'tiktok', 'pinterest'];

export const SOCIAL_LABEL: Record<SocialPlatform, string> = {
  instagram: 'Instagram', facebook: 'Facebook', pinterest: 'Pinterest', etsy: 'Etsy', tiktok: 'TikTok',
};

// The site's address, wherever it appears in what was typed
const SOCIAL_DOMAIN: Record<SocialPlatform, RegExp> = {
  instagram: /(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/?/i,
  facebook: /(?:https?:\/\/)?(?:www\.|m\.|web\.|business\.)?(?:facebook|fb)\.com\/?/i,
  pinterest: /(?:https?:\/\/)?(?:[a-z]{2,3}\.)?pinterest\.(?:com|ca)\/?/i,
  etsy: /(?:https?:\/\/)?(?:www\.)?etsy\.com\/?/i,
  tiktok: /(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/?/i,
};

// Usernames on these sites are letters, numbers, dots, dashes and underscores
const VALID_HANDLE = /^[A-Za-z0-9._-]+$/;

export const cleanSocial = (platform: SocialPlatform, raw: string | undefined | null): string => {
  let value = String(raw ?? '').trim();
  // An Etsy shop's own address: name.etsy.com
  const etsySub = platform === 'etsy' ? value.match(/(?:https?:\/\/)?([a-z0-9-]+)\.etsy\.com/i) : null;
  if (etsySub && etsySub[1].toLowerCase() !== 'www') return etsySub[1];
  // Keep only the link if there are words around it, then strip the site's
  // address, even when it was pasted twice
  const at = value.search(SOCIAL_DOMAIN[platform]);
  if (at >= 0) {
    value = value.slice(at).split(/\s/)[0];
    for (let next = value.replace(SOCIAL_DOMAIN[platform], ''); next !== value; next = value.replace(SOCIAL_DOMAIN[platform], '')) {
      value = next;
    }
  }
  value = value.replace(/^[@#]/, '').split('#')[0];

  if (platform === 'facebook') {
    // A page name with spaces ("Sisu Pottery") is kept as typed and searched for
    if (/\s/.test(value)) return value.replace(/\s+/g, ' ');
    // Keep the page path; the only query worth keeping is a profile's id
    const [path, query = ''] = value.split('?');
    const id = new URLSearchParams(query).get('id');
    const cleanPath = path.replace(/\/+$/, '');
    return id && /^profile\.php$/i.test(cleanPath) ? `profile.php?id=${id}` : cleanPath;
  }

  const segments = value.split('?')[0].split('/').filter(Boolean);
  if (platform === 'etsy' && segments[0]?.toLowerCase() === 'shop') segments.shift();
  return (segments[0] ?? '').replace(/^@/, '').replace(/\s+/g, '');
};

export const socialUrl = (platform: SocialPlatform, raw: string | undefined | null): string | null => {
  const handle = cleanSocial(platform, raw);
  if (!handle) return null;
  if (platform === 'facebook') {
    if (handle.includes('@')) return null; // an email address typed in by mistake
    return /\s/.test(handle)
      ? `https://www.facebook.com/search/top?q=${encodeURIComponent(handle)}`
      : `https://www.facebook.com/${encodeURI(handle)}`;
  }
  if (!VALID_HANDLE.test(handle)) return null; // e.g. an email address typed in by mistake
  switch (platform) {
    case 'instagram': return `https://www.instagram.com/${handle}/`;
    case 'pinterest': return `https://www.pinterest.com/${handle}/`;
    case 'etsy':      return `https://www.etsy.com/shop/${handle}`;
    case 'tiktok':    return `https://www.tiktok.com/@${handle}`;
  }
};

// A short note for the profile editor when what was typed can't become a link
export const socialProblem = (platform: SocialPlatform, raw: string | undefined | null): string | null =>
  String(raw ?? '').trim() && !socialUrl(platform, raw)
    ? `That doesn't look like a ${SOCIAL_LABEL[platform]} username or link.`
    : null;

// A website link that always opens: adds https:// when it's missing, and
// returns null for anything that isn't an ordinary web address.
export const websiteUrl = (raw: string | undefined | null): string | null => {
  const value = String(raw ?? '').trim();
  if (!value) return null;
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, '')}`;
  try {
    const url = new URL(withScheme);
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname.includes('.') ? url.href : null;
  } catch {
    return null;
  }
};
