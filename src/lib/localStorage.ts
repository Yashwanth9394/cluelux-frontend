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
 * Get today's date in ET timezone (YYYY-MM-DD format)
 */
function getTodayET(): string {
  const etDate = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Parse MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = etDate.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Load stats from localStorage with defaults
 */
export function loadStats(): GameStats {
  const today = getTodayET();

  try {
    const data = localStorage.getItem(STATS_KEY);
    if (data) {
      const stats = JSON.parse(data);

      // Initialize practice stats with defaults if missing
      const practice = stats.practice ?? {
        totalGames: 0,
        wins: 0,
        losses: 0,
        hintsUsed: 0,
        avgHintsPerGame: 0,
        noHintStreak: 0,
        maxNoHintStreak: 0,
        lastPracticeDate: '',
        gamesPlayedToday: 0,
      };

      // Reset daily practice counter if it's a new day
      if (practice.lastPracticeDate !== today) {
        practice.gamesPlayedToday = 0;
        practice.lastPracticeDate = today;
      }

      // Backward compatibility: add new fields if missing
      return {
        ...stats,
        noHintStreak: stats.noHintStreak ?? 0,
        maxNoHintStreak: stats.maxNoHintStreak ?? 0,
        practice,
      };
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
    noHintStreak: 0,
    maxNoHintStreak: 0,
    practice: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      hintsUsed: 0,
      avgHintsPerGame: 0,
      noHintStreak: 0,
      maxNoHintStreak: 0,
      lastPracticeDate: today,
      gamesPlayedToday: 0,
    },
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
  const usedNoHints = gameState.hintsRevealed === 0;
  const isPracticeMode = gameState.gameMode === 'practice';

  // PRACTICE MODE: Update separate stats
  if (isPracticeMode) {
    const today = getTodayET();
    const practice = previousStats.practice || {
      totalGames: 0,
      wins: 0,
      losses: 0,
      hintsUsed: 0,
      avgHintsPerGame: 0,
      noHintStreak: 0,
      maxNoHintStreak: 0,
      lastPracticeDate: today,
      gamesPlayedToday: 0,
    };

    const newPracticeTotalGames = practice.totalGames + 1;
    const newPracticeHintsUsed = practice.hintsUsed + gameState.hintsRevealed;
    const newPracticeNoHintStreak = isWin && usedNoHints
      ? practice.noHintStreak + 1
      : 0;

    // Reset counter if it's a new day
    const isNewDay = practice.lastPracticeDate !== today;
    const newGamesPlayedToday = isNewDay ? 1 : practice.gamesPlayedToday + 1;

    return {
      ...previousStats,  // Keep daily stats unchanged
      practice: {
        totalGames: newPracticeTotalGames,
        wins: practice.wins + (isWin ? 1 : 0),
        losses: practice.losses + (isWin ? 0 : 1),
        hintsUsed: newPracticeHintsUsed,
        avgHintsPerGame: newPracticeHintsUsed / newPracticeTotalGames,
        noHintStreak: newPracticeNoHintStreak,
        maxNoHintStreak: Math.max(practice.maxNoHintStreak, newPracticeNoHintStreak),
        lastPracticeDate: today,
        gamesPlayedToday: newGamesPlayedToday,
      },
    };
  }

  // DAILY MODE: Update daily stats
  const newHintsUsed = previousStats.hintsUsed + gameState.hintsRevealed;
  const newTotalGames = previousStats.totalGames + 1;
  const newNoHintStreak = isWin && usedNoHints
    ? previousStats.noHintStreak + 1
    : 0;

  return {
    ...previousStats,
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
    noHintStreak: newNoHintStreak,
    maxNoHintStreak: Math.max(previousStats.maxNoHintStreak, newNoHintStreak),
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

/**
 * Get remaining practice games for today (max 5 per day)
 */
export function getRemainingPracticeGames(): number {
  const stats = loadStats();
  const MAX_PRACTICE_GAMES = 5;
  const gamesPlayedToday = stats.practice?.gamesPlayedToday || 0;
  return Math.max(0, MAX_PRACTICE_GAMES - gamesPlayedToday);
}

/**
 * Check if user can start a new practice game
 */
export function canStartPracticeGame(): boolean {
  return getRemainingPracticeGames() > 0;
}
