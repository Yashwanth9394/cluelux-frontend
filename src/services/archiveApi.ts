/**
 * Archive data sources.
 *
 * Archive days: the backend serves a strictly-past day through `?date=` (on
 * prod too - past words are already revealed, see GetDailyWordHandler.java).
 * The request hits the API Gateway origin directly, bypassing CloudFront,
 * whose cache key ignores the query string. A response whose date doesn't
 * match the one asked for is still treated as "archive unavailable" - never
 * as that day's puzzle - which also stops a future or current day from ever
 * being shown as an archive game.
 *
 * Special puzzles: placeholder pool bundled with this branch. Answers are
 * visible in the bundle, so this moves behind an endpoint before launch.
 */

import { getTodayET } from '../lib/dates';
import { getPlayedSpecialIds } from '../lib/archiveStore';
import specialPack from '../data/special-pack.json';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
// Archive asks for a specific past day via ?date=. That must bypass CloudFront:
// its cache key ignores the query string, so a dated response could be cached
// and served to everyone as "today". Hit the API Gateway origin directly.
const DIRECT_API_URL = API_BASE_URL.includes('cloudfront.net')
  ? 'https://qp5p347l9l.execute-api.us-east-1.amazonaws.com/prod'
  : API_BASE_URL;

export interface PuzzleData {
  /** Storage id: `archive:2026-11-03` or `special:anchor`. */
  id: string;
  kind: 'archive' | 'special';
  label: string;
  answer: string;
  hints: string[];
}

/** First day a real puzzle exists (matches the game numbering in api.ts). */
export const LAUNCH_DATE = '2026-11-01';

/** How many of the most recent finished days are open to signed-in players. */
export const ARCHIVE_WINDOW_DAYS = 3;

/** Earliest date the archive can show. Local sample builds have no launch limit. */
export function getArchiveFloor(): string {
  return import.meta.env.DEV && import.meta.env.VITE_ARCHIVE_SOURCE === 'local' ? '2000-01-01' : LAUNCH_DATE;
}

// A real day always carries five hints; the backend's placeholder for a day
// with no word ("LIGHT") carries three, so it can be told apart.
const REAL_HINT_COUNT = 5;

export class ArchiveUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ArchiveUnavailableError';
  }
}

/** Local sample data - dev builds only, so it never reaches a production bundle. */
async function loadSampleArchiveDay(date: string): Promise<PuzzleData | null> {
  if (!import.meta.env.DEV || import.meta.env.VITE_ARCHIVE_SOURCE !== 'local') return null;
  const sample = (await import('../data/archive-sample.json')).default;
  const index = Math.abs(Number(date.replace(/-/g, ''))) % sample.length;
  const pick = sample[index];
  return {
    id: `archive:${date}`,
    kind: 'archive',
    label: date,
    answer: pick.word,
    hints: pick.hints,
  };
}

export async function fetchArchiveDay(date: string): Promise<PuzzleData> {
  if (date >= getTodayET()) {
    throw new ArchiveUnavailableError('Only finished days are in the archive.');
  }
  if (date < getArchiveFloor()) {
    throw new ArchiveUnavailableError('There was no puzzle on that day.');
  }

  const sample = await loadSampleArchiveDay(date);
  if (sample) return sample;

  const response = await fetch(`${DIRECT_API_URL}/daily-word?date=${date}`, {
    method: 'GET',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new ArchiveUnavailableError('The archive could not be reached. Try again in a moment.');
  }

  const data = await response.json();
  if (
    data.date !== date ||
    !data.word ||
    !Array.isArray(data.hints) ||
    data.hints.length < REAL_HINT_COUNT
  ) {
    throw new ArchiveUnavailableError('This day is not in the archive yet.');
  }

  return {
    id: `archive:${date}`,
    kind: 'archive',
    label: date,
    answer: String(data.word).toUpperCase(),
    hints: data.hints,
  };
}

/** Picks one special puzzle at random from those this browser hasn't opened yet. */
export function pickSpecialPuzzle(): PuzzleData | null {
  const played = new Set(getPlayedSpecialIds());
  const pool = specialPack.filter((p) => !played.has(p.id));
  if (pool.length === 0) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: `special:${pick.id}`,
    kind: 'special',
    label: 'Special archive',
    answer: pick.word,
    hints: pick.hints,
  };
}

/** Looks up a special puzzle by its short id, e.g. to resume one already started. */
export function getSpecialPuzzle(shortId: string): PuzzleData | null {
  const found = specialPack.find((p) => p.id === shortId);
  if (!found) return null;
  return {
    id: `special:${found.id}`,
    kind: 'special',
    label: 'Special archive',
    answer: found.word,
    hints: found.hints,
  };
}

export function getSpecialPoolSize(): number {
  return specialPack.length;
}
