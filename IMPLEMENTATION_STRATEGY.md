# 🛠️ ClueLux Implementation Strategy

## Overview
This document outlines the step-by-step implementation approach for transforming the Wordle-like Game Mocks project into ClueLux.

---

## Architecture Decisions

### ✅ Chosen Approach: Static-First with Build-Time Generation

**Why This Works:**
1. **Zero Runtime Costs**: No server required, no API calls during gameplay
2. **Instant Loading**: All data pre-bundled, no network latency
3. **Scalability**: Static hosting scales infinitely for free
4. **Reliability**: No backend = no backend failures
5. **Simple Deployment**: Just push to GitHub, auto-deploys

**Trade-offs:**
- Must rebuild daily (automated via GitHub Actions)
- Can't dynamically adjust hints based on user performance
- Word list must be pre-defined

---

## Phase-by-Phase Implementation

### ✅ Phase 1: Data Setup (PRIORITY 1)

#### Step 1.1: Create Data Directory Structure
```bash
mkdir -p src/data/words
mkdir -p scripts/utils
```

#### Step 1.2: Extract Word Lists from WordleAI
Create `scripts/extract_wordlists.ts`:
- Read validGuesses_5.ts through validGuesses_8.ts
- Convert TypeScript exports to JSON
- Add metadata (count, length)
- Validate uniqueness

**Output Files:**
- `src/data/words/valid_5_letter.json`
- `src/data/words/valid_6_letter.json`
- `src/data/words/valid_7_letter.json`
- `src/data/words/valid_8_letter.json`

#### Step 1.3: Create Master Word List
Create `scripts/create_master_words.ts`:
- Curate 500-1000 high-quality answer words
- Add metadata (difficulty, category, first/last used)
- Generate UUIDs for tracking
- Export as `src/data/words/master_words.json`

**Initial Categories:**
- Animals (dog, cat, elephant, serpent)
- Objects (table, chair, laptop, bottle)
- Actions (jump, run, think, create)
- Nature (ocean, river, forest, mountain)
- Abstract (love, peace, truth, dream)

#### Step 1.4: Create TypeScript Types
Create `src/types/game.types.ts`:
```typescript
export type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';
export type GameStatus = 'playing' | 'won' | 'lost';
export type KeyState = 'unused' | 'correct' | 'present' | 'absent';

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
  guesses: string[];
  evaluations: TileState[][];
  hintsRevealed: number;
  gameStatus: GameStatus;
  startTime: number;
  endTime?: number;
  wordLength: number;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  currentStreak: number;
  maxStreak: number;
  hintsUsed: number;
  avgHintsPerGame: number;
  winDistribution: Record<number, number>;
  lastPlayed: string;
}
```

---

### ✅ Phase 2: Core Game Engine (PRIORITY 1)

#### Step 2.1: Create Validation Engine
Create `src/lib/validationEngine.ts`:
```typescript
import valid5 from '../data/words/valid_5_letter.json';
import valid6 from '../data/words/valid_6_letter.json';
import valid7 from '../data/words/valid_7_letter.json';
import valid8 from '../data/words/valid_8_letter.json';

const validWordSets = {
  5: new Set(valid5.words),
  6: new Set(valid6.words),
  7: new Set(valid7.words),
  8: new Set(valid8.words),
};

export function isValidWord(word: string, length: number): boolean {
  const normalized = word.toLowerCase();
  return validWordSets[length]?.has(normalized) || false;
}

export function normalizeWord(word: string): string {
  return word.toUpperCase().trim();
}

export function checkWordLength(word: string, expectedLength: number): boolean {
  return word.length === expectedLength;
}
```

