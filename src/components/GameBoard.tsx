import { useState, useEffect, useRef } from 'react';
import { GameTile } from './GameTile';
import { Trophy } from 'lucide-react';
import type { HintState } from '../types/game.types';

type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';
type GameStatus = 'playing' | 'won' | 'lost';

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  evaluations: TileState[][];
  maxGuesses: number;
  wordLength: number;
  hints: HintState[];
  onRevealHint?: (index: number) => void;
  gameStatus?: GameStatus;
  shakeRow?: number | null; // New prop for shake animation
}

export function GameBoard({ guesses, currentGuess, evaluations, maxGuesses, wordLength, hints, onRevealHint, gameStatus, shakeRow }: GameBoardProps) {
  const [showPopup, setShowPopup] = useState<number | null>(null);
  const [showTrophy, setShowTrophy] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Show trophy animation on victory
  useEffect(() => {
    if (gameStatus === 'won') {
      setTimeout(() => setShowTrophy(true), 300);
    }
  }, [gameStatus]);

  const rows = Array.from({ length: maxGuesses }, (_, i) => {
    if (i < guesses.length) {
      return {
        letters: guesses[i].split(''),
        states: evaluations[i] || [],
        isWinningRow: gameStatus === 'won' && i === guesses.length - 1,
      };
    } else if (i === guesses.length) {
      return {
        letters: currentGuess.padEnd(wordLength, ' ').split(''),
        states: Array(wordLength).fill('filled'),
        isWinningRow: false,
      };
    } else {
      return {
        letters: Array(wordLength).fill(''),
        states: Array(wordLength).fill('empty'),
        isWinningRow: false,
      };
    }
  });

  const handleHintClick = (hintIndex: number) => {
    const hint = hints[hintIndex];
    // Only show popup if hint is unlocked
    if (hint && hint.unlocked) {
      // Mark hint as revealed when clicked
      if (!hint.revealed && onRevealHint) {
        onRevealHint(hintIndex);
      }
      setShowPopup(hintIndex);
      setTimeout(() => {
        setShowPopup(null);
      }, 3500);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPopup(null);
      }
    };

    if (showPopup !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPopup]);

  return (
    <div className="relative">
      {/* Trophy icon on victory */}
      {showTrophy && gameStatus === 'won' && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10 animate-trophy-bounce">
          <Trophy className="w-10 h-10 text-amber-500 drop-shadow-lg" />
        </div>
      )}
      
      <div className="rounded-2xl p-2 sm:p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
        <div className="flex flex-col gap-3">
          {rows.map((row, rowIndex) => {
            // Skip light bar for first row (rowIndex 0)
            // Map remaining rows to hints: row 1 -> hint 0, row 2 -> hint 1, etc.
            const hintIndex = rowIndex - 1;
            const hint = rowIndex > 0 ? hints[hintIndex] : null;
            const isLocked = !hint || !hint.unlocked;
            const isRevealed = hint?.revealed;
            const isUnlockedNotViewed = hint?.unlocked && !hint?.revealed;
            const shouldShake = shakeRow === rowIndex;

            return (
              <div key={rowIndex} className="flex flex-col gap-1.5">
                {/* Minimal indicator - skip for first row */}
                {rowIndex > 0 && (
                  <button
                    onClick={() => handleHintClick(hintIndex)}
                    className={`
                      relative h-1 rounded-full transition-all duration-300 mx-auto
                      ${isLocked
                        ? 'w-2 bg-slate-300 dark:bg-slate-700 opacity-20 cursor-not-allowed'
                        : isUnlockedNotViewed
                        ? 'w-8 bg-amber-500 cursor-pointer hover:w-9 hover:shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-hint-breathe'
                        : 'w-3 bg-blue-500 opacity-60 cursor-pointer hover:scale-105 hover:opacity-70 transition-transform'
                      }
                    `}
                    aria-label={
                      isLocked
                        ? `Hint ${hintIndex + 1} locked`
                        : isRevealed
                        ? `Hint ${hintIndex + 1} viewed`
                        : `Hint ${hintIndex + 1} available`
                    }
                    disabled={isLocked}
                  />
                )}
                
                {/* Game tiles with victory glow and shake animation */}
                <div className={`
                  flex gap-2 justify-center transition-all
                  ${row.isWinningRow 
                    ? 'p-2 rounded-lg bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-amber-950/30 animate-glow-pulse' 
                    : ''
                  }
                  ${shouldShake ? 'animate-shake' : ''}
                `}>
                  {row.letters.map((letter, colIndex) => (
                    <GameTile
                      key={`${rowIndex}-${colIndex}`}
                      letter={letter.trim()}
                      state={letter.trim() ? row.states[colIndex] : 'empty'}
                      position={colIndex}
                      delay={rowIndex < guesses.length ? colIndex : 0}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Simple hint popup */}
      {showPopup !== null && hints[showPopup] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div 
            ref={popupRef}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full border border-gray-200 dark:border-slate-800"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">
                💡
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-3 text-gray-900 dark:text-white">
                  Hint #{showPopup + 1}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                  {hints[showPopup]?.text || 'No hint available'}
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <button 
                onClick={() => setShowPopup(null)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Click anywhere to dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
