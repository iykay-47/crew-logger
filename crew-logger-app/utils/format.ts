// Display formatting. The API returns raw values (minutes, ISO strings);
// turning those into something readable is this app's job, and it happens
// here so every screen renders them identically.

/** 450 -> "7h 30m". The API always returns raw minutes. */
export function formatMinutes(minutes: number | null): string {
  if (minutes == null) return '—';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

/** 36289 -> "604.8" — for totals where hours read better than "604h 49m". */
export function formatHours(minutes: number | null): string {
  if (minutes == null) return '—';
  return (minutes / 60).toFixed(1);
}

/** "2026-08-22" -> "22 Aug 2026". Parsed manually rather than via `new
 *  Date(...)`, which interprets a bare YYYY-MM-DD as UTC and can shift the
 *  date by a day depending on the viewer's timezone. */
export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${day} ${months[month - 1]} ${year}`;
}

/** "2026-01" -> "January 2026". */
export function formatMonth(period: string): string {
  const [year, month] = period.split('-').map(Number);
  if (!year || !month) return period;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[month - 1]} ${year}`;
}

/** "2026-08-22T15:15:00" -> "15:15". */
export function formatTime(isoTimestamp: string | null): string {
  if (!isoTimestamp) return '—';
  const timePart = isoTimestamp.split('T')[1];
  return timePart ? timePart.slice(0, 5) : '—';
}

export function formatMiles(miles: number | null): string {
  if (miles == null) return '—';
  return miles.toFixed(1);
}
