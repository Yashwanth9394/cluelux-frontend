import { useState, useEffect, useCallback } from 'react';
import { GameBoard } from './GameBoard';
import { Keyboard } from './Keyboard';
import { HintDisplay } from './HintDisplay';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { evaluateGuess, isWinningGuess, getMaxAttempts, updateKeyboardState, initializeKeyboardState, validateGuessInput } from '../lib/gameEngine';
import { initializeHints, revealHint, getRevealedHintsCount } from '../lib/hintManager';
import type { TileState, KeyState, GameStatus, HintState } from '../types/game.types';
import { getRevisionWords, recordWordResult, type VocabWordResult } from '../lib/vocabStore';
import { trackGuess, trackHintRevealed, trackGameEnd } from '../lib/analytics';
import vocabData from '../data/vocab-words.json';

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="M6 6 18 18" />
    </svg>
  );
}

interface VocabWord {
  word: string;
  wordLength: number;
  difficulty: string;
  category: string;
  hints: string[];
}

interface ReviseExperienceProps {
  onExit: () => void;
}

export function ReviseExperience({ onExit }: ReviseExperienceProps) {
  const revisionPerf = getRevisionWords();

  const revisionWords: VocabWord[] = revisionPerf
    .map(p => (vocabData as VocabWord[]).find(v => v.word.toUpperCase() === p.word.toUpperCase()))
    .filter((v): v is VocabWord => v !== undefined)
    .slice(0, 5);

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [results, setResults] = useState<VocabWordResult[]>([]);
  const [sessionComplete, setSessionComplete] = useState(false);

  if (revisionWords.length === 0) {
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
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <div className="text-5xl">🎉</div>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-gray-100">Nothing to revise!</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Play some vocab packs first. Words you struggle with will appear here for revision.
            </p>
            <Button onClick={onExit} variant="outline" className="mt-4">Back to Daily</Button>
          </div>
        </main>
      </div>
    );
  }

  const currentWord = revisionWords[currentWordIndex];
  const currentPerf = revisionPerf.find(p => p.word.toUpperCase() === currentWord.word.toUpperCase());

  return (
    <ReviseWordPlayer
      key={currentWord.word}
      word={currentWord}
      performance={currentPerf}
      wordIndex={currentWordIndex}
      totalWords={revisionWords.length}
      results={results}
      sessionComplete={sessionComplete}
      onFinish={(result) => {
        const newResults = [...results, result];
        setResults(newResults);
        recordWordResult(result);
      }}
      onNext={() => {
        if (currentWordIndex < revisionWords.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
        } else {
          setSessionComplete(true);
        }
      }}
      onExit={onExit}
    />
  );
}

interface ReviseWordPlayerProps {
  word: VocabWord;
  performance?: { avgGuesses: number; avgTimeMs: number; attempts: number; wins: number };
  wordIndex: number;
  totalWords: number;
  results: VocabWordResult[];
  sessionComplete: boolean;
  onFinish: (result: VocabWordResult) => void;
  onNext: () => void;
  onExit: () => void;
}

