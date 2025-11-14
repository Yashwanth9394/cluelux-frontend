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
import { saveGameState, loadGameState, clearGameState, loadStats, saveStats, updateStats, isCurrentGameToday } from './lib/localStorage';

// Import types
import type { TileState, KeyState, GameStatus, GameState, HintState } from './types/game.types';

// Import personality utilities
import { getCombinedGreeting, getDiscoveryMessage, getVictoryMessage } from './utils/personality';

// Import API service
import { fetchDailyWord, formatDailyWordForGame } from './services/api';

// Fallback data in case API is not available
import todayData from './data/today.json';

export default function App() {
  // Today's challenge data - will be loaded from API
  const [challenge, setChallenge] = useState(todayData);
  const [isLoading, setIsLoading] = useState(true);
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
        toast.success('Daily word loaded! 🎯', { duration: 2000 });
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
      } else {
        toast.info('Welcome back! Game restored 🎮');
      }
    } else {
      // Start fresh game
      clearGameState();
      const greeting = getCombinedGreeting();
      toast.info(greeting, {
        description: `ClueLux #${challenge.gameNumber}`,
        duration: 4000,
      });
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
      // Still show toast but shake provides immediate visual feedback
      toast.error(validation.error || 'Invalid guess', {
        duration: 2000,
      });
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
      
      // Use discovery message instead of "game over"
      const discovery = getDiscoveryMessage(challenge.answer, newGuesses);
      toast(discovery.title, {
        description: discovery.message,
        icon: discovery.emoji,
        duration: 5000,
      });
      return;
    }

    // Save game state
    const currentState: GameState = {
      date: challenge.date,
      gameNumber: challenge.gameNumber,
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
    toast.success('💡 Hint revealed!');
    
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

  const handleShare = () => {
    const emoji = evaluations.map(row => 
      row.map(state => 
        state === 'correct' ? '🟩' :
        state === 'present' ? '🟨' : '⬜'
      ).join('')
    ).join('\n');
    
    // Calculate hints used
    const totalHintsUsed = getRevealedHintsCount(hintStates);
    
    // Get personalized victory message
    const victory = getVictoryMessage(guesses.length, totalHintsUsed, challenge.answer);
    const hintGlyph = totalHintsUsed === 0 ? ' ⚡' : '';
    
    const text = `ClueLux #${challenge.gameNumber} · ${guesses.length}/${MAX_GUESSES}${hintGlyph}\n\n${emoji}\n\n${victory.shareQuote}`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success('✨ Results copied to clipboard!', {
        description: 'Share your score with friends!'
      });
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const stats = loadStats();

  // Show loading screen while fetching daily word
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans">
        <Toaster />

        {/* Header */}
        <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight" style={{ fontSize: '48px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
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
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Hero typography: 48px (6 * 8px) */}
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight" style={{ fontSize: '48px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>
            ClueLux
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHelp(true)}
              className="hover:bg-gray-100 dark:hover:bg-slate-800 w-11 h-11"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowStats(true)}
              className="hover:bg-gray-100 dark:hover:bg-slate-800 w-11 h-11"
            >
              <Trophy className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-2">
        {/* Game Info - Minimal, only essential */}
        <div className="text-center mb-2">
          <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '14px', lineHeight: '1.5' }}>
            {guesses.length}/{MAX_GUESSES} attempts
          </p>
        </div>

        {/* Error Message - removed since shake animation provides inline feedback */}

        {/* Game Board */}
        <div className="mb-2">
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
        <div className="mb-2">
          <HintDisplay hints={hintStates} onRevealHint={handleRevealHint} />
        </div>

        {/* Keyboard */}
        <div className="mt-2">
          <Keyboard
            onKeyPress={handleKeyPress}
            onEnter={handleEnter}
            onBackspace={handleBackspace}
            keyStates={keyStates}
            disabled={gameStatus !== 'playing'}
          />
        </div>
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

                {/* Countdown to next puzzle */}
                <div className="text-center p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Next puzzle in</p>
                  <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
                    {timeUntilNext}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Button onClick={handleShare} className="w-full">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Result
                  </Button>
                  <Button onClick={() => setShowStats(true)} variant="outline" className="w-full">
                    <Trophy className="h-4 w-4 mr-2" />
                    View Stats
                  </Button>
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
                  <li>Clicking hint #4 automatically counts as using 4 hints</li>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Statistics</DialogTitle>
            <DialogDescription className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold">{stats.totalGames}</div>
                  <div className="text-xs text-gray-600">Games Played</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold">
                    {stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-600">Win Rate</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold">{stats.currentStreak}</div>
                  <div className="text-xs text-gray-600">Current Streak</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold">{stats.maxStreak}</div>
                  <div className="text-xs text-gray-600">Max Streak</div>
                </div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold">{stats.avgHintsPerGame.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Average Hints Used</div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Footer - Clean and inspiring with proper spacing */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-3 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400" style={{ fontSize: '14px', lineHeight: '1.5' }}>
          <p>Crafted for word lovers everywhere</p>
        </div>
      </footer>
    </div>
  );
}
