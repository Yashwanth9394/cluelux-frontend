/**
 * Hint Manager - Progressive hint unlock and management
 */

import type { HintState } from '../types/game.types';

/**
 * Get hint unlock schedule for a word length
 * Returns array of guess numbers when hints unlock
 * First hint (index 0) is unlocked at start
 * Second hint (index 1) unlocks after 1st guess
 * Third hint (index 2) unlocks after 2nd guess, etc.
 */
export function getHintUnlockSchedule(wordLength: number): number[] {
  // Each hint unlocks after the corresponding guess number
  // Hint 0: unlocked at start (0 guesses)
  // Hint 1: unlocked after 1 guess
  // Hint 2: unlocked after 2 guesses, etc.
  const maxHints = 6;
  return Array.from({ length: maxHints }, (_, i) => i);
}

/**
 * Get number of hints that should be unlocked
 * Based on number of guesses made (not wrong attempts)
 */
export function getAvailableHintsCount(
  guessCount: number,
  wordLength: number
): number {
  // First hint is unlocked at start
  // Each subsequent hint unlocks after each guess
  return Math.min(guessCount + 1, 6);
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
 * Update hint states based on number of guesses made
 */
export function updateHintStates(
  hintStates: HintState[],
  guessCount: number,
  wordLength: number
): HintState[] {
  const availableCount = getAvailableHintsCount(guessCount, wordLength);
  
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
