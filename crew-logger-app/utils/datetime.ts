// Turning what a crew member types into the timestamps the API expects.
//
// The form collects one date and several times of day. The API wants full
// timestamps — and a shift routinely runs past midnight, so the later times
// can fall on the NEXT calendar day. Two of the 74 historic records do
// exactly this.
//
// This matters more than it looks: the database computes work_minutes as
// off_duty - on_duty, so a missed rollover produces a NEGATIVE duration.

/** Times in the order they occur during a run. */
export const TIME_SEQUENCE = [
  'on_duty',
  'start_time',
  'initial_os',
  'final_os',
  'off_duty',
] as const;

export type TimeField = (typeof TIME_SEQUENCE)[number];

/** "HH:MM" -> minutes since midnight. null if not a valid time. */
export function parseTimeOfDay(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** True if the string is a valid YYYY-MM-DD calendar date. */
export function isValidDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  // Round-trip through UTC to reject things like 2026-02-30, which would
  // otherwise silently roll into March.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Add whole days to a YYYY-MM-DD string, returning YYYY-MM-DD.
 *  Uses UTC throughout so it can't be shifted by the viewer's timezone. */
function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toIsoTimestamp(isoDate: string, minutesSinceMidnight: number): string {
  const hours = String(Math.floor(minutesSinceMidnight / 60)).padStart(2, '0');
  const minutes = String(minutesSinceMidnight % 60).padStart(2, '0');
  return `${isoDate}T${hours}:${minutes}:00`;
}

/**
 * Convert the form's times of day into ISO timestamps, rolling the date
 * forward each time the clock goes backwards.
 *
 * Walks TIME_SEQUENCE in order. Whenever a time is earlier than the previous
 * one, the day has rolled over. Blank fields are skipped entirely and stay
 * null — they don't advance or reset the day.
 *
 * Assumes a shift is under 24 hours, which is safe for train crews: hours of
 * service are capped well below that. A run that genuinely exceeded 24 hours
 * would be misread, so the assumption is stated rather than hidden.
 */
export function buildTimestamps(
  recordDate: string,
  times: Partial<Record<TimeField, string>>,
): Record<TimeField, string | null> {
  const result = {} as Record<TimeField, string | null>;
  let currentDate = recordDate;
  let previousMinutes: number | null = null;

  for (const field of TIME_SEQUENCE) {
    const raw = times[field]?.trim();
    if (!raw) {
      result[field] = null; // blank means not recorded — never 0, never today
      continue;
    }

    const minutes = parseTimeOfDay(raw);
    if (minutes === null) {
      result[field] = null;
      continue;
    }

    if (previousMinutes !== null && minutes < previousMinutes) {
      currentDate = addDays(currentDate, 1);
    }

    result[field] = toIsoTimestamp(currentDate, minutes);
    previousMinutes = minutes;
  }

  return result;
}

/** Minutes between two ISO timestamps. Display only — the database computes
 *  the real work_minutes and rejects any attempt to write it. */
export function durationMinutes(
  onDuty: string | null,
  offDuty: string | null,
): number | null {
  if (!onDuty || !offDuty) return null;
  const start = Date.parse(`${onDuty}Z`);
  const end = Date.parse(`${offDuty}Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return null;
  return Math.round((end - start) / 60000);
}
