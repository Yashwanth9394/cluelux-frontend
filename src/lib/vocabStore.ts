const VOCAB_STATE_KEY = 'cluelux_vocab_state';
const VOCAB_HISTORY_KEY = 'cluelux_vocab_history';
const ACTIVE_VIEW_KEY = 'cluelux_active_view';

export interface VocabWordResult {
  word: string;
  won: boolean;
  guesses: number;
  hintsUsed: number;
  timeTakenMs: number;
  date: string;
}

export interface VocabPackState {
  date: string;
  currentWordIndex: number;
  results: VocabWordResult[];
  packComplete: boolean;
  // Per-word game state for the current word
  currentWordState?: {
    guesses: string[];
    evaluations: string[][];
    gameStatus: 'playing' | 'won' | 'lost';
    hintsRevealed: number[];
    startTime: number;
  };
}

export interface VocabHistory {
  words: Record<string, VocabWordPerformance>;
}

export interface VocabWordPerformance {
  word: string;
  attempts: number;
  wins: number;
  totalGuesses: number;
  totalHints: number;
  totalTimeMs: number;
  lastPlayed: string;
  avgGuesses: number;
  avgTimeMs: number;
  needsRevision: boolean;
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export function saveVocabState(state: VocabPackState): void {
  try {
    localStorage.setItem(VOCAB_STATE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadVocabState(): VocabPackState | null {
  try {
    const data = localStorage.getItem(VOCAB_STATE_KEY);
    if (!data) return null;
    const state = JSON.parse(data) as VocabPackState;
    if (state.date !== getTodayDate()) return null;
    return state;
  } catch {
    return null;
  }
}

export function clearVocabState(): void {
  try { localStorage.removeItem(VOCAB_STATE_KEY); } catch {}
}

export function loadVocabHistory(): VocabHistory {
  try {
    const data = localStorage.getItem(VOCAB_HISTORY_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return { words: {} };
}

export function saveVocabHistory(history: VocabHistory): void {
  try {
    localStorage.setItem(VOCAB_HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

export function recordWordResult(result: VocabWordResult): void {
  const history = loadVocabHistory();
  const key = result.word.toUpperCase();
  const prev = history.words[key];

  if (prev) {
    const newAttempts = prev.attempts + 1;
    const newTotalGuesses = prev.totalGuesses + result.guesses;
    const newTotalHints = prev.totalHints + result.hintsUsed;
    const newTotalTime = prev.totalTimeMs + result.timeTakenMs;
    history.words[key] = {
      ...prev,
      attempts: newAttempts,
      wins: prev.wins + (result.won ? 1 : 0),
      totalGuesses: newTotalGuesses,
      totalHints: newTotalHints,
      totalTimeMs: newTotalTime,
      lastPlayed: result.date,
      avgGuesses: newTotalGuesses / newAttempts,
      avgTimeMs: newTotalTime / newAttempts,
      needsRevision: !result.won || result.guesses >= 5 || result.hintsUsed >= 3,
    };
  } else {
    history.words[key] = {
      word: result.word,
      attempts: 1,
      wins: result.won ? 1 : 0,
      totalGuesses: result.guesses,
      totalHints: result.hintsUsed,
      totalTimeMs: result.timeTakenMs,
      lastPlayed: result.date,
      avgGuesses: result.guesses,
      avgTimeMs: result.timeTakenMs,
      needsRevision: !result.won || result.guesses >= 5 || result.hintsUsed >= 3,
    };
  }

  saveVocabHistory(history);
}

export function getRevisionWords(): VocabWordPerformance[] {
  const history = loadVocabHistory();
  return Object.values(history.words)
    .filter(w => w.needsRevision)
    .sort((a, b) => {
      // Priority: lost words first, then by most recent, then by worst performance
      const aScore = (1 - a.wins / a.attempts) * 100 + a.avgGuesses * 10 + a.avgTimeMs / 10000;
      const bScore = (1 - b.wins / b.attempts) * 100 + b.avgGuesses * 10 + b.avgTimeMs / 10000;
      return bScore - aScore;
    });
}

export function saveActiveView(view: string): void {
  try { localStorage.setItem(ACTIVE_VIEW_KEY, view); } catch {}
}

export function loadActiveView(): string | null {
  try { return localStorage.getItem(ACTIVE_VIEW_KEY); } catch { return null; }
}
