/**
 * LocalStorage Manager - Game state and stats persistence
 */

import type { GameState, GameStats } from '../types/game.types';

const GAME_STATE_KEY = 'cluelux_game_state';
const STATS_KEY = 'cluelux_stats';

/**
 * Save game state to localStorage
 */
export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

/**
 * Load game state from localStorage
 */
export function loadGameState(): GameState | null {
  try {
    const data = localStorage.getItem(GAME_STATE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

/**
 * Clear game state from localStorage
 */
export function clearGameState(): void {
  try {
    localStorage.removeItem(GAME_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear game state:', error);
  }
}

/**
 * Save stats to localStorage
 */
export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

/**
 * Load stats from localStorage with defaults
 */
export function loadStats(): GameStats {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
  
  // Return default stats
  return {
    totalGames: 0,
    wins: 0,
    losses: 0,
    currentStreak: 0,
    maxStreak: 0,
    hintsUsed: 0,
    avgHintsPerGame: 0,
    winDistribution: {},
    lastPlayed: '',
  };
}

/**
 * Update stats based on completed game
 */
export function updateStats(
  previousStats: GameStats,
  gameState: GameState
): GameStats {
  const isWin = gameState.gameStatus === 'won';
  const attemptsUsed = gameState.guesses.length;
  const newHintsUsed = previousStats.hintsUsed + gameState.hintsRevealed;
  const newTotalGames = previousStats.totalGames + 1;
  
  return {
    totalGames: newTotalGames,
    wins: previousStats.wins + (isWin ? 1 : 0),
    losses: previousStats.losses + (isWin ? 0 : 1),
    currentStreak: isWin ? previousStats.currentStreak + 1 : 0,
    maxStreak: Math.max(
      previousStats.maxStreak,
      isWin ? previousStats.currentStreak + 1 : previousStats.currentStreak
    ),
    hintsUsed: newHintsUsed,
    avgHintsPerGame: newHintsUsed / newTotalGames,
    winDistribution: {
      ...previousStats.winDistribution,
      [attemptsUsed]: (previousStats.winDistribution[attemptsUsed] || 0) + (isWin ? 1 : 0),
    },
    lastPlayed: gameState.date,
  };
}

/**
 * Check if today's game has been played
 */
export function hasTodayBeenPlayed(todayDate: string): boolean {
  const state = loadGameState();
  return state !== null && state.date === todayDate && state.gameStatus !== 'playing';
}

/**
 * Check if current game is from today
 */
export function isCurrentGameToday(todayDate: string): boolean {
  const state = loadGameState();
  return state !== null && state.date === todayDate;
}
