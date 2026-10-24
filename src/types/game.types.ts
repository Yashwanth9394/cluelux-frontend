/**
 * ClueLux Game Types
 */

export type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';
export type GameStatus = 'playing' | 'won' | 'lost';
export type KeyState = 'unused' | 'correct' | 'present' | 'absent';
export type GameMode = 'daily' | 'practice';

export interface MasterWord {
  id: string;
  word: string;
  length: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  used: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export interface DailyChallenge {
  date: string;
  gameNumber: number;
  wordLength: number;
  answer: string;
  answerLower: string;
  hints: string[];
  validWords: string[];
  metadata: {
    difficulty: string;
    category: string;
    generatedAt: string;
  };
}

export interface GameState {
  date: string;
  gameNumber: number;
  gameMode: GameMode;
  guesses: string[];
  evaluations: TileState[][];
  hintsRevealed: number;
  hintsUsedPerGuess?: boolean[]; // Track if hint was used before each guess
  gameStatus: GameStatus;
  startTime: number;
  endTime?: number;
  wordLength: number;
}

export interface GameStats {
  // Daily game stats
  totalGames: number;
  wins: number;
  losses: number;
  currentStreak: number;
  maxStreak: number;
  hintsUsed: number;
  avgHintsPerGame: number;
  winDistribution: Record<number, number>;
  lastPlayed: string;

  // No hint streak tracking (daily games only)
  noHintStreak: number;
  maxNoHintStreak: number;

  // Practice mode stats (completely separate)
  practice?: {
    totalGames: number;
    wins: number;
    losses: number;
    hintsUsed: number;
    avgHintsPerGame: number;
    noHintStreak: number;
    maxNoHintStreak: number;
    // Daily practice limit tracking
    lastPracticeDate: string;
    gamesPlayedToday: number;
  };
}

export interface HintState {
  index: number;
  text: string;
  unlocked: boolean;
  revealed: boolean;
}

export interface ValidWordList {
  length: number;
  count: number;
  words: string[];
  extracted: string;
}