function ReviseWordPlayer({ word, performance, wordIndex, totalWords, results, sessionComplete, onFinish, onNext, onExit }: ReviseWordPlayerProps) {
  const MAX_GUESSES = getMaxAttempts(word.wordLength);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [evaluations, setEvaluations] = useState<TileState[][]>([]);
  const [keyStates, setKeyStates] = useState<Record<string, KeyState>>(initializeKeyboardState());
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [hintStates, setHintStates] = useState<HintState[]>(() => initializeHints(word.hints));
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  const handleRevealHint = (index: number) => {
    if (gameStatus !== 'playing') return;
    trackHintRevealed('revise', index, guesses.length);
    setHintStates(prev => revealHint(prev, index));
  };

  const handleKeyPress = useCallback((key: string) => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.length < word.wordLength ? prev + key.toLowerCase() : prev);
  }, [gameStatus, word.wordLength]);

  const handleBackspace = useCallback(() => {
    if (gameStatus !== 'playing') return;
    setCurrentGuess(prev => prev.slice(0, -1));
  }, [gameStatus]);

  const handleEnter = useCallback(() => {
    if (gameStatus !== 'playing') return;
    if (currentGuess.length !== word.wordLength) {
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      return;
    }

    const validation = validateGuessInput(currentGuess, word.wordLength);
    if (!validation.valid) {
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 600);
      toast.error(validation.error || 'Invalid guess');
      return;
    }

    const evaluation = evaluateGuess(currentGuess, word.word.toLowerCase());
    const newGuesses = [...guesses, currentGuess];
    const newEvaluations = [...evaluations, evaluation];
    const newKeyStates = updateKeyboardState(keyStates, currentGuess, evaluation);

    setGuesses(newGuesses);
    setEvaluations(newEvaluations);
    setKeyStates(newKeyStates);
    setCurrentGuess('');
    trackGuess('revise', newGuesses.length, word.wordLength);

    const won = isWinningGuess(evaluation);
    const lost = newGuesses.length >= MAX_GUESSES && !won;

    if (won || lost) {
      setGameStatus(won ? 'won' : 'lost');
      trackGameEnd('revise', won, newGuesses.length, getRevealedHintsCount(hintStates), Date.now() - startTime);
      onFinish({
        word: word.word,
        won,
        guesses: newGuesses.length,
        hintsUsed: getRevealedHintsCount(hintStates),
        timeTakenMs: Date.now() - startTime,
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      setHintStates(prev => {
        const next = [...prev];
        const nextToUnlock = next.findIndex(h => !h.unlocked);
        if (nextToUnlock !== -1) next[nextToUnlock] = { ...next[nextToUnlock], unlocked: true };
        return next;
      });
    }
  }, [gameStatus, currentGuess, word, guesses, evaluations, keyStates, MAX_GUESSES, hintStates, startTime, onFinish]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') handleEnter();
      else if (e.key === 'Backspace') handleBackspace();
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleEnter, handleBackspace, handleKeyPress]);

  const isFinished = gameStatus !== 'playing';

  if (sessionComplete) {
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
            <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100">Revision Complete!</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">{wins}/{results.length} words nailed</p>
            <div className="space-y-2">
              {results.map((r, i) => {
                const timeStr = r.timeTakenMs > 60000
                  ? `${Math.floor(r.timeTakenMs / 60000)}m ${Math.round((r.timeTakenMs % 60000) / 1000)}s`
                  : `${Math.round(r.timeTakenMs / 1000)}s`;
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                    r.won ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                  }`}>
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{r.word}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">{r.won ? `${r.guesses}/6` : 'X/6'} · {timeStr}</span>
                  </div>
                );
              })}
            </div>
            <Button variant="outline" onClick={onExit} className="w-full">Back to Daily</Button>
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
            <span className="px-2 py-0.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-800 to-indigo-900 text-amber-200">
              Revise
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{wordIndex + 1}/{totalWords}</span>
            <Button variant="ghost" size="icon" onClick={onExit} aria-label="Close" className="w-9 h-9 hover:bg-gray-100 dark:hover:bg-slate-800">
              <CloseIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Previous performance hint */}
      {performance && (
        <div className="flex items-center justify-center gap-4 py-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Previous: {performance.wins}/{performance.attempts} wins</span>
          <span>Avg {performance.avgGuesses.toFixed(1)} guesses</span>
        </div>
      )}

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 py-1">
        {Array.from({ length: totalWords }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-8 rounded-full transition-colors ${
              i < results.length
                ? results[i]?.won ? 'bg-emerald-500' : 'bg-red-400'
                : i === wordIndex ? 'bg-amber-500' : 'bg-gray-200 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-1 overflow-x-hidden">
        <div className="text-center mb-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Word {wordIndex + 1}/{totalWords} · {word.difficulty} · {guesses.length}/{MAX_GUESSES} attempts
          </p>
        </div>

        <div className="mb-1">
          <GameBoard
            guesses={guesses}
            currentGuess={currentGuess}
            evaluations={evaluations}
            maxGuesses={MAX_GUESSES}
            wordLength={word.wordLength}
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
                {gameStatus === 'won' ? '✅ Got it!' : `The word was ${word.word}`}
              </p>
            </div>
            <Button onClick={onNext} className="w-full h-11 bg-gradient-to-r from-indigo-900 to-amber-500 text-white hover:opacity-90">
              {wordIndex < totalWords - 1 ? 'Next Word →' : 'See Results'}
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
              wordLength={word.wordLength}
            />
          </div>
        )}
      </main>
    </div>
  );
}
