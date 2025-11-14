/**
 * Validation Engine - Word validation and normalization
 */

import type { ValidWordList } from '../types/game.types';

// Import word lists
import valid5 from '../data/words/valid_5_letter.json';
import valid6 from '../data/words/valid_6_letter.json';
import valid7 from '../data/words/valid_7_letter.json';
import valid8 from '../data/words/valid_8_letter.json';
import valid9 from '../data/words/valid_9_letter.json';
import valid10 from '../data/words/valid_10_letter.json';
import valid11 from '../data/words/valid_11_letter.json';
import valid12 from '../data/words/valid_12_letter.json';

// Type the imports
const valid5List = valid5 as ValidWordList;
const valid6List = valid6 as ValidWordList;
const valid7List = valid7 as ValidWordList;
const valid8List = valid8 as ValidWordList;
const valid9List = valid9 as ValidWordList;
const valid10List = valid10 as ValidWordList;
const valid11List = valid11 as ValidWordList;
const valid12List = valid12 as ValidWordList;

// Create word sets for fast lookup
const validWordSets: Record<number, Set<string>> = {
  5: new Set(valid5List.words),
  6: new Set(valid6List.words),
  7: new Set(valid7List.words),
  8: new Set(valid8List.words),
  9: new Set(valid9List.words),
  10: new Set(valid10List.words),
  11: new Set(valid11List.words),
  12: new Set(valid12List.words),
};

/**
 * Check if a word is valid for the given length
 */
export function isValidWord(word: string, length: number): boolean {
  const normalized = word.toLowerCase().trim();
  const wordSet = validWordSets[length];
  
  if (!wordSet) {
    console.error(`No word set found for length ${length}`);
    return false;
  }
  
  return wordSet.has(normalized);
}

/**
 * Normalize a word to uppercase and trimmed
 */
export function normalizeWord(word: string): string {
  return word.toUpperCase().trim();
}

/**
 * Check if word matches expected length
 */
export function checkWordLength(word: string, expectedLength: number): boolean {
  return word.length === expectedLength;
}

/**
 * Get the valid word list for a given length
 */
export function getValidWords(length: number): string[] {
  const wordSet = validWordSets[length];
  return wordSet ? Array.from(wordSet) : [];
}

/**
 * Get count of valid words for a length
 */
export function getValidWordCount(length: number): number {
  const wordSet = validWordSets[length];
  return wordSet ? wordSet.size : 0;
}
