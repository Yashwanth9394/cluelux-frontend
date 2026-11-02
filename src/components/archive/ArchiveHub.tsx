import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { describeDate, getTodayET } from '../../lib/dates';
import { ArchiveCalendar, type DayTone } from './ArchiveCalendar';
import {
  SPECIAL_DAILY_LIMIT,
  clearAccess,
  getSpecialRemaining,
  getSpecialStartedToday,
  loadPuzzle,
  recordSpecialStart,
  type AccessTier,
} from '../../lib/archiveStore';
import {
  ARCHIVE_WINDOW_DAYS,
  ArchiveUnavailableError,
  fetchArchiveDay,
  getArchiveFloor,
  getSpecialPuzzle,
  getSpecialPoolSize,
  pickSpecialPuzzle,
  type PuzzleData,
} from '../../services/archiveApi';

interface ArchiveHubProps {
  tier: Exclude<AccessTier, 'none'>;
  onPlay: (puzzle: PuzzleData, title: string) => void;
  onSignOut: () => void;
  onBack: () => void;
}

function toneFor(date: string): DayTone {
  const saved = loadPuzzle(`archive:${date}`);
  if (!saved) return 'new';
  if (saved.status === 'won') return 'won';
  if (saved.status === 'lost') return 'lost';
  return 'playing';
}

export function ArchiveHub({ tier, onPlay, onSignOut, onBack }: ArchiveHubProps) {
  const today = useMemo(() => getTodayET(), []);
  const floor = useMemo(() => getArchiveFloor(), []);
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [, refresh] = useState(0);

  const remaining = getSpecialRemaining(tier);
  const limit = SPECIAL_DAILY_LIMIT[tier];

  // A special puzzle started today but not finished can always be resumed -
  // including one the player opened and left before making a guess, so
  // leaving never costs them another puzzle from the day's allowance.
  const inProgress = getSpecialStartedToday()
    .map((id) => ({ id, saved: loadPuzzle(`special:${id}`) }))
    .find((entry) => !entry.saved || entry.saved.status === 'playing');

  const playDay = async (date: string) => {
    setError('');
    setLoadingDate(date);
    try {
      const puzzle = await fetchArchiveDay(date);
      const { weekday, day, month } = describeDate(date);
      onPlay(puzzle, `${weekday} ${day} ${month}`);
    } catch (e) {
      setError(e instanceof ArchiveUnavailableError ? e.message : 'Something went wrong loading that day.');
    } finally {
      setLoadingDate(null);
    }
  };

  const playSpecial = () => {
    setError('');
    if (inProgress) {
      const resumed = getSpecialPuzzle(inProgress.id);
      if (resumed) return onPlay(resumed, 'Special archive');
    }
    if (remaining <= 0) return;
    const puzzle = pickSpecialPuzzle();
    if (!puzzle) {
      setError('You have played every special puzzle for now. New ones are coming.');
      refresh((n) => n + 1);
      return;
    }
    recordSpecialStart(puzzle.id.replace('special:', ''));
    onPlay(puzzle, 'Special archive');
  };

  const specialDisabled = !inProgress && remaining <= 0;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="-ml-2 h-11 px-3 text-sm">
            <span aria-hidden="true" className="mr-1">←</span> Today's puzzle
          </Button>
          <span className="w-16" aria-hidden="true" />
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        <p className="font-mono text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">Cluelux archive</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Catch up
        </h1>

        <section aria-labelledby="recent-heading" className="mt-6">
          <h2 id="recent-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Pick a day
          </h2>
          <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
            <ArchiveCalendar
              today={today}
              floor={floor}
              openDays={ARCHIVE_WINDOW_DAYS}
              toneFor={toneFor}
              loadingDate={loadingDate}
              onSelect={playDay}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            The last {ARCHIVE_WINDOW_DAYS} days are open. Earlier days unlock with a subscription, coming soon.
          </p>
        </section>

        <section aria-labelledby="special-heading" className="mt-8">
          <h2 id="special-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Special archive
          </h2>
          <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Words that never appear as the daily puzzle. A random one each time.
            </p>
            <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">
              {inProgress
                ? 'You have one in progress'
                : `${remaining} of ${limit} left today · ${getSpecialPoolSize()} in the pool`}
            </p>
            <Button onClick={playSpecial} disabled={specialDisabled} className="mt-3 w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-slate-200 disabled:text-slate-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-400">
              {inProgress ? 'Continue your puzzle' : specialDisabled ? 'Come back tomorrow' : 'Play a random word'}
            </Button>
            {specialDisabled && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Sign in with Google for five a day. Coming soon.
              </p>
            )}
          </div>
        </section>

        <p role="alert" className="mt-4 min-h-5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      </main>
    </div>
  );
}
