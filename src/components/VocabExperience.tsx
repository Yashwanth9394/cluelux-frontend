import { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { Keyboard } from './Keyboard';
import { HintDisplay } from './HintDisplay';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { evaluateGuess, isWinningGuess, getMaxAttempts, updateKeyboardState, initializeKeyboardState, validateGuessInput } from '../lib/gameEngine';
import { initializeHints, revealHint, getRevealedHintsCount } from '../lib/hintManager';
import type { TileState, KeyState, GameStatus, HintState } from '../types/game.types';
import { saveVocabState, loadVocabState, recordWordResult, type VocabPackState, type VocabWordResult } from '../lib/vocabStore';
import { trackGuess, trackHintRevealed, trackGameEnd, trackShare } from '../lib/analytics';
import vocabData from '../data/vocab-words.json';

interface VocabWord {
  word: string;
  wordLength: number;
  difficulty: string;
  category: string;
  hints: string[];
}

// Vocab pack number: days since launch epoch (Nov 1, 2026)
const VOCAB_EPOCH = new Date('2026-11-01T00:00:00').getTime();
function getVocabPackNumber(): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - VOCAB_EPOCH) / 86400000) + 1;
}

function getDailyVocabPack(): VocabWord[] {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const shuffled = [...vocabData].sort((a, b) => {
    const ha = ((seed * 31 + a.word.charCodeAt(0)) % 1000);
    const hb = ((seed * 31 + b.word.charCodeAt(0)) % 1000);
    return ha - hb;
  });
  return shuffled.slice(0, 5) as VocabWord[];
}

function getShareText(results: VocabWordResult[], packNumber: number): string {
  let text = `ClueLux Vocab #${packNumber}\n\n`;
  results.forEach((r, i) => {
    const status = r.won ? `${r.guesses}/6` : 'X/6';
    const hintStr = r.hintsUsed > 0 ? ` (${r.hintsUsed} hints)` : ' (no hints!)';
    text += `${i + 1}. ${r.won ? '✅' : '❌'} ${status}${hintStr}\n`;
  });
  const wins = results.filter(r => r.won).length;
  text += `\n${wins}/5 words solved`;
  text += `\n\nPlay at cluelux.com`;
  return text;
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="M6 6 18 18" />
    </svg>
  );
}

interface VocabExperienceProps {
  onExit: () => void;
}