#### Step 2.2: Create Game Engine
Create `src/lib/gameEngine.ts`:
```typescript
import type { TileState, GameState, DailyChallenge } from '../types/game.types';
import { isValidWord, normalizeWord } from './validationEngine';

export function evaluateGuess(guess: string, answer: string): TileState[] {
  const result: TileState[] = new Array(guess.length).fill('absent');
  const answerChars = answer.split('');
  const guessChars = guess.split('');
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

export function isWinningGuess(evaluation: TileState[]): boolean {
  return evaluation.every(state => state === 'correct');
}

export function getMaxAttempts(wordLength: number): number {
  const maxAttemptsMap = {
    5: 6,
    6: 7,
    7: 8,
    8: 9,
  };
  return maxAttemptsMap[wordLength] || 6;
}

export function updateKeyboardState(
  currentStates: Record<string, TileState>,
  guess: string,
  evaluation: TileState[]
): Record<string, TileState> {
  const newStates = { ...currentStates };
  
  guess.split('').forEach((letter, i) => {
    const currentState = newStates[letter] || 'absent';
    const newState = evaluation[i];
    
    // Priority: correct > present > absent
    if (newState === 'correct' || 
        (newState === 'present' && currentState !== 'correct')) {
      newStates[letter] = newState;
    } else if (!newStates[letter]) {
      newStates[letter] = newState;
    }
  });
  
  return newStates;
}
```

#### Step 2.3: Create Hint Manager
Create `src/lib/hintManager.ts`:
```typescript
export function getHintUnlockSchedule(wordLength: number): number[] {
  const schedules = {
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5],
    7: [1, 2, 3, 4, 6],
    8: [1, 2, 4, 6, 8],
  };
  return schedules[wordLength] || [1, 2, 3, 4, 5];
}

export function getAvailableHintsCount(
  wrongAttempts: number,
  wordLength: number
): number {
  const schedule = getHintUnlockSchedule(wordLength);
  return schedule.filter(attempt => attempt <= wrongAttempts).length;
}

export function shouldRevealHint(
  attemptNumber: number,
  wordLength: number
): boolean {
  const schedule = getHintUnlockSchedule(wordLength);
  return schedule.includes(attemptNumber);
}

export interface HintState {
  index: number;
  text: string;
  unlocked: boolean;
  revealed: boolean;
}

export function initializeHints(hints: string[]): HintState[] {
  return hints.map((text, index) => ({
    index,
    text,
    unlocked: false,
    revealed: false,
  }));
}

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
```

---

### ✅ Phase 3: Enhanced localStorage (PRIORITY 1)

Create `src/lib/localStorage.ts`:
```typescript
import type { GameState, GameStats } from '../types/game.types';

const GAME_STATE_KEY = 'cluelux_game_state';
const STATS_KEY = 'cluelux_stats';

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(GAME_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save game state:', error);
  }
}

export function loadGameState(): GameState | null {
  try {
    const data = localStorage.getItem(GAME_STATE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load game state:', error);
    return null;
  }
}

export function clearGameState(): void {
  localStorage.removeItem(GAME_STATE_KEY);
}

export function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Failed to save stats:', error);
  }
}

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

export function updateStats(
  previousStats: GameStats,
  gameState: GameState
): GameStats {
  const isWin = gameState.gameStatus === 'won';
  const attemptsUsed = gameState.guesses.length;
  
  return {
    totalGames: previousStats.totalGames + 1,
    wins: previousStats.wins + (isWin ? 1 : 0),
    losses: previousStats.losses + (isWin ? 0 : 1),
    currentStreak: isWin ? previousStats.currentStreak + 1 : 0,
    maxStreak: Math.max(
      previousStats.maxStreak,
      isWin ? previousStats.currentStreak + 1 : 0
    ),
    hintsUsed: previousStats.hintsUsed + gameState.hintsRevealed,
    avgHintsPerGame:
      (previousStats.hintsUsed + gameState.hintsRevealed) /
      (previousStats.totalGames + 1),
    winDistribution: {
      ...previousStats.winDistribution,
      [attemptsUsed]: (previousStats.winDistribution[attemptsUsed] || 0) + (isWin ? 1 : 0),
    },
    lastPlayed: gameState.date,
  };
}
```

---

### ✅ Phase 4: Build Scripts (PRIORITY 2)

