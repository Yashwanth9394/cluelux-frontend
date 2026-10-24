import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { Keyboard } from './components/Keyboard';
import { HintDisplay } from './components/HintDisplay';
import { FirstTimeExperience, shouldShowTutorial } from './components/FirstTimeExperience';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { RotateCcw, Trophy, XCircle, HelpCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';

// Import our game engines
import { evaluateGuess, isWinningGuess, getMaxAttempts, updateKeyboardState, initializeKeyboardState, validateGuessInput } from './lib/gameEngine';
import { initializeHints, updateHintStates, revealHint, getRevealedHintsCount } from './lib/hintManager';
import { saveGameState, loadGameState, clearGameState, loadStats, saveStats, updateStats, isCurrentGameToday, canStartPracticeGame, getRemainingPracticeGames } from './lib/localStorage';

// Import types
import type { TileState, KeyState, GameStatus, GameState, HintState, GameMode } from './types/game.types';

// Import personality utilities
import { getCombinedGreeting, getDiscoveryMessage, getVictoryMessage } from './utils/personality';

// Import API service
import { fetchDailyWord, formatDailyWordForGame, fetchPracticeWord, formatPracticeWordForGame, recordPlay } from './services/api';

// Fallback data in case API is not available
import todayData from './data/today.json';

export default function App() {
  // Today's challenge data - will be loaded from API
  const [challenge, setChallenge] = useState(todayData);
  const [isLoading, setIsLoading] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const MAX_GUESSES = getMaxAttempts(challenge.wordLength);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(shouldShowTutorial());

  // Game state
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [evaluations, setEvaluations] = useState<TileState[][]>([]);
  const [keyStates, setKeyStates] = useState<Record<string, KeyState>>(initializeKeyboardState());
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [errorMessage, setErrorMessage] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [playsToday, setPlaysToday] = useState<number | null>(null);

  // Hint system
  const [hintStates, setHintStates] = useState<HintState[]>(() => initializeHints(challenge.hints));
  const [hintsUsedPerGuess, setHintsUsedPerGuess] = useState<boolean[]>([]);

  // Fetch today's word from backend
  useEffect(() => {
    async function loadDailyWord() {
      try {
        setIsLoading(true);
        const data = await fetchDailyWord();
        const formattedData = formatDailyWordForGame(data);
        setChallenge(formattedData);
        setHintStates(initializeHints(formattedData.hints));
      } catch (error) {
        console.error('Failed to load daily word:', error);
        toast.error('Using offline word', {
          description: 'Could not connect to server',
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadDailyWord();
  }, []);

  // Initialize or restore game
  useEffect(() => {
    if (isLoading) return; // Wait for word to load

    const savedState = loadGameState();

    if (savedState && isCurrentGameToday(challenge.date)) {
      // Restore saved game
      setGuesses(savedState.guesses);
      setEvaluations(savedState.evaluations);
      setGameStatus(savedState.gameStatus);
      setGameMode(savedState.gameMode || 'daily'); // Restore game mode with fallback

      // Restore hints used per guess tracking
      if (savedState.hintsUsedPerGuess) {
        setHintsUsedPerGuess(savedState.hintsUsedPerGuess);
      }
      
      // Rebuild keyboard state
      let keys = initializeKeyboardState();
      savedState.guesses.forEach((guess, idx) => {
        keys = updateKeyboardState(keys, guess, savedState.evaluations[idx]);
      });
      setKeyStates(keys);
      
      // Restore hint states
      const restoredHints = initializeHints(challenge.hints);
      const updatedHints = updateHintStates(restoredHints, savedState.guesses.length, challenge.wordLength);
      // Mark revealed hints based on saved state
      updatedHints.forEach((hint, idx) => {
        if (idx < savedState.hintsRevealed) {
          hint.revealed = true;
        }
      });
      setHintStates(updatedHints);
      
      if (savedState.gameStatus !== 'playing') {
        setShowResult(true);
      }
    } else {
      // Start fresh game
      clearGameState();
    }
  }, [isLoading, challenge]);

  // Keyboard input handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      if (e.key === 'Enter') {
        handleEnter();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, guesses, gameStatus]);

  // Auto-show result when game ends (delayed for victory animation)
  useEffect(() => {
    if (gameStatus === 'won') {
      // Steve Jobs principle: Let them SAVOR the moment
      // Don't rush them with dialogs - let them breathe and feel smart
      // 7 seconds of pure satisfaction before we ask them to do anything
      setTimeout(() => setShowResult(true), 7000);
    } else if (gameStatus === 'lost') {
      setShowResult(true);
    }
  }, [gameStatus]);

  // Countdown timer for next puzzle
  useEffect(() => {
    const calculateTimeUntilMidnightET = () => {
      const now = new Date();
      const etDateStr = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const etNow = new Date(etDateStr);
      const midnightET = new Date(etNow);
      midnightET.setHours(24, 0, 0, 0);

      const diff = midnightET.getTime() - etNow.getTime();

      // Check if time is up
      if (diff <= 0) {
        return '0:00:00';
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return `${hours}h ${minutes}m ${seconds}s`;
    };

    // Update immediately
    setTimeUntilNext(calculateTimeUntilMidnightET());

    // Update every second
    const interval = setInterval(() => {
      setTimeUntilNext(calculateTimeUntilMidnightET());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleKeyPress = (key: string) => {
    if (currentGuess.length < challenge.wordLength) {
      setCurrentGuess(currentGuess + key);
    }
  };

  const handleBackspace = () => {
    setCurrentGuess(currentGuess.slice(0, -1));
  };

  const handleEnter = () => {
    // Validate guess
    const validation = validateGuessInput(currentGuess, challenge.wordLength);
    
    if (!validation.valid) {
      // Shake animation for inline feedback
      const currentRow = guesses.length;
      setShakeRow(currentRow);
      setTimeout(() => setShakeRow(null), 500);

      setErrorMessage(validation.error || 'Invalid guess');
      setTimeout(() => setErrorMessage(''), 2000);
      return;
    }

    // Evaluate guess
    const evaluation = evaluateGuess(currentGuess, challenge.answer);
    const newGuesses = [...guesses, currentGuess];
    const newEvaluations = [...evaluations, evaluation];
    
    // Track if any hint was revealed before this guess
    const anyHintUsed = hintStates.some(hint => hint.revealed);
    const newHintsUsedPerGuess = [...hintsUsedPerGuess, anyHintUsed];
    
    setGuesses(newGuesses);
    setEvaluations(newEvaluations);
    setCurrentGuess('');
    setHintsUsedPerGuess(newHintsUsedPerGuess);
    
    // Update keyboard
    const newKeyStates = updateKeyboardState(keyStates, currentGuess, evaluation);
    setKeyStates(newKeyStates);

    // Check win condition
    if (isWinningGuess(evaluation)) {
      setGameStatus('won');

      const finalState: GameState = {
        date: challenge.date,
        gameNumber: challenge.gameNumber,
        gameMode: gameMode,
        guesses: newGuesses,
        evaluations: newEvaluations,
        hintsRevealed: getRevealedHintsCount(hintStates),
        hintsUsedPerGuess: newHintsUsedPerGuess,
        gameStatus: 'won',
        startTime: Date.now(),
        wordLength: challenge.wordLength,
      };
      saveGameState(finalState);

      // Update stats
      const stats = loadStats();
      const newStats = updateStats(stats, finalState);
      saveStats(newStats);

      // Daily challenge only - practice completions aren't "today's puzzle"
      // and shouldn't count toward or be compared against that total.
      if (gameMode === 'daily') {
        recordPlay(challenge.date).then(setPlaysToday);
      }

      // Steve Jobs: SILENCE is golden
      // No toast. No noise. Just let the green tiles speak.
      // The user KNOWS they won. Don't tell them what they already feel.
      return;
    }

    // Update hints based on guess count (unlock next hint after each guess)
    const newHintStates = updateHintStates(hintStates, newGuesses.length, challenge.wordLength);
    setHintStates(newHintStates);

    // Check lose condition
    if (newGuesses.length >= MAX_GUESSES) {
      setGameStatus('lost');
      const finalState: GameState = {
        date: challenge.date,
        gameNumber: challenge.gameNumber,
        gameMode: gameMode,
        guesses: newGuesses,
        evaluations: newEvaluations,
        hintsRevealed: getRevealedHintsCount(hintStates),
        hintsUsedPerGuess: newHintsUsedPerGuess,
        gameStatus: 'lost',
        startTime: Date.now(),
        wordLength: challenge.wordLength,
      };
      saveGameState(finalState);

      // Update stats
      const stats = loadStats();
      const newStats = updateStats(stats, finalState);
      saveStats(newStats);

      if (gameMode === 'daily') {
        recordPlay(challenge.date).then(setPlaysToday);
      }
      return;
    }

    // Save game state
    const currentState: GameState = {
      date: challenge.date,
      gameNumber: challenge.gameNumber,
      gameMode: gameMode,
      guesses: newGuesses,
      evaluations: newEvaluations,
      hintsRevealed: getRevealedHintsCount(hintStates),
      hintsUsedPerGuess: newHintsUsedPerGuess,
      gameStatus: 'playing',
      startTime: Date.now(),
      wordLength: challenge.wordLength,
    };
    saveGameState(currentState);
  };

  const handleRevealHint = (index: number) => {
    const newHintStates = revealHint(hintStates, index);
    setHintStates(newHintStates);

    // Save updated state
    const currentState = loadGameState();
    if (currentState) {
      currentState.hintsRevealed = getRevealedHintsCount(newHintStates);
      saveGameState(currentState);
    }
  };

  const handleNewGame = () => {
    window.location.reload();
  };

  const handleStartPractice = async () => {
    // Check if user has remaining practice games
    if (!canStartPracticeGame()) {
      toast.error('Daily practice limit reached', {
        description: 'You can play 5 practice games per day. Come back tomorrow!',
      });
      return;
    }

    try {
      setIsLoading(true);
      setShowResult(false);

      // Fetch practice word from backend (random past daily word)
      const data = await fetchPracticeWord();
      const formattedData = formatPracticeWordForGame(data);

      // Reset ALL game state for fresh practice game
      setChallenge(formattedData);
      setGameMode('practice');
      setGuesses([]);
      setCurrentGuess('');
      setEvaluations([]);
      setKeyStates(initializeKeyboardState());
      setGameStatus('playing');
      setHintStates(initializeHints(formattedData.hints));
      setHintsUsedPerGuess([]);
      setPlaysToday(null);

      const remaining = getRemainingPracticeGames() - 1; // -1 because we just started one
      toast.success('Practice mode started!', {
        description: `${remaining} practice game${remaining !== 1 ? 's' : ''} remaining today`,
      });
    } catch (error) {
      toast.error('Could not start practice mode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToDaily = () => {
    window.location.reload();
  };

  // Plain-text emoji can't be recolored (fixed per glyph by the viewer's font/
  // platform, not by us) - a real green smiley needs an actual drawn image.
  // Renders the result grid as a PNG: light-green circle+smile for correct,
  // gray circle+straight-face for present, plain pale circle for absent.
  const renderResultImage = (): Promise<Blob | null> => {
    const cell = 48;
    const gap = 10;
    const padding = 20;
    const rows = evaluations.length;
    const cols = challenge.wordLength;

    const canvas = document.createElement('canvas');
    canvas.width = cols * cell + (cols - 1) * gap + padding * 2;
    canvas.height = rows * cell + (rows - 1) * gap + padding * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    evaluations.forEach((row, r) => {
      row.forEach((state, c) => {
        const cx = padding + c * (cell + gap) + cell / 2;
        const cy = padding + r * (cell + gap) + cell / 2;
        const radius = cell / 2;

        const fill = state === 'correct' ? '#86efac' : state === 'present' ? '#e5e7eb' : '#f3f4f6';
        const ink = state === 'correct' ? '#166534' : '#4b5563';

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        if (state === 'absent') return; // plain circle, no face

        const eyeOffsetX = radius * 0.32;
        const eyeOffsetY = radius * 0.18;
        const eyeRadius = radius * 0.09;
        ctx.fillStyle = ink;
        [-1, 1].forEach(side => {
          ctx.beginPath();
          ctx.arc(cx + side * eyeOffsetX, cy - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.strokeStyle = ink;
        ctx.lineWidth = radius * 0.1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (state === 'correct') {
          // Smile: downward curve
          ctx.arc(cx, cy + radius * 0.05, radius * 0.4, Math.PI * 0.15, Math.PI * 0.85);
        } else {
          // Present: straight line
          ctx.moveTo(cx - radius * 0.32, cy + radius * 0.3);
          ctx.lineTo(cx + radius * 0.32, cy + radius * 0.3);
        }
        ctx.stroke();
      });
    });

    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  };

  const handleShare = async () => {
    // Calculate hints used
    const totalHintsUsed = getRevealedHintsCount(hintStates);

    // Show hint count with thunder symbol
    const hintGlyph = totalHintsUsed === 0 ? ' ⚡' : ` · ${totalHintsUsed}⚡`;

    const text = `ClueLux #${challenge.gameNumber}${hintGlyph}`;
    const blob = await renderResultImage();

    if (blob) {
      const file = new File([blob], 'cluelux-result.png', { type: 'image/png' });

      // Try native share with the image first (works on mobile)
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text });
          return; // Native dialog is enough feedback
        } catch (err: any) {
          if (err.name === 'AbortError') return; // User cancelled
        }
      }

      // Desktop fallback: copy the image itself to the clipboard
      if (navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          toast.success('Result image copied to clipboard');
          return;
        } catch {
          // Fall through to text fallback below
        }
      }
    }

    // Last-resort fallback: plain emoji text (e.g. very old browsers)
    const emoji = evaluations.map(row =>
      row.map(state =>
        state === 'correct' ? '🟢😊' :
        state === 'present' ? '😐' : '⚪'
      ).join('')
    ).join('\n');
    try {
      await navigator.clipboard.writeText(`${text}\n\n${emoji}`);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  const stats = loadStats();

  // Show loading screen while fetching daily word
  if (isLoading) {
    return (
      <div className="h-full bg-white dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
        <Toaster />

        {/* Header */}
        <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
              ClueLux
            </h1>
          </div>
        </header>

        {/* Loading State */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading today's puzzle...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
      <Toaster />

      {/* First Time Experience Tutorial */}
      {showTutorial && (
        <FirstTimeExperience onComplete={() => setShowTutorial(false)} />
      )}

      {/* Header - Clean and minimal with 8px grid spacing */}
      <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-2">
          {/* Compact title for mobile - min-w-0 + flex-wrap so this shrinks/wraps
              instead of pushing the icon buttons off-screen at large text sizes */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                ClueLux
              </h1>
              {gameMode === 'daily' ? (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  Daily Challenge
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                  Practice Mode
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {challenge.wordLength}-letter challenge
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="hover:bg-gray-100 dark:hover:bg-slate-800 w-9 h-9"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStats(true)}
              className="hover:bg-gray-100 dark:hover:bg-slate-800 w-9 h-9"
            >
              <Trophy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-1 overflow-x-hidden">
        {/* Game Info - Minimal, only essential */}
        <div className="text-center mb-1">
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {guesses.length}/{MAX_GUESSES} attempts · {getRevealedHintsCount(hintStates)}⚡ hints
          </p>
        </div>

        {/* Error Message - removed since shake animation provides inline feedback */}

        {/* Game Board */}
        <div className="mb-1">
          <GameBoard
            guesses={guesses}
            currentGuess={currentGuess}
            evaluations={evaluations}
            maxGuesses={MAX_GUESSES}
            wordLength={challenge.wordLength}
            hints={hintStates}
            onRevealHint={handleRevealHint}
            gameStatus={gameStatus}
            shakeRow={shakeRow}
          />
        </div>

        {/* Hints */}
        <HintDisplay hints={hintStates} onRevealHint={handleRevealHint} />

        {/* Keyboard */}
        <div className="mt-1">
          <Keyboard
            onKeyPress={handleKeyPress}
            onEnter={handleEnter}
            onBackspace={handleBackspace}
            keyStates={keyStates}
            disabled={gameStatus !== 'playing'}
            currentGuessLength={currentGuess.length}
            wordLength={challenge.wordLength}
          />
        </div>

        {/* Mode Toggle Buttons */}
        {gameStatus !== 'playing' && (
          <div className="mt-4 flex flex-col gap-2">
            {gameMode === 'daily' ? (
              <>
                <Button
                  onClick={handleStartPractice}
                  variant="outline"
                  disabled={!canStartPracticeGame()}
                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Practice Mode ({getRemainingPracticeGames()}/5 today)
                </Button>
                {getRemainingPracticeGames() === 0 && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Practice limit reached. Come back tomorrow!
                  </p>
                )}
              </>
            ) : (
              <Button
                onClick={handleBackToDaily}
                variant="outline"
                className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
              >
                Back to Daily Challenge
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {gameStatus === 'won' ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <span className="text-6xl">{getVictoryMessage(guesses.length, getRevealedHintsCount(hintStates), challenge.answer).emoji}</span>
                  <span className="text-3xl font-bold tracking-tight">{getVictoryMessage(guesses.length, getRevealedHintsCount(hintStates), challenge.answer).title}</span>
                  <span className="text-base text-gray-600 dark:text-gray-400 font-normal">{getVictoryMessage(guesses.length, getRevealedHintsCount(hintStates), challenge.answer).subtitle}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">{getDiscoveryMessage(challenge.answer, guesses).emoji}</span>
                  <span className="text-2xl">{getDiscoveryMessage(challenge.answer, guesses).title}</span>
                </div>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4">
                {gameStatus === 'won' ? (
                  <div className="text-center">
                    <p className="text-lg mb-1 text-gray-900 dark:text-gray-100 font-medium">
                      {challenge.answer.toUpperCase()} in {guesses.length} {guesses.length === 1 ? 'attempt' : 'attempts'}
                    </p>
                    {getRevealedHintsCount(hintStates) === 0 && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                        ⚡ No hints needed
                      </p>
                    )}
                    {playsToday !== null && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {playsToday.toLocaleString()} {playsToday === 1 ? 'play' : 'plays'} today
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-lg mb-2">
                      {getDiscoveryMessage(challenge.answer, guesses).message}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getRevealedHintsCount(hintStates)} hint{getRevealedHintsCount(hintStates) !== 1 ? 's' : ''} revealed
                    </p>
                  </div>
                )}

                {/* Countdown to next puzzle - only show in daily mode */}
                {gameMode === 'daily' && (
                  <div className="text-center p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    {timeUntilNext === '0:00:00' ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New puzzle available!</p>
                        <Button
                          onClick={handleNewGame}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Load New Puzzle
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Next puzzle in</p>
                        <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                          {timeUntilNext}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* Action buttons - different for daily vs practice */}
                <div className="flex flex-col gap-2">
                  {gameMode === 'daily' ? (
                    <>
                      <Button onClick={handleShare} className="w-full">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share Result
                      </Button>
                      <Button onClick={() => setShowStats(true)} variant="outline" className="w-full">
                        <Trophy className="h-4 w-4 mr-2" />
                        View Stats
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleStartPractice}
                        disabled={!canStartPracticeGame()}
                        className="w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        New Practice Game ({getRemainingPracticeGames()}/5 left)
                      </Button>
                      {getRemainingPracticeGames() === 0 && (
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                          Daily limit reached. Come back tomorrow for more practice!
                        </p>
                      )}
                      <Button onClick={handleBackToDaily} variant="outline" className="w-full">
                        Back to Daily Challenge
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>How to Play ClueLux</DialogTitle>
            <DialogDescription className="space-y-4 text-left">
              <p>Guess the word in {MAX_GUESSES} tries!</p>
              
              <div>
                <h4 className="font-semibold mb-2">Rules:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Each guess must be a valid {challenge.wordLength}-letter word</li>
                  <li>The color of tiles will change after each guess</li>
                  <li>🟩 Green = correct letter in correct position</li>
                  <li>🟨 Yellow = correct letter in wrong position</li>
                  <li>⬜ Gray = letter not in word</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Hints:</h4>
                <p className="text-sm mb-2">
                  Each wrong guess unlocks a new hint. Click any unlocked hint to reveal it.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Earlier hints are harder, later hints are easier</li>
                  <li>Hints reveal in order — unlock the next one by revealing the last</li>
                  <li>Use fewer hints to show your skill!</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Daily Challenge:</h4>
                <p className="text-sm">
                  A new word is available every day. Come back tomorrow for a fresh challenge!
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Your Statistics</DialogTitle>
            <DialogDescription className="space-y-4">
              {/* Daily Stats */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Daily Challenge</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalGames}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Games Played</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      {stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Win Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.currentStreak}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Current Streak</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.maxStreak}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Max Streak</div>
                  </div>
                </div>

                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg mt-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avgHintsPerGame.toFixed(1)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Average Hints Used</div>
                </div>
              </div>

              {/* Achievements Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Achievements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">{stats.noHintStreak}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">No Hint Streak</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">{stats.maxNoHintStreak}</div>
                    <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">Best No Hint Streak</div>
                  </div>
                </div>
              </div>

              {/* Practice Stats */}
              {stats.practice && stats.practice.totalGames > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Practice Mode</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-900 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.practice.totalGames}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Games Played</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-900 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {stats.practice.totalGames > 0 ? Math.round((stats.practice.wins / stats.practice.totalGames) * 100) : 0}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Win Rate</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-900 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.practice.avgHintsPerGame.toFixed(1)}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Avg Hints</div>
                    </div>
                    <div className="text-center p-4 bg-amber-50 dark:bg-amber-900 rounded-lg">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.practice.maxNoHintStreak}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Best Streak</div>
                    </div>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-2 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>Crafted for word lovers everywhere</p>
        </div>
      </footer>

    </div>
  );
}
