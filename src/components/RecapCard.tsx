import type { TileState } from '../types/game.types';

interface RecapCardProps {
  status: 'won' | 'lost';
  guesses: string[];
  evaluations: TileState[][];
  hintsRevealed: number;
  totalHints: number;
  maxGuesses: number;
}

const TILE_CLASS: Record<TileState, string> = {
  correct: 'bg-emerald-500 text-white',
  present: 'bg-amber-500 text-white',
  absent: 'bg-slate-400 text-white dark:bg-slate-600',
  filled: 'bg-slate-300 text-slate-900',
  empty: 'bg-slate-200 text-slate-900',
};

/**
 * What the player did, at a glance: one light per hint (lit = opened) and
 * their guesses as a small colored grid.
 */
export function RecapCard({ status, guesses, evaluations, hintsRevealed, totalHints, maxGuesses }: RecapCardProps) {
  const headline =
    status === 'won'
      ? `Solved in ${guesses.length} of ${maxGuesses}`
      : `Not solved in ${maxGuesses}`;
  const hintLabel =
    hintsRevealed === 0
      ? 'No hints used'
      : `${hintsRevealed} of ${totalHints} hints used`;

  return (
    <section
      aria-label="Your result"
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-left"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {headline}
        </p>
        <div
          role="img"
          aria-label={hintLabel}
          className="flex items-center gap-1.5 shrink-0"
        >
          {Array.from({ length: totalHints }, (_, i) => (
            <span
              key={i}
              className={
                i < hintsRevealed
                  ? 'h-2.5 w-2.5 rounded-full bg-lux shadow-[0_0_8px_2px_rgba(245,184,61,0.55)]'
                  : 'h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700'
              }
            />
          ))}
        </div>
      </div>
      <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{hintLabel}</p>

      <div className="mt-3 flex flex-col gap-[3px]" aria-hidden="true">
        {guesses.map((guess, row) => (
          <div key={row} className="flex gap-[3px]">
            {guess.split('').map((letter, col) => (
              <span
                key={col}
                className={`flex-1 max-w-[28px] aspect-square rounded-[4px] grid place-items-center text-[11px] font-bold ${
                  TILE_CLASS[evaluations[row]?.[col] ?? 'empty']
                }`}
              >
                {letter}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
