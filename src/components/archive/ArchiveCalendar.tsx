import { useState } from 'react';
import { shiftDate } from '../../lib/dates';

export type DayTone = 'new' | 'won' | 'lost' | 'playing';

interface ArchiveCalendarProps {
  /** Today on the ET calendar. Today and later are never selectable. */
  today: string;
  /** Earliest date that has a puzzle. */
  floor: string;
  /** How many finished days (counting back from yesterday) are open. */
  openDays: number;
  /** Saved result for a date, so the calendar can show what was played. */
  toneFor: (date: string) => DayTone;
  /** Date currently loading, if any. */
  loadingDate: string | null;
  onSelect: (date: string) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const TONE_TEXT: Record<DayTone, string> = {
  new: 'not played',
  won: 'solved',
  lost: 'not solved',
  playing: 'in progress',
};

function monthOf(date: string): string {
  return date.slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * A month grid. Only the open window of finished days can be picked;
 * earlier days are shown locked, and today, future days and days before
 * launch are inert.
 */
export function ArchiveCalendar({ today, floor, openDays, toneFor, loadingDate, onSelect }: ArchiveCalendarProps) {
  const openFrom = shiftDate(today, -openDays);
  const earliestMonth = monthOf(floor > shiftDate(today, -365) ? floor : shiftDate(today, -365));
  const latestMonth = monthOf(today);
  const [month, setMonth] = useState(monthOf(shiftDate(today, -1)) < earliestMonth ? latestMonth : monthOf(shiftDate(today, -1)));

  const [year, monthNumber] = month.split('-').map(Number);
  const leadingBlanks = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

  const canGoBack = month > earliestMonth;
  const canGoForward = month < latestMonth;

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="grid h-11 w-11 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <span aria-hidden="true">←</span>
        </button>
        <h3 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white" aria-live="polite">
          {MONTH_NAMES[monthNumber - 1]} {year}
        </h3>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={!canGoForward}
          aria-label="Next month"
          className="grid h-11 w-11 place-items-center rounded-lg text-slate-700 hover:bg-slate-100 disabled:opacity-30 dark:text-slate-200 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center" aria-hidden="true">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="font-mono text-[11px] uppercase text-slate-500 dark:text-slate-400">
            {w}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1" role="group" aria-label={`${MONTH_NAMES[monthNumber - 1]} ${year}`}>
        {Array.from({ length: leadingBlanks }, (_, i) => (
          <span key={`blank-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = `${month}-${String(day).padStart(2, '0')}`;
          const weekday = WEEKDAY_NAMES[(leadingBlanks + i) % 7];
          const label = `${weekday} ${day} ${MONTH_NAMES[monthNumber - 1]}`;

          const isFuture = date >= today;
          const beforeLaunch = date < floor;
          const isOpen = !isFuture && !beforeLaunch && date >= openFrom;
          const isLocked = !isFuture && !beforeLaunch && !isOpen;
          const tone = isOpen ? toneFor(date) : 'new';
          const busy = loadingDate === date;

          if (!isOpen) {
            return (
              <span
                key={date}
                role="img"
                aria-label={`${label}: ${isLocked ? 'locked, unlocks with a subscription' : date === today ? "today's puzzle is on the home screen" : 'not available'}`}
                className={`grid h-11 min-w-0 place-items-center rounded-lg text-sm ${
                  isLocked
                    ? 'text-slate-400 dark:text-slate-600'
                    : 'text-slate-300 dark:text-slate-700'
                }`}
              >
                {day}
              </span>
            );
          }

          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelect(date)}
              disabled={loadingDate !== null}
              aria-label={`${label}: ${TONE_TEXT[tone]}`}
              className={`relative grid h-11 min-w-0 place-items-center rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60 ${
                tone === 'won'
                  ? 'border-emerald-500/50 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'border-indigo-400/60 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-100 dark:hover:bg-indigo-900'
              }`}
            >
              {busy ? '…' : day}
              {tone !== 'new' && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                    tone === 'won' ? 'bg-emerald-500' : tone === 'lost' ? 'bg-slate-400' : 'bg-lux'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
