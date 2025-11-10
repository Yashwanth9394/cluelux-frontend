/**
 * Hint Manager - Progressive hint unlock and management
 */

import type { HintState } from '../types/game.types';

/**
 * Get hint unlock schedule for a word length
 * Returns array of attempt numbers when hints unlock
 */
export function getHintUnlockSchedule(wordLength: number): number[] {
  const schedules: Record<number, number[]> = {
    5: [0, 1, 2, 3, 4, 5],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 6],
    8: [0, 1, 2, 4, 6, 8],
  };
  return schedules[wordLength] || [0, 1, 2, 3, 4, 5];
}

/**
 * Get number of hints that should be available
 */
export function getAvailableHintsCount(
  wrongAttempts: number,
  wordLength: number
): number {
  const schedule = getHintUnlockSchedule(wordLength);
  return schedule.filter(attempt => attempt <= wrongAttempts).length;
}

/**
 * Check if a hint should be revealed at this attempt
 */
export function shouldRevealHint(
  attemptNumber: number,
  wordLength: number
): boolean {
  const schedule = getHintUnlockSchedule(wordLength);
  return schedule.includes(attemptNumber);
}

/**
 * Initialize hints from string array
 */
export function initializeHints(hints: string[]): HintState[] {
  return hints.map((text, index) => ({
    index,
    text,
    unlocked: index === 0, // First hint unlocked at start
    revealed: index === 0, // First hint revealed at start
  }));
}

/**
 * Update hint states based on wrong attempts
 */
export function updateHintStates(
  hintStates: HintState[],
  wrongAttempts: number,
  wordLength: number
): HintState[] {
  const availableCount = getAvailableHintsCount(wrongAttempts, wordLength);
  
  return hintStates.map((hint, index) => ({
    ...hint,
    unlocked: index < availableCount,
  }));
}

/**
 * Reveal a specific hint
 */
export function revealHint(
  hintStates: HintState[],
  hintIndex: number
): HintState[] {
  return hintStates.map((hint, index) =>
    index === hintIndex ? { ...hint, revealed: true } : hint
  );
}

/**
 * Get count of revealed hints
 */
export function getRevealedHintsCount(hintStates: HintState[]): number {
  return hintStates.filter(hint => hint.revealed).length;
}

/**
 * Check if all hints are revealed
 */
export function areAllHintsRevealed(hintStates: HintState[]): boolean {
  return hintStates.every(hint => hint.revealed);
}
