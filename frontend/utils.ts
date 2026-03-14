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
  month: number
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
      if (ex?.type === 'cancelled') return;
      results.push({
        event,
        date: dateStr,
        startTime: ex?.modifiedStartTime ?? schedule.startTime,
        endTime:   ex?.modifiedEndTime   ?? schedule.endTime,
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

// ─── ICS / Google Calendar export ─────────────────────────────────────────────

export function generateIcsContent(
  event: MarketEvent,
  date: string,
  startTime: string,
  endTime: string
): string {
  const dtStart = `${date.replace(/-/g, '')}T${startTime.replace(':', '')}00`;
  const dtEnd   = `${date.replace(/-/g, '')}T${endTime.replace(':', '')}00`;
  const uid     = `${event.id}-${date}@vimarkets.ca`;
  const now     = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const loc     = `${event.location.venueName}\\, ${event.location.address}\\, ${event.location.city}`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//VI Markets//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=America/Vancouver:${dtStart}`,
    `DTEND;TZID=America/Vancouver:${dtEnd}`,
    `SUMMARY:${event.name}`,
    `LOCATION:${loc}`,
    ...(event.externalEventUrl ? [`URL:${event.externalEventUrl}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

export function downloadIcs(
  event: MarketEvent,
  date: string,
  startTime: string,
  endTime: string
): void {
  const content = generateIcsContent(event, date, startTime, endTime);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.name.replace(/\s+/g, '-')}-${date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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
