/**
 * Game Engine - Core game logic and evaluation
 */

import type { TileState, KeyState } from '../types/game.types';
import { isValidWord, normalizeWord } from './validationEngine';

/**
 * Evaluate a guess against the answer
 * Returns array of tile states for each letter
 */
export function evaluateGuess(guess: string, answer: string): TileState[] {
  const guessNorm = normalizeWord(guess);
  const answerNorm = normalizeWord(answer);
  
  const result: TileState[] = new Array(guessNorm.length).fill('absent');
  const answerChars = answerNorm.split('');
  const guessChars = guessNorm.split('');
  const usedIndices = new Set<number>();

  // First pass: mark correct positions
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = 'correct';
      usedIndices.add(i);
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < guessChars.length; i++) {
    if (result[i] !== 'correct') {
      for (let j = 0; j < answerChars.length; j++) {
        if (!usedIndices.has(j) && guessChars[i] === answerChars[j]) {
          result[i] = 'present';
          usedIndices.add(j);
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Check if the guess is a winning guess
 */
export function isWinningGuess(evaluation: TileState[]): boolean {
  return evaluation.every(state => state === 'correct');
}

/**
 * Get maximum attempts allowed for a word length
 * Always returns 6 attempts regardless of word length
 */
export function getMaxAttempts(wordLength: number): number {
  return 6;
}

/**
 * Update keyboard state based on guess and evaluation
 */
export function updateKeyboardState(
  currentStates: Record<string, KeyState>,
  guess: string,
  evaluation: TileState[]
): Record<string, KeyState> {
  const newStates = { ...currentStates };
  const guessNorm = normalizeWord(guess);
  
  guessNorm.split('').forEach((letter, i) => {
    const currentState = newStates[letter] || 'unused';
    const newState = evaluation[i] as KeyState;
    
    // Priority: correct > present > absent > unused
    if (newState === 'correct') {
      newStates[letter] = 'correct';
    } else if (newState === 'present' && currentState !== 'correct') {
      newStates[letter] = 'present';
    } else if (newState === 'absent' && currentState === 'unused') {
      newStates[letter] = 'absent';
    }
  });
  
  return newStates;
}

/**
 * Initialize an empty keyboard state
 */
export function initializeKeyboardState(): Record<string, KeyState> {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const state: Record<string, KeyState> = {};
  
  for (const letter of letters) {
    state[letter] = 'unused';
  }
  
  return state;
}

/**
 * Check if a guess is valid
 */
export function validateGuessInput(
  guess: string,
  wordLength: number
): { valid: boolean; error?: string } {
  const trimmed = guess.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Enter a word' };
  }
  
  if (trimmed.length < wordLength) {
    return { valid: false, error: 'Not enough letters' };
  }
  
  if (trimmed.length > wordLength) {
    return { valid: false, error: 'Too many letters' };
  }
  
  if (!/^[A-Za-z]+$/.test(trimmed)) {
    return { valid: false, error: 'Only letters allowed' };
  }
  
  if (!isValidWord(trimmed, wordLength)) {
    return { valid: false, error: 'Not in word list' };
  }
  
  return { valid: true };
}
