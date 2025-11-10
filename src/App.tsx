import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { Keyboard } from './components/Keyboard';
import { HintDisplay } from './components/HintDisplay';
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

  // Initialize or restore game
  useEffect(() => {
    const savedState = loadGameState();
    
    if (savedState && isCurrentGameToday(challenge.date)) {
      // Restore saved game
      setGuesses(savedState.guesses);
      setEvaluations(savedState.evaluations);
      setGameStatus(savedState.gameStatus);
      
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
      toast.info(`🎯 ClueLux #${challenge.gameNumber} - Let's play!`);
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
      toast.error(validation.error || 'Invalid guess');
      setTimeout(() => setErrorMessage(''), 3000);
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
      
      toast.success('🎉 Congratulations! You won!');
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
        gameStatus: 'lost',
        startTime: Date.now(),
        wordLength: challenge.wordLength,
      };
      saveGameState(finalState);
      
      // Update stats
      const stats = loadStats();
      const newStats = updateStats(stats, finalState);
      saveStats(newStats);
      
      toast.error(`Game over! The word was ${challenge.answer}`);
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
      toast.success('✨ Results copied to clipboard!', {
        description: 'Share your score with friends!'
      });
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const stats = loadStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <Toaster />
      
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🧩 ClueLux
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowHelp(true)}>
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShowStats(true)}>
              <Trophy className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {/* Game Info */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600">
            Game #{challenge.gameNumber} · {challenge.wordLength} letters · {guesses.length}/{MAX_GUESSES} attempts
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {challenge.metadata.category} · {challenge.metadata.difficulty}
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Game Board */}
        <div className="mb-6">
          <GameBoard
            guesses={guesses}
            currentGuess={currentGuess}
            evaluations={evaluations}
            maxGuesses={MAX_GUESSES}
            wordLength={challenge.wordLength}
            hints={hintStates}
          />
        </div>

        {/* Hints */}
        <div className="mb-6">
          <HintDisplay hints={hintStates} onRevealHint={handleRevealHint} />
        </div>

        {/* Keyboard */}
        <Keyboard
          onKeyPress={handleKeyPress}
          onEnter={handleEnter}
          onBackspace={handleBackspace}
          keyStates={keyStates}
          disabled={gameStatus !== 'playing'}
        />
      </main>

      {/* Result Dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {gameStatus === 'won' ? (
                <div className="flex flex-col items-center gap-2">
                  <Trophy className="h-12 w-12 text-yellow-500" />
                  <span className="text-2xl">Congratulations!</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="h-12 w-12 text-red-500" />
                  <span className="text-2xl">Game Over</span>
                </div>
              )}
            </DialogTitle>
            <DialogDescription className="space-y-4">
              <div className="text-center">
                <p className="text-lg mb-2">
                  {gameStatus === 'won' 
                    ? `You guessed the word in ${guesses.length} ${guesses.length === 1 ? 'attempt' : 'attempts'}!`
                    : `The word was: ${challenge.answer}`
                  }
                </p>
                <p className="text-sm text-gray-600">
                  {getRevealedHintsCount(hintStates)} hint{getRevealedHintsCount(hintStates) !== 1 ? 's' : ''} revealed
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
                  Get AI-generated hints as you make wrong guesses! Each wrong guess unlocks a new hint that gives you clues about the word.
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

      {/* Footer */}
      <footer className="border-t bg-white py-4">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-600">
          <p>ClueLux · AI-Powered Word Guessing Game · Made with ❤️</p>
        </div>
      </footer>
    </div>
  );
}
