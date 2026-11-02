import { getUser } from '../lib/auth';
import { loadGameState, saveGameState, loadStats, saveStats } from '../lib/localStorage';
import type { GameState, GameStats } from '../types/game.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DIRECT_API_URL = API_BASE_URL.includes('cloudfront.net')
  ? 'https://qp5p347l9l.execute-api.us-east-1.amazonaws.com/prod'
  : API_BASE_URL;

export async function pushProgress(): Promise<void> {
  const user = getUser();
  if (!user) return;

  const gameState = loadGameState();
  const stats = loadStats();

  try {
    await fetch(`${DIRECT_API_URL}/sync?email=${encodeURIComponent(user.email)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        gameState: gameState ? JSON.stringify(gameState) : null,
        stats: JSON.stringify(stats),
        name: user.name,
        picture: user.picture,
      }),
    });
  } catch (e) {
    console.error('Failed to push progress:', e);
  }
}

export async function pullProgress(): Promise<{ merged: boolean }> {
  const user = getUser();
  if (!user) return { merged: false };

  try {
    const response = await fetch(`${DIRECT_API_URL}/sync?email=${encodeURIComponent(user.email)}`, {
      cache: 'no-store',
    });
    if (!response.ok) return { merged: false };

    const data = await response.json();
    if (!data.exists) return { merged: false };

    if (data.stats) {
      const remoteStats: GameStats = JSON.parse(data.stats);
      const localStats = loadStats();
      const merged = mergeStats(localStats, remoteStats);
      saveStats(merged);
    }

    if (data.gameState) {
      const remoteGame: GameState = JSON.parse(data.gameState);
      const localGame = loadGameState();
      if (!localGame || localGame.date < remoteGame.date) {
        saveGameState(remoteGame);
      }
    }

    return { merged: true };
  } catch (e) {
    console.error('Failed to pull progress:', e);
    return { merged: false };
  }
}

function mergeStats(local: GameStats, remote: GameStats): GameStats {
  return {
    totalGames: Math.max(local.totalGames, remote.totalGames),
    wins: Math.max(local.wins, remote.wins),
    losses: Math.max(local.losses, remote.losses),
    currentStreak: Math.max(local.currentStreak, remote.currentStreak),
    maxStreak: Math.max(local.maxStreak, remote.maxStreak),
    hintsUsed: Math.max(local.hintsUsed, remote.hintsUsed),
    avgHintsPerGame: local.totalGames >= remote.totalGames ? local.avgHintsPerGame : remote.avgHintsPerGame,
    totalGuesses: Math.max(local.totalGuesses || 0, remote.totalGuesses || 0),
    avgGuessesPerGame: local.totalGames >= remote.totalGames ? local.avgGuessesPerGame : remote.avgGuessesPerGame,
    winDistribution: mergeDistributions(local.winDistribution, remote.winDistribution),
    lastPlayed: local.lastPlayed > remote.lastPlayed ? local.lastPlayed : remote.lastPlayed,
    noHintStreak: Math.max(local.noHintStreak || 0, remote.noHintStreak || 0),
    maxNoHintStreak: Math.max(local.maxNoHintStreak || 0, remote.maxNoHintStreak || 0),
    practice: local.practice && remote.practice ? {
      totalGames: Math.max(local.practice.totalGames, remote.practice.totalGames),
      wins: Math.max(local.practice.wins, remote.practice.wins),
      losses: Math.max(local.practice.losses, remote.practice.losses),
      hintsUsed: Math.max(local.practice.hintsUsed, remote.practice.hintsUsed),
      avgHintsPerGame: local.practice.totalGames >= remote.practice.totalGames ? local.practice.avgHintsPerGame : remote.practice.avgHintsPerGame,
      noHintStreak: Math.max(local.practice.noHintStreak, remote.practice.noHintStreak),
      maxNoHintStreak: Math.max(local.practice.maxNoHintStreak, remote.practice.maxNoHintStreak),
      lastPracticeDate: local.practice.lastPracticeDate > remote.practice.lastPracticeDate ? local.practice.lastPracticeDate : remote.practice.lastPracticeDate,
      gamesPlayedToday: local.practice.lastPracticeDate >= remote.practice.lastPracticeDate ? local.practice.gamesPlayedToday : remote.practice.gamesPlayedToday,
    } : (local.practice || remote.practice),
  };
}

function mergeDistributions(a: Record<number, number>, b: Record<number, number>): Record<number, number> {
  const result = { ...a };
  for (const [k, v] of Object.entries(b)) {
    result[Number(k)] = Math.max(result[Number(k)] || 0, v);
  }
  return result;
}
