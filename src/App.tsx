import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { Keyboard } from './components/Keyboard';
import { HintDisplay } from './components/HintDisplay';
import { FirstTimeExperience, shouldShowTutorial } from './components/FirstTimeExperience';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

// Import our game engines
import { evaluateGuess, isWinningGuess, getMaxAttempts, updateKeyboardState, initializeKeyboardState, validateGuessInput } from './lib/gameEngine';
import { initializeHints, updateHintStates, revealHint, getRevealedHintsCount } from './lib/hintManager';
import { saveGameState, loadGameState, clearGameState, loadStats, saveStats, updateStats, isCurrentGameToday, hasTodayBeenPlayed } from './lib/localStorage';

// Import types
import type { TileState, KeyState, GameStatus, GameState, HintState, GameMode } from './types/game.types';

// Import personality utilities
import { getCombinedGreeting, getDiscoveryMessage, getVictoryMessage } from './utils/personality';

// Import API service
import { fetchDailyWord, formatDailyWordForGame, recordPlay } from './services/api';

// Fallback data in case API is not available
import todayData from './data/today.json';

import { shareWithImage } from './lib/shareCard';
import { RecapCard } from './components/RecapCard';
import { SettingsDialog } from './components/SettingsDialog';
import { ArchiveExperience } from './components/archive/ArchiveExperience';
import { Dashboard } from './components/Dashboard';
import { VocabExperience } from './components/VocabExperience';
import { ReviseExperience } from './components/ReviseExperience';
import { getAccessTier } from './lib/archiveStore';
import { saveActiveView, loadActiveView } from './lib/vocabStore';
import { trackGuess, trackHintRevealed, trackGameEnd, trackModeSwitch, trackShare, trackDropOff } from './lib/analytics';

// The archive and special puzzles stay dark unless this is explicitly on.
const ARCHIVE_ENABLED = import.meta.env.VITE_FEATURE_ARCHIVE === 'true';

function GearIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

// Small monochrome icons (stroke = currentColor, like lucide-react's icons
// were) so these render in the surrounding text color instead of a colored
// emoji glyph.
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