export function VocabExperience({ onExit }: VocabExperienceProps) {
  const packNumber = getVocabPackNumber();
  const [vocabPack] = useState<VocabWord[]>(() => getDailyVocabPack());

  // Restore saved state
  const savedState = loadVocabState();
  const [currentWordIndex, setCurrentWordIndex] = useState(savedState?.currentWordIndex ?? 0);
  const [results, setResults] = useState<VocabWordResult[]>(savedState?.results ?? []);
  const [packComplete, setPackComplete] = useState(savedState?.packComplete ?? false);

  const currentWord = vocabPack[currentWordIndex];
  const MAX_GUESSES = getMaxAttempts(currentWord?.wordLength ?? 5);

  // Restore per-word game state
  const cws = savedState?.currentWordState;
  const [guesses, setGuesses] = useState<string[]>(cws?.guesses ?? []);
  const [currentGuess, setCurrentGuess] = useState('');
  const [evaluations, setEvaluations] = useState<TileState[][]>((cws?.evaluations ?? []) as TileState[][]);
  const [keyStates, setKeyStates] = useState<Record<string, KeyState>>(() => {
    if (cws?.guesses && currentWord) {
      let ks = initializeKeyboardState();
      const evals = (cws.evaluations ?? []) as TileState[][];
      cws.guesses.forEach((g, i) => {
        if (evals[i]) ks = updateKeyboardState(ks, g, evals[i]);
      });
      return ks;
    }
    return initializeKeyboardState();
  });
  const [gameStatus, setGameStatus] = useState<GameStatus>((cws?.gameStatus as GameStatus) ?? 'playing');
  const [hintStates, setHintStates] = useState<HintState[]>(() => {
    const hints = initializeHints(currentWord?.hints ?? []);
    if (cws?.hintsRevealed) {
      return hints.map((h, i) => ({
        ...h,
        unlocked: i <= (cws.guesses?.length ?? 0),
        revealed: cws.hintsRevealed.includes(i),
      }));
    }
    return hints;
  });
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [wordStartTime, setWordStartTime] = useState(() => cws?.startTime ?? Date.now());

  // Persist state on every change
  useEffect(() => {
    const revealedIndices = hintStates.filter(h => h.revealed).map(h => h.index);
    const state: VocabPackState = {
      date: new Date().toISOString().split('T')[0],
      currentWordIndex,
      results,
      packComplete,
      currentWordState: packComplete ? undefined : {
        guesses,
        evaluations: evaluations as unknown as string[][],
        gameStatus,
        hintsRevealed: revealedIndices,
        startTime: wordStartTime,
      },
    };
    saveVocabState(state);
  }, [currentWordIndex, results, packComplete, guesses, evaluations, gameStatus, hintStates, wordStartTime]);

  const resetForWord = useCallback((index: number) => {
    const word = vocabPack[index];
    setGuesses([]);
    setCurrentGuess('');
    setEvaluations([]);
    setKeyStates(initializeKeyboardState());
    setGameStatus('playing');
    setHintStates(initializeHints(word.hints));
    setShakeRow(null);
    setWordStartTime(Date.now());
  }, [vocabPack]);

  const handleRevealHint = (index: number) => {
    if (gameStatus !== 'playing') return;
    trackHintRevealed('vocab', index, guesses.length);
    setHintStates(prev => revealHint(prev, index));
  };

  const handleKeyPress = (key: string) => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length < currentWord.wordLength) {
      setCurrentGuess(prev => prev + key.toLowerCase());
    }
  };

  const handleBackspace = () => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const finishWord = (won: boolean, newGuesses: string[]) => {
    const timeTaken = Date.now() - wordStartTime;
    const result: VocabWordResult = {
      word: currentWord.word,
      won,
      guesses: newGuesses.length,
      hintsUsed: getRevealedHintsCount(hintStates),
      timeTakenMs: timeTaken,
      date: new Date().toISOString().split('T')[0],
    };
    setResults(prev => [...prev, result]);
    recordWordResult(result);
  };

  const handleEnter = () => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length !== currentWord.wordLength) {
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }

    const validation = validateGuessInput(currentGuess, currentWord.wordLength);
    if (!validation.valid) {
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      toast.error(validation.error || 'Invalid guess');
      return;
    }

    const evaluation = evaluateGuess(currentGuess, currentWord.word.toLowerCase());
    const newGuesses = [...guesses, currentGuess];
    const newEvaluations = [...evaluations, evaluation];
    const newKeyStates = updateKeyboardState(keyStates, currentGuess, evaluation);

    setGuesses(newGuesses);
    setEvaluations(newEvaluations);
    setKeyStates(newKeyStates);
    setCurrentGuess('');
    trackGuess('vocab', newGuesses.length, currentWord.wordLength);

    if (isWinningGuess(evaluation)) {
      setGameStatus('won');
      finishWord(true, newGuesses);
      trackGameEnd('vocab', true, newGuesses.length, getRevealedHintsCount(hintStates), Date.now() - wordStartTime);
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus('lost');
      finishWord(false, newGuesses);
      trackGameEnd('vocab', false, newGuesses.length, getRevealedHintsCount(hintStates), Date.now() - wordStartTime);
    } else {
      setHintStates(prev => {
        const next = [...prev];
        const nextToUnlock = next.findIndex(h => !h.unlocked);
        if (nextToUnlock !== -1) next[nextToUnlock] = { ...next[nextToUnlock], unlocked: true };
        return next;
      });
    }
  };

  const handleNext = () => {
    if (currentWordIndex < vocabPack.length - 1) {
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      resetForWord(nextIndex);
    } else {
      setPackComplete(true);
    }
  };

  const handleShare = async () => {
    const text = getShareText(results, packNumber);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        trackShare('vocab', 'native');
      } else {
        await navigator.clipboard.writeText(text);
        trackShare('vocab', 'clipboard');
        toast.success('Copied to clipboard!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        trackShare('vocab', 'clipboard');
        toast.success('Copied to clipboard!');
      } catch {
        toast.error('Could not share');
      }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') handleEnter();
      else if (e.key === 'Backspace') handleBackspace();
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const isFinished = gameStatus !== 'playing';

  if (packComplete) {
    const wins = results.filter(r => r.won).length;
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
        <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">ClueLux</h1>
            <Button variant="ghost" size="icon" onClick={onExit} aria-label="Close" className="w-9 h-9">
              <CloseIcon className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 max-w-md mx-auto w-full px-4 py-8">
          <div className="text-center space-y-6">
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">Vocab #{packNumber} Complete!</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">{wins}/5 words solved</p>

            <div className="space-y-2">
              {results.map((r, i) => {
                const timeStr = r.timeTakenMs > 60000
                  ? `${Math.floor(r.timeTakenMs / 60000)}m ${Math.round((r.timeTakenMs % 60000) / 1000)}s`
                  : `${Math.round(r.timeTakenMs / 1000)}s`;
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                    r.won
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                  }`}>
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{r.word}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {r.won ? `${r.guesses}/6` : 'X/6'} · {r.hintsUsed} hints · {timeStr}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <Button onClick={handleShare} className="w-full bg-gradient-to-r from-indigo-900 to-amber-500 text-white hover:opacity-90">
                Share Vocab Pack
              </Button>
              <Button variant="outline" onClick={onExit} className="w-full">
                Back to Home
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">ClueLux</h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-indigo-950 to-amber-900 text-amber-200">
              Vocab #{packNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentWordIndex + 1}/5
            </span>
            <Button variant="ghost" size="icon" onClick={onExit} aria-label="Close" className="w-9 h-9 hover:bg-gray-100 dark:hover:bg-slate-800">
              <CloseIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-2">
        {vocabPack.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-8 rounded-full transition-colors ${
              i < results.length
                ? results[i]?.won
                  ? 'bg-emerald-500'
                  : 'bg-red-400'
                : i === currentWordIndex
                ? 'bg-amber-500'
                : 'bg-gray-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-1 overflow-x-hidden">
        <div className="text-center mb-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Word {currentWordIndex + 1}/5 · {currentWord.difficulty} · {guesses.length}/{MAX_GUESSES} attempts
          </p>
        </div>

        <div className="mb-1">
          <GameBoard
            guesses={guesses}
            currentGuess={currentGuess}
            evaluations={evaluations}
            maxGuesses={MAX_GUESSES}
            wordLength={currentWord.wordLength}
            hints={hintStates}
            onRevealHint={handleRevealHint}
            gameStatus={gameStatus}
            shakeRow={shakeRow}
          />
        </div>

        <HintDisplay hints={hintStates} onRevealHint={handleRevealHint} gameOver={isFinished} />

        {isFinished ? (
          <div className="mt-3 mx-auto w-full max-w-md space-y-2 pb-4">
            <div className="text-center py-3">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {gameStatus === 'won' ? '✅ Got it!' : `The word was ${currentWord.word}`}
              </p>
            </div>
            <Button onClick={handleNext} className="w-full h-11 bg-gradient-to-r from-indigo-900 to-amber-500 text-white hover:opacity-90">
              {currentWordIndex < vocabPack.length - 1 ? 'Next Word →' : 'See Results'}
            </Button>
          </div>
        ) : (
          <div className="mt-1">
            <Keyboard
              onKeyPress={handleKeyPress}
              onEnter={handleEnter}
              onBackspace={handleBackspace}
              keyStates={keyStates}
              disabled={false}
              currentGuessLength={currentGuess.length}
              wordLength={currentWord.wordLength}
            />
          </div>
        )}
      </main>
    </div>
  );
}