#### Step 4.1: Hint Generator with OpenAI
Create `scripts/hint_generator.ts`:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateHints(word: string): Promise<string[]> {
  const prompt = `You are a creative hint writer for a word guessing game. Generate exactly 5 progressive hints for the word "${word}".

Rules:
1. Each hint should be more specific than the last
2. First 3 hints should be broad and thematic
3. Hint 4 should give structural clues (rhymes with, category)
4. Hint 5 should give letter clues (first letter, last letter, length)
5. Keep hints under 15 words each
6. Make them clever and engaging, not boring
7. Use emojis sparingly to add visual interest
8. Never reveal the exact word

Format your response as a JSON array of exactly 5 strings.

Example for "OCEAN":
[
  "🌊 Covers most of our planet's surface.",
  "🐠 Home to countless marine creatures.",
  "⛵ Sailors navigate its vast expanse.",
  "💙 Rhymes with 'motion', sounds like 'potion'.",
  "🔤 5 letters: starts with 'O', ends with 'N'."
]`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No content in response');

    const hints = JSON.parse(content);
    
    if (!Array.isArray(hints) || hints.length !== 5) {
      throw new Error('Invalid hint format');
    }

    return hints;
  } catch (error) {
    console.error('Failed to generate hints with OpenAI:', error);
    return generateFallbackHints(word);
  }
}

function generateFallbackHints(word: string): string[] {
  const length = word.length;
  const vowels = word.match(/[aeiou]/gi)?.length || 0;
  const consonants = length - vowels;
  
  return [
    `This is a common ${length}-letter word.`,
    `It contains ${vowels} vowel${vowels !== 1 ? 's' : ''} and ${consonants} consonant${consonants !== 1 ? 's' : ''}.`,
    `Think carefully about words in this category.`,
    `The word starts with '${word[0].toUpperCase()}' and ends with '${word[length - 1].toUpperCase()}'.`,
    `It's spelled: ${word.split('').map((_, i) => i === 0 || i === length - 1 ? word[i].toUpperCase() : '_').join(' ')}`,
  ];
}
```

#### Step 4.2: Word Selector
Create `scripts/word_selector.ts`:
```typescript
import fs from 'fs/promises';
import path from 'path';
import type { MasterWord } from '../src/types/game.types';

export async function selectDailyWord(): Promise<MasterWord> {
  const masterWordsPath = path.join(
    process.cwd(),
    'src/data/words/master_words.json'
  );
  
  const data = await fs.readFile(masterWordsPath, 'utf-8');
  const words: MasterWord[] = JSON.parse(data);
  
  // Find unused words
  const unusedWords = words.filter(w => !w.used);
  
  if (unusedWords.length === 0) {
    // Reset all words if we've used them all
    words.forEach(w => {
      w.used = false;
      w.lastUsed = null;
    });
    await fs.writeFile(masterWordsPath, JSON.stringify(words, null, 2));
    return selectDailyWord(); // Recursive call
  }
  
  // Select randomly from unused words
  const selectedWord = unusedWords[Math.floor(Math.random() * unusedWords.length)];
  
  // Mark as used
  const wordIndex = words.findIndex(w => w.id === selectedWord.id);
  words[wordIndex].used = true;
  words[wordIndex].lastUsed = new Date().toISOString();
  
  // Save updated list
  await fs.writeFile(masterWordsPath, JSON.stringify(words, null, 2));
  
  return words[wordIndex];
}
```

#### Step 4.3: Data Bundler
Create `scripts/data_bundler.ts`:
```typescript
import fs from 'fs/promises';
import path from 'path';
import type { DailyChallenge, MasterWord } from '../src/types/game.types';

