/**
 * Date helpers for the archive. Every date is a YYYY-MM-DD string on the
 * ET calendar (the same day boundary the daily puzzle uses), and all
 * arithmetic goes through UTC so the player's own time zone never shifts a day.
 */

export function getTodayET(): string {
  const etDate = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [month, day, year] = etDate.split('/');
  return `${year}-${month}-${day}`;
}

/** Shift a YYYY-MM-DD date by a whole number of days (negative = earlier). */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

/** The N most recent finished days, newest first (yesterday, the day before, ...). */
export function getLastDays(count: number): string[] {
  const today = getTodayET();
  return Array.from({ length: count }, (_, i) => shiftDate(today, -(i + 1)));
}

/** Display parts for a calendar tile, e.g. { weekday: 'Sat', day: 31, month: 'Oct' }. */
export function describeDate(date: string): { weekday: string; day: number; month: string } {
  const [y, m, d] = date.split('-').map(Number);
  const instant = new Date(Date.UTC(y, m - 1, d, 12));
  return {
    weekday: instant.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
    day: d,
    month: instant.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
  };
}