export default function App() {
  // Today's challenge data - will be loaded from API
  const [challenge, setChallenge] = useState(todayData);
  const [isLoading, setIsLoading] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('daily');
  const MAX_GUESSES = getMaxAttempts(challenge.wordLength);

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(() => {
    if (!shouldShowTutorial()) return false;
    // Don't show tutorial if the user already finished today's puzzle
    const saved = loadGameState();
    return !saved || saved.gameStatus === 'playing';
  });

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
  const [showSettings, setShowSettings] = useState(false);
  const [view, setView] = useState<'daily' | 'archive' | 'vocab' | 'revise' | 'dashboard'>(() => {
    if (window.location.hash === '#ops-7x9k2m') return 'dashboard';
    const saved = loadActiveView();
    if (saved && (saved === 'vocab' || saved === 'revise' || saved === 'archive')) {
      // Only restore non-daily view if daily has been played
      const dailyState = loadGameState();
      const todayET = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
      const [month, day, year] = todayET.split('/');
      const todayDate = `${year}-${month}-${day}`;
      if (dailyState && dailyState.date === todayDate && dailyState.gameStatus !== 'playing') {
        return saved as 'vocab' | 'revise' | 'archive';
      }
    }
    return 'daily';
  });
  const changeView = (v: typeof view) => { trackModeSwitch(view, v); setView(v); saveActiveView(v); };
  const [showViewDropdown, setShowViewDropdown] = useState(false);
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
    trackGuess('daily', newGuesses.length, challenge.wordLength);

    // Update keyboard
    const newKeyStates = updateKeyboardState(keyStates, currentGuess, evaluation);
    setKeyStates(newKeyStates);

    // Check win condition
    if (isWinningGuess(evaluation)) {
      setGameStatus('won');
      trackGameEnd('daily', true, newGuesses.length, getRevealedHintsCount(hintStates), 0);

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
      trackGameEnd('daily', false, newGuesses.length, getRevealedHintsCount(hintStates), 0);
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
    trackHintRevealed('daily', index, guesses.length);
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

  const handleShare = async () => {
    const totalHintsUsed = getRevealedHintsCount(hintStates);

    const result = await shareWithImage({
      gameNumber: challenge.gameNumber,
      evaluations,
      hintsUsed: totalHintsUsed,
      won: gameStatus === 'won',
      wordLength: challenge.wordLength,
    });

    if (result === 'shared') {
      trackShare('daily', 'native');
    } else if (result === 'clipboard') {
      trackShare('daily', 'clipboard');
      toast.success('Copied to clipboard');
    } else {
      toast.error('Failed to share');
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
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-gray-900 dark:text-gray-100">
              ClueLux
            </h1>
          </div>
        </header>

        {/* Loading State */}
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading today's puzzle...</p>
          </div>
        </main>
      </div>
    );
  }

  if (view === 'dashboard') {
    return <Dashboard onBack={() => { window.location.hash = ''; changeView('daily'); }} adminCode="cluelux-2026-ops" />;
  }

  if (ARCHIVE_ENABLED && view === 'archive') {
    return <ArchiveExperience onExit={() => changeView('daily')} />;
  }

  if (view === 'vocab') {
    return <VocabExperience onExit={() => { trackDropOff('vocab', 'exit'); changeView('daily'); }} />;
  }

  if (view === 'revise') {
    return <ReviseExperience onExit={() => { trackDropOff('revise', 'exit'); changeView('daily'); }} />;
  }

  const isFinished = gameStatus !== 'playing';

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
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-gray-900 dark:text-gray-100">
                ClueLux
              </h1>
              <div className="relative">
                <button
                  onClick={() => setShowViewDropdown(!showViewDropdown)}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg border border-amber-400/50 dark:border-amber-700/50 bg-gradient-to-r from-indigo-950/10 to-amber-500/10 text-amber-800 dark:text-amber-300 hover:from-indigo-950/20 hover:to-amber-500/20 transition-colors cursor-pointer"
                >
                  {view === 'daily' ? 'Daily' : view === 'archive' ? 'Archive' : view === 'vocab' ? 'Vocab' : 'Revise'}
                  <span className="text-[10px] leading-none opacity-60" aria-hidden="true">▼</span>
                </button>
                {showViewDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowViewDropdown(false)} />
                    <div className="absolute top-full left-0 mt-1 z-40 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden min-w-[110px]">
                      {(['daily', 'archive'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => { changeView(v); setShowViewDropdown(false); }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                            view === v
                              ? 'bg-gradient-to-r from-indigo-950/10 to-amber-500/10 text-amber-800 dark:text-amber-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              aria-label="How to play"
              className="hover:bg-gray-100 dark:hover:bg-slate-800 w-9 h-9"
            >
              <InfoIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStats(true)}
              aria-label="Stats"
              className="hover:bg-gray-100 dark:hover:bg-slate-800 w-9 h-9"
            >
              <TrophyIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              className="hover:bg-gray-100 dark:hover:bg-slate-800 w-9 h-9"
            >
              <GearIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Removed: "View result" bar was redundant — the result dialog auto-opens on completion */}

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

        {/* Hints panel — visible during and after game */}
        <HintDisplay hints={hintStates} onRevealHint={handleRevealHint} gameOver={isFinished} />

        {/* Keyboard — or post-game actions when finished */}
        {isFinished ? (
          <div className="mt-3 mx-auto w-full max-w-md space-y-2 pb-4">
            <Button onClick={handleShare} className="w-full h-11 bg-gradient-to-r from-indigo-900 to-amber-500 text-white hover:opacity-90">
              <span className="mr-2" aria-hidden="true">📤</span>
              Share Result
            </Button>
            <Button onClick={() => changeView('archive')} variant="outline" className="w-full h-11">
              ClueLux Archive
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
              wordLength={challenge.wordLength}
            />
          </div>
        )}
      </main>

      {/* Result Dialog — clean: emoji + word + streak lights, no grid replay */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {gameStatus === 'won' ? (
                <div className="py-2">
                  <span className="text-3xl font-bold tracking-tight">{getVictoryMessage(guesses.length, getRevealedHintsCount(hintStates), challenge.answer).title}</span>
                </div>
              ) : (
                <div className="py-2">
                  <span className="text-2xl font-bold">{getDiscoveryMessage(challenge.answer, guesses).title}</span>
                </div>
              )}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {challenge.answer.toUpperCase()}
                    {gameStatus === 'won' && <span className="text-gray-500 dark:text-gray-400"> in {guesses.length}</span>}
                  </p>
                  {gameStatus === 'won' && getRevealedHintsCount(hintStates) === 0 && (
                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-1">⚡ No hints needed</p>
                  )}
                  {playsToday !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {playsToday.toLocaleString()} {playsToday === 1 ? 'play' : 'plays'} today
                    </p>
                  )}
                </div>

                {/* Hint streak lights */}
                <div className="flex items-center justify-center gap-2">
                  {hintStates.map((hint, i) => (
                    <span
                      key={i}
                      className={
                        hint.revealed
                          ? 'h-3 w-3 rounded-full bg-lux shadow-[0_0_8px_2px_rgba(245,184,61,0.55)]'
                          : 'h-3 w-3 rounded-full bg-slate-300 dark:bg-slate-700'
                      }
                    />
                  ))}
                </div>

                {/* Countdown to next puzzle */}
                {gameMode === 'daily' && (
                  <div className="text-center p-4 bg-gradient-to-br from-indigo-950/5 to-amber-50 dark:from-indigo-950/30 dark:to-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40">
                    {timeUntilNext === '0:00:00' ? (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">New puzzle available!</p>
                        <Button onClick={handleNewGame} className="w-full bg-gradient-to-r from-indigo-900 to-amber-500 text-white hover:opacity-90">
                          ↻ Load New Puzzle
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Next puzzle in</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{timeUntilNext}</p>
                      </>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button onClick={handleShare} className="w-full bg-gradient-to-r from-indigo-900 to-amber-500 text-white hover:opacity-90">
                    <span className="mr-2" aria-hidden="true">📤</span>
                    Share Result
                  </Button>
                  <Button onClick={() => setShowResult(false)} variant="outline" className="w-full">
                    Back to board
                  </Button>
                  <Button onClick={() => setShowStats(true)} variant="outline" className="w-full">
                    <TrophyIcon className="h-4 w-4 mr-2" />
                    View Stats
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />

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

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{(stats.avgGuessesPerGame || 0).toFixed(1)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Avg Guesses</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.avgHintsPerGame.toFixed(1)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Avg Hints Used</div>
                  </div>
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
      <footer className="py-3 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center text-[11px] text-gray-400 dark:text-slate-600 space-y-1">
          <p>#{challenge.gameNumber} · {challenge.date}</p>
          <p>
            <a href="mailto:hello@cluelux.com" className="hover:text-gray-600 dark:hover:text-slate-400 transition-colors">Feedback</a>
            {' · '}
            <a href="https://instagram.com/cluelux" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-slate-400 transition-colors">Instagram</a>
          </p>
        </div>
      </footer>

    </div>
  );
}