export async function bundleDailyChallenge(
  word: MasterWord,
  hints: string[]
): Promise<void> {
  // Load valid words for this length
  const validWordsPath = path.join(
    process.cwd(),
    `src/data/words/valid_${word.length}_letter.json`
  );
  
  const validWordsData = await fs.readFile(validWordsPath, 'utf-8');
  const validWords = JSON.parse(validWordsData).words;
  
  // Calculate game number (days since Jan 1, 2025)
  const startDate = new Date('2025-01-01');
  const today = new Date();
  const gameNumber = Math.floor(
    (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const dailyChallenge: DailyChallenge = {
    date: today.toISOString().split('T')[0],
    gameNumber,
    wordLength: word.length,
    answer: word.word.toUpperCase(),
    answerLower: word.word.toLowerCase(),
    hints,
    validWords,
    metadata: {
      difficulty: word.difficulty,
      category: word.category,
      generatedAt: new Date().toISOString(),
    },
  };
  
  // Write to today.json
  const outputPath = path.join(process.cwd(), 'src/data/today.json');
  await fs.writeFile(outputPath, JSON.stringify(dailyChallenge, null, 2));
  
  console.log('✅ Daily challenge generated:');
  console.log(`   Date: ${dailyChallenge.date}`);
  console.log(`   Game #: ${dailyChallenge.gameNumber}`);
  console.log(`   Word: ${dailyChallenge.answer} (${word.length} letters)`);
  console.log(`   Hints: ${hints.length} generated`);
}
```

#### Step 4.4: Main Build Script
Create `scripts/daily_build.ts`:
```typescript
import { selectDailyWord } from './word_selector';
import { generateHints } from './hint_generator';
import { bundleDailyChallenge } from './data_bundler';

async function main() {
  console.log('🚀 Starting daily challenge generation...\n');
  
  try {
    // Step 1: Select word
    console.log('📝 Selecting daily word...');
    const word = await selectDailyWord();
    console.log(`✅ Selected: ${word.word.toUpperCase()} (${word.length} letters)\n`);
    
    // Step 2: Generate hints
    console.log('💡 Generating hints with AI...');
    const hints = await generateHints(word.word);
    console.log(`✅ Generated ${hints.length} hints\n`);
    
    // Step 3: Bundle data
    console.log('📦 Bundling daily challenge...');
    await bundleDailyChallenge(word, hints);
    console.log('✅ Daily challenge ready!\n');
    
    console.log('🎉 Build complete! Deploy to production.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

main();
```

---

### ✅ Phase 5: UI Components (PRIORITY 2)

#### Step 5.1: HintDisplay Component
Create `src/components/HintDisplay.tsx`:
```typescript
import { Lock, Lightbulb, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { HintState } from '../lib/hintManager';

interface HintDisplayProps {
  hints: HintState[];
  onRevealHint: (index: number) => void;
}

export function HintDisplay({ hints, onRevealHint }: HintDisplayProps) {
  return (
    <div className="space-y-2 w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Hints
        </h3>
        <span className="text-sm text-gray-500">
          {hints.filter(h => h.revealed).length}/{hints.length} revealed
        </span>
      </div>
      
      {hints.map((hint) => (
        <Card
          key={hint.index}
          className={`p-4 transition-all ${
            hint.revealed
              ? 'bg-blue-50 border-blue-200'
              : hint.unlocked
              ? 'bg-gray-50 border-gray-200 hover:border-blue-300'
              : 'bg-gray-100 border-gray-300 opacity-50'
          }`}
        >
          <div className="flex items-center justify-between">
            {hint.revealed ? (
              <p className="text-sm">{hint.text}</p>
            ) : hint.unlocked ? (
              <>
                <p className="text-sm text-gray-500 italic">Click to reveal hint {hint.index + 1}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRevealHint(hint.index)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">Hint {hint.index + 1} locked</p>
                <Lock className="h-4 w-4 text-gray-400" />
              </>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

---

### ✅ Phase 6: Main App Integration (PRIORITY 1)

Update `src/App.tsx` to integrate all new systems (will be done in next step).

---

## Summary of Approach

### What Makes This Work:
1. **Static Data**: All words and valid guesses are pre-bundled
2. **Daily Rebuild**: GitHub Actions runs daily at midnight to generate new challenge
3. **No Runtime Deps**: Game runs 100% offline after initial load
4. **Progressive Enhancement**: Start with 5-letter words, add more lengths later

### Development Order:
1. ✅ Setup data structure
2. ✅ Create core game logic (engine, validation, hints)
3. ✅ Build daily generation scripts
4. ✅ Update UI components
5. ✅ Integrate everything in App.tsx
6. ✅ Setup GitHub Actions
7. ✅ Deploy & test

### Next Steps:
Run these commands in order:
```bash
# 1. Install dependencies
npm install openai zod date-fns

# 2. Extract word lists
npm run extract-words

# 3. Create master words
npm run create-master

# 4. Generate first challenge
npm run daily-build

# 5. Test locally
npm run dev

# 6. Build for production
npm run build
```

---

**Ready to start implementation!** 🚀
