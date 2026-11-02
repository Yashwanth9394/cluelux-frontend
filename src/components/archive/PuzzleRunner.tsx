import { useEffect, useState } from 'react';
import { GameBoard } from '../GameBoard';
import { Keyboard } from '../Keyboard';
import { HintDisplay } from '../HintDisplay';
import { RecapCard } from '../RecapCard';
import { Button } from '../ui/button';
import {
  evaluateGuess,
  isWinningGuess,
  getMaxAttempts,
  updateKeyboardState,
  initializeKeyboardState,
  validateGuessInput,
} from '../../lib/gameEngine';
import { initializeHints, updateHintStates, revealHint, getRevealedHintsCount } from '../../lib/hintManager';
import { loadPuzzle, savePuzzle } from '../../lib/archiveStore';
import { recordPlay } from '../../services/api';
import type { PuzzleData } from '../../services/archiveApi';
import type { TileState, KeyState, HintState } from '../../types/game.types';

interface PuzzleRunnerProps {
  puzzle: PuzzleData;
  title: string;
  onExit: () => void;
}

/**
 * Plays one archive or special puzzle. Progress is saved per puzzle id, and
 * nothing here touches the daily stats or streak.
 */
export function PuzzleRunner({ puzzle, title, onExit }: PuzzleRunnerProps) {
  const wordLength = puzzle.answer.length;
  const maxGuesses = getMaxAttempts(wordLength);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<TileState[][]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [keyStates, setKeyStates] = useState<Record<string, KeyState>>(initializeKeyboardState());
  const [hintStates, setHintStates] = useState<HintState[]>(() => initializeHints(puzzle.hints));
  const [hintsUsedPerGuess, setHintsUsedPerGuess] = useState<boolean[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Restore a saved game for this puzzle, if there is one.
  useEffect(() => {
    const saved = loadPuzzle(puzzle.id);
    if (!saved) return;
    setGuesses(saved.guesses);
    setEvaluations(saved.evaluations);
    setHintsUsedPerGuess(saved.hintsUsedPerGuess);
    setStatus(saved.status);

    let keys = initializeKeyboardState();
    saved.guesses.forEach((guess, i) => {
      keys = updateKeyboardState(keys, guess, saved.evaluations[i]);
    });
    setKeyStates(keys);

    const restored = updateHintStates(initializeHints(puzzle.hints), saved.guesses.length, wordLength);
    restored.forEach((hint, i) => {
      if (i < saved.hintsRevealed) hint.revealed = true;
    });
    setHintStates(restored);
  }, [puzzle.id]);

  const persist = (next: {
    guesses: string[];
    evaluations: TileState[][];
    hints: HintState[];
    perGuess: boolean[];
    status: 'playing' | 'won' | 'lost';
  }) => {
    savePuzzle({
      id: puzzle.id,
      guesses: next.guesses,
      evaluations: next.evaluations,
      hintsRevealed: getRevealedHintsCount(next.hints),
      hintsUsedPerGuess: next.perGuess,
      status: next.status,
    });
  };

  const handleEnter = () => {
    const validation = validateGuessInput(currentGuess, wordLength);
    if (!validation.valid) {
      setShakeRow(guesses.length);
      setTimeout(() => setShakeRow(null), 500);
      setMessage(validation.error || 'Invalid guess');
      setTimeout(() => setMessage(''), 2000);
      return;
    }

    const evaluation = evaluateGuess(currentGuess, puzzle.answer);
    const newGuesses = [...guesses, currentGuess];
    const newEvaluations = [...evaluations, evaluation];
    const newPerGuess = [...hintsUsedPerGuess, hintStates.some((h) => h.revealed)];

    setGuesses(newGuesses);
    setEvaluations(newEvaluations);
    setCurrentGuess('');
    setHintsUsedPerGuess(newPerGuess);
    setKeyStates(updateKeyboardState(keyStates, currentGuess, evaluation));

    const mode = puzzle.kind === 'archive' ? 'archive' : 'random';
    const recordDate = puzzle.kind === 'archive' ? puzzle.label : null;

    if (isWinningGuess(evaluation)) {
      setStatus('won');
      persist({ guesses: newGuesses, evaluations: newEvaluations, hints: hintStates, perGuess: newPerGuess, status: 'won' });
      recordPlay(recordDate, true, newGuesses.length, mode);
      return;
    }

    const newHints = updateHintStates(hintStates, newGuesses.length, wordLength);
    setHintStates(newHints);

    const finished = newGuesses.length >= maxGuesses;
    if (finished) setStatus('lost');
    persist({
      guesses: newGuesses,
      evaluations: newEvaluations,
      hints: newHints,
      perGuess: newPerGuess,
      status: finished ? 'lost' : 'playing',
    });
    if (finished) recordPlay(recordDate, false, newGuesses.length, mode);
  };

  const handleRevealHint = (index: number) => {
    const newHints = revealHint(hintStates, index);
    setHintStates(newHints);
    persist({ guesses, evaluations, hints: newHints, perGuess: hintsUsedPerGuess, status });
  };

  const handleKeyPress = (key: string) => {
    if (currentGuess.length < wordLength) setCurrentGuess(currentGuess + key);
  };

  const handleBackspace = () => setCurrentGuess(currentGuess.slice(0, -1));

  // Physical keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Enter') handleEnter();
      else if (e.key === 'Backspace') handleBackspace();
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentGuess, guesses, status, hintStates]);

  const revealed = getRevealedHintsCount(hintStates);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <header className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={onExit} className="-ml-2 h-11 px-3 text-sm">
            <span aria-hidden="true" className="mr-1">←</span> Archive
          </Button>
          <h1 className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">{title}</h1>
          <span className="w-16" aria-hidden="true" />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-1 overflow-x-hidden">
        <div className="text-center mb-1">
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
            {message || `${guesses.length}/${maxGuesses} attempts · ${revealed} hints`}
          </p>
        </div>

        <div className="mb-1">
          <GameBoard
            guesses={guesses}
            currentGuess={currentGuess}
            evaluations={evaluations}
            maxGuesses={maxGuesses}
            wordLength={wordLength}
            hints={hintStates}
            onRevealHint={handleRevealHint}
            gameStatus={status}
            shakeRow={shakeRow}
          />
        </div>

        <HintDisplay hints={hintStates} onRevealHint={handleRevealHint} />

        {status === 'playing' ? (
          <div className="mt-1">
            <Keyboard
              onKeyPress={handleKeyPress}
              onEnter={handleEnter}
              onBackspace={handleBackspace}
              keyStates={keyStates}
              disabled={false}
              currentGuessLength={currentGuess.length}
              wordLength={wordLength}
            />
          </div>
        ) : (
          <div className="mx-auto mt-3 mb-4 w-full max-w-md space-y-3">
            <RecapCard
              status={status}
              guesses={guesses}
              evaluations={evaluations}
              hintsRevealed={revealed}
              totalHints={hintStates.length}
              maxGuesses={maxGuesses}
            />
            <p className="text-center text-sm text-slate-600 dark:text-slate-300">
              The word was <span className="font-mono font-medium tracking-wide">{puzzle.answer}</span>
            </p>
            <Button onClick={onExit} className="w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800">Back to archive</Button>
          </div>
        )}
      </main>
    </div>
  );
}
