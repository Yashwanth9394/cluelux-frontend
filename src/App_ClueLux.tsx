import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { Keyboard } from './components/Keyboard';
import { HintDisplay } from './components/HintDisplay';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './components/ui/dialog';
import { Toaster } from './components/ui/sonner';
import { RotateCcw, Trophy, XCircle, HelpCircle, Share2, Clock } from 'lucide-react';
import { toast } from 'sonner';

// Import our game engines
import { evaluateGuess, isWinningGuess, getMaxAttempts, updateKeyboardState, initializeKeyboardState, validateGuessInput } from './lib/gameEngine';
import { initializeHints, updateHintStates, revealHint, getRevealedHintsCount } from './lib/hintManager';
import { saveGameState, loadGameState, clearGameState, loadStats, saveStats, updateStats, isCurrentGameToday } from './lib/localStorage';
import { formatTimeUntilNextPuzzle } from './utils/timeUtils';

// Import types
import type { TileState, KeyState, GameStatus, GameState, HintState } from './types/game.types';

// Import today's challenge
import todayData from './data/today.json';

export default function App() {
  // Today's challenge data
  const challenge = todayData;
  const MAX_GUESSES = getMaxAttempts(challenge.wordLength);

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

  // Hint system
  const [hintStates, setHintStates] = useState<HintState[]>(() => initializeHints(challenge.hints));
  const [wrongAttempts, setWrongAttempts] = useState(0);
  
  // Timer for next puzzle
  const [timeUntilNext, setTimeUntilNext] = useState(formatTimeUntilNextPuzzle());

  // Initialize or restore game
  useEffect(() => {
    const savedState = loadGameState();
    
    if (savedState && isCurrentGameToday(challenge.date)) {
      // Restore saved game
      setGuesses(savedState.guesses);
      setEvaluations(savedState.evaluations);
      setGameStatus(savedState.gameStatus);
      setWrongAttempts(savedState.guesses.length - (savedState.gameStatus === 'won' ? 1 : 0));
      
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
  }, []);

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

  // Auto-show result when game ends
  useEffect(() => {
    if (gameStatus !== 'playing') {
      setShowResult(true);
    }
  }, [gameStatus]);
  
  // Update countdown timer every minute
  useEffect(() => {
    if (gameStatus !== 'playing') {
      const interval = setInterval(() => {
        setTimeUntilNext(formatTimeUntilNextPuzzle());
      }, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [gameStatus]);

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
      setErrorMessage(validation.error || 'Invalid guess');
      // Enhanced error feedback with shake animation hint
      toast.error(validation.error || 'Invalid guess', {
        icon: '❌',
        duration: 2000,
      });
      // Trigger shake animation by briefly setting and clearing error
      setTimeout(() => setErrorMessage(''), 2500);
      return;
    }

    // Evaluate guess
    const evaluation = evaluateGuess(currentGuess, challenge.answer);
    const newGuesses = [...guesses, currentGuess];
    const newEvaluations = [...evaluations, evaluation];
    
    setGuesses(newGuesses);
    setEvaluations(newEvaluations);
    setCurrentGuess('');
    
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
        gameStatus: 'won',
        startTime: Date.now(),
        wordLength: challenge.wordLength,
      };
      saveGameState(finalState);
      
      // Update stats
      const stats = loadStats();
      const newStats = updateStats(stats, finalState);
      saveStats(newStats);
      
      // Victory message based on performance
      const victoryMessages = [
        '🎯 INCREDIBLE! First try!',
        '⚡ GENIUS! Two guesses!',
        '🧠 BRILLIANT! Three guesses!',
        '🎉 AMAZING! You got it!',
        '👏 WELL DONE! Victory!',
        '🌟 NICE WORK! You won!',
      ];
      const message = victoryMessages[Math.min(newGuesses.length - 1, victoryMessages.length - 1)];
      toast.success(message, { duration: 4000 });
      return;
    }

    // Update hints on wrong guess
    const newWrongAttempts = wrongAttempts + 1;
    setWrongAttempts(newWrongAttempts);
    const newHintStates = updateHintStates(hintStates, newWrongAttempts, challenge.wordLength);
    
    // Check if new hint unlocked
    const newlyUnlocked = newHintStates.filter((h, i) => h.unlocked && !hintStates[i].unlocked);
    if (newlyUnlocked.length > 0) {
      toast.info('💡 New hint unlocked!', { duration: 2000 });
    }
    
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
        gameStatus: 'lost',
        startTime: Date.now(),
        wordLength: challenge.wordLength,
      };
      saveGameState(finalState);
      
      // Update stats
      const stats = loadStats();
      const newStats = updateStats(stats, finalState);
      saveStats(newStats);
      
      toast.error(`The word was: ${challenge.answer.toUpperCase()}`, { 
        icon: '💭',
        duration: 4000 
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
    
    const text = `ClueLux #${challenge.gameNumber}\n${gameStatus === 'won' ? guesses.length : 'X'}/${MAX_GUESSES}\n${emoji}\n\nPlay at cluelux.com`;
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    });
  };

  const stats = loadStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex flex-col">
      <Toaster />
      
      {/* Enhanced Header with subtle appearance */}
      <header className="border-b bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              ClueLux
            </h1>
            {stats.currentStreak > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-sm font-semibold text-gray-600">
                <span className="text-orange-500">🔥</span>
                <span>{stats.currentStreak}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowHelp(true)}
              className="hover:bg-purple-50 transition-colors"
            >
              <HelpCircle className="h-5 w-5 text-gray-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowStats(true)}
              className="hover:bg-purple-50 transition-colors"
            >
              <Trophy className="h-5 w-5 text-gray-600" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Better spacing and hierarchy */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 sm:py-12">
        {/* Game Info - More subtle */}
        <div className="text-center mb-8 space-y-1">
          <p className="text-sm sm:text-base font-medium text-gray-700">
            Game #{challenge.gameNumber}
          </p>
          <p className="text-xs text-gray-500">
            {challenge.wordLength} letters · {guesses.length}/{MAX_GUESSES} attempts · {challenge.metadata.difficulty}
          </p>
        </div>

        {/* Error Message with animation */}
        {errorMessage && (
          <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
            <Alert variant="destructive" className="max-w-md mx-auto shadow-lg">
              <AlertDescription className="font-medium">{errorMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Game Board - HERO ELEMENT with more prominence */}
        <div className="mb-8 sm:mb-12">
          <GameBoard
            guesses={guesses}
            currentGuess={currentGuess}
            evaluations={evaluations}
            maxGuesses={MAX_GUESSES}
            wordLength={challenge.wordLength}
            hints={hintStates}
            onRevealHint={handleRevealHint}
          />
        </div>

        {/* Hints - Collapsible and less prominent */}
        {guesses.length > 0 && (
          <div className="mb-8">
            <HintDisplay hints={hintStates} onRevealHint={handleRevealHint} />
          </div>
        )}

        {/* Keyboard */}
        <Keyboard
          onKeyPress={handleKeyPress}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          keyStates={keyStates}
          disabled={gameStatus !== 'playing'}
        />
      </main>

      {/* Enhanced Result Dialog with celebrations */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {gameStatus === 'won' ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="relative">
                    <Trophy className="h-16 w-16 text-yellow-500 animate-bounce" />
                    <div className="absolute -top-2 -right-2 text-2xl animate-ping">✨</div>
                  </div>
                  <div>
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-yellow-600 via-orange-500 to-pink-600 bg-clip-text text-transparent">
                      {guesses.length === 1 ? '🎯 PERFECT!' : 
                       guesses.length <= 3 ? '⚡ GENIUS!' :
                       getRevealedHintsCount(hintStates) === 0 ? '🧠 NO HINTS!' :
                       '🎉 VICTORY!'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-4">
                  <XCircle className="h-16 w-16 text-red-500" />
                  <span className="text-2xl font-bold text-gray-800">Next Time!</span>
                </div>
              )}
            </DialogTitle>
            <DialogDescription className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold text-gray-900">
                  {gameStatus === 'won' 
                    ? `Solved in ${guesses.length}/${MAX_GUESSES} attempts`
                    : `The word was: ${challenge.answer.toUpperCase()}`
                  }
                </p>
                {gameStatus === 'won' && (
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="text-amber-500">💡</span>
                      {getRevealedHintsCount(hintStates)} hints used
                    </span>
                    {stats.currentStreak > 0 && (
                      <span className="flex items-center gap-1">
                        <span className="text-orange-500">🔥</span>
                        {stats.currentStreak} day streak
                      </span>
                    )}
                  </div>
                )}
                {gameStatus === 'lost' && (
                  <p className="text-sm text-gray-600">
                    You found {guesses.length > 0 ? 'some' : 'no'} letters. Keep practicing!
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleShare} 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Result
                </Button>
                <Button 
                  onClick={() => setShowStats(true)} 
                  variant="outline" 
                  className="w-full border-2 hover:bg-purple-50"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  View Stats
                </Button>
              </div>
              
              {/* Countdown to next puzzle */}
              <div className="text-center pt-4 border-t">
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">New puzzle in {timeUntilNext}</span>
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
                <p className="text-sm">
                  Get helpful hints as you make wrong guesses! Each wrong guess unlocks a new hint that gives you clues about the word.
                </p>
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

      {/* Enhanced Stats Dialog */}
      <Dialog open={showStats} onOpenChange={setShowStats}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Your Statistics
            </DialogTitle>
            <DialogDescription className="space-y-6">
              {/* Primary Stats - Visual Hierarchy */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="text-4xl font-extrabold text-gray-900">{stats.totalGames}</div>
                  <div className="text-xs uppercase tracking-wide text-gray-600 font-semibold mt-2">Games Played</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="text-4xl font-extrabold text-gray-900">
                    {stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0}%
                  </div>
                  <div className="text-xs uppercase tracking-wide text-gray-600 font-semibold mt-2">Win Rate</div>
                </div>
              </div>

              {/* Streak Stats - Highlighted */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                  <div className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-2">Current Streak</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl">🔥</span>
                    <span className="text-3xl font-extrabold text-orange-600">{stats.currentStreak}</span>
                  </div>
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                  <div className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-2">Best Streak</div>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl">🏆</span>
                    <span className="text-3xl font-extrabold text-purple-600">{stats.maxStreak}</span>
                  </div>
                </div>
              </div>

              {/* Additional Stat */}
              <div className="text-center p-5 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="text-left">
                    <div className="text-2xl font-bold text-gray-900">{stats.avgHintsPerGame.toFixed(1)}</div>
                    <div className="text-xs text-gray-600">Average Hints Per Game</div>
                  </div>
                </div>
              </div>

              {/* Motivational Message */}
              {stats.currentStreak > 0 && (
                <div className="text-center text-sm text-gray-600 italic border-t pt-4">
                  {stats.currentStreak === 1 ? "Great start! Keep going! 💪" :
                   stats.currentStreak < 7 ? "You're on fire! 🔥" :
                   stats.currentStreak < 30 ? "Unstoppable! 🚀" :
                   "LEGENDARY status! 👑"}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>ClueLux · Word Guessing Game · Made with ❤️</p>
        </div>
      </footer>
    </div>
  );
}
