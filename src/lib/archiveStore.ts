/**
 * Archive storage - access tier, per-puzzle saved games, and the daily
 * special-puzzle allowance. Everything lives in this browser for now; once
 * accounts exist the same shapes move server-side so progress survives
 * cleared data.
 *
 * Archive and special games never touch the daily stats or streak.
 */

import type { TileState } from '../types/game.types';
import { getTodayET } from './dates';

export type AccessTier = 'none' | 'test' | 'google';

/** How many special puzzles each tier may start per day. */
export const SPECIAL_DAILY_LIMIT: Record<Exclude<AccessTier, 'none'>, number> = {
  test: 3,
  google: 5,
};

export interface SavedPuzzle {
  id: string;
  guesses: string[];
  evaluations: TileState[][];
  hintsRevealed: number;
  hintsUsedPerGuess: boolean[];
  status: 'playing' | 'won' | 'lost';
}

const ACCESS_KEY = 'cluelux_access';
const SPECIAL_LOG_KEY = 'cluelux_special_log';
const PUZZLE_PREFIX = 'cluelux_puzzle_';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save archive data:', error);
  }
}

/* ---------- access ---------- */

export function getAccessTier(): AccessTier {
  const stored = read<{ tier: AccessTier }>(ACCESS_KEY);
  return stored?.tier === 'test' || stored?.tier === 'google' ? stored.tier : 'none';
}

export function grantAccess(tier: Exclude<AccessTier, 'none'>): void {
  write(ACCESS_KEY, { tier, grantedAt: Date.now() });
}

export function clearAccess(): void {
  try {
    localStorage.removeItem(ACCESS_KEY);
  } catch {
    // nothing to clean up if storage is unavailable
  }
}

/* ---------- saved puzzles ---------- */

export function loadPuzzle(id: string): SavedPuzzle | null {
  return read<SavedPuzzle>(PUZZLE_PREFIX + id);
}

export function savePuzzle(puzzle: SavedPuzzle): void {
  write(PUZZLE_PREFIX + puzzle.id, puzzle);
}

/** Ids of every special puzzle this browser has already opened. */
export function getPlayedSpecialIds(): string[] {
  const ids: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PUZZLE_PREFIX + 'special:')) {
        ids.push(key.slice((PUZZLE_PREFIX + 'special:').length));
      }
    }
  } catch {
    // an unreadable store just means nothing is excluded
  }
  return ids;
}

/* ---------- daily special allowance ---------- */

interface SpecialLog {
  date: string;
  ids: string[];
}

function loadSpecialLog(): SpecialLog {
  const today = getTodayET();
  const log = read<SpecialLog>(SPECIAL_LOG_KEY);
  return log && log.date === today ? log : { date: today, ids: [] };
}

/** Special puzzles started today (ET). Reopening one already counted does not count again. */
export function getSpecialStartedToday(): string[] {
  return loadSpecialLog().ids;
}

export function recordSpecialStart(id: string): void {
  const log = loadSpecialLog();
  if (!log.ids.includes(id)) {
    write(SPECIAL_LOG_KEY, { ...log, ids: [...log.ids, id] });
  }
}

export function getSpecialRemaining(tier: AccessTier): number {
  if (tier === 'none') return 0;
  return Math.max(0, SPECIAL_DAILY_LIMIT[tier] - getSpecialStartedToday().length);
}
