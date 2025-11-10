import { useState, useEffect, useRef } from 'react';
import { GameTile } from './GameTile';
import type { HintState } from '../types/game.types';

type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';

interface GameBoardProps {
  guesses: string[];
  currentGuess: string;
  evaluations: TileState[][];
  maxGuesses: number;
  wordLength: number;
  hints: HintState[];
  onRevealHint?: (index: number) => void;
}

export function GameBoard({ guesses, currentGuess, evaluations, maxGuesses, wordLength, hints, onRevealHint }: GameBoardProps) {
  const [showPopup, setShowPopup] = useState<number | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const rows = Array.from({ length: maxGuesses }, (_, i) => {
    if (i < guesses.length) {
      return {
        letters: guesses[i].split(''),
        states: evaluations[i] || [],
      };
    } else if (i === guesses.length) {
      return {
        letters: currentGuess.padEnd(wordLength, ' ').split(''),
        states: Array(wordLength).fill('filled'),
      };
    } else {
      return {
        letters: Array(wordLength).fill(''),
        states: Array(wordLength).fill('empty'),
      };
    }
  });

  const handleHintClick = (rowIndex: number) => {
    const hint = hints[rowIndex];
    // Only show popup if hint is unlocked
    if (hint && hint.unlocked) {
      // Mark hint as revealed when clicked
      if (!hint.revealed && onRevealHint) {
        onRevealHint(rowIndex);
      }
      setShowPopup(rowIndex);
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
      {/* Elevated game board with dramatic shadow */}
      <div className="absolute inset-0 blur-3xl bg-gradient-to-b from-blue-400/20 via-purple-400/20 to-pink-400/10 -z-10 transform scale-110" />
      
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100">
        <div className="flex flex-col gap-3">
          {rows.map((row, rowIndex) => {
            const hint = hints[rowIndex];
            const isLocked = !hint || !hint.unlocked;
            const isRevealed = hint?.revealed;
            const isUnlockedNotViewed = hint?.unlocked && !hint?.revealed;
            
            return (
              <div key={rowIndex} className="flex flex-col gap-1.5">
                {/* Rectangular indicator light bar on top of each row */}
                <button 
                  onClick={() => handleHintClick(rowIndex)}
                  className={`
                    relative h-1.5 rounded-full transition-all duration-300 mx-auto
                    ${isLocked 
                      ? 'w-12 bg-gray-200 opacity-40 cursor-not-allowed' 
                      : isUnlockedNotViewed
                      ? 'w-16 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] cursor-pointer hover:shadow-[0_0_16px_rgba(251,191,36,0.8)] hover:w-20 active:scale-95'
                      : 'w-16 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] cursor-pointer hover:shadow-[0_0_12px_rgba(16,185,129,0.6)] hover:w-20 active:scale-95'
                    }
                  `}
                  aria-label={
                    isLocked 
                      ? `Hint ${rowIndex + 1} locked` 
                      : isRevealed
                      ? `Hint ${rowIndex + 1} viewed - click to view again`
                      : `New hint ${rowIndex + 1} available!`
                  }
                  disabled={isLocked}
                >
                  {/* Animated shimmer effect for unlocked hints */}
                  {isUnlockedNotViewed && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2s_infinite]" />
                  )}
                </button>
                
                {/* Game tiles */}
                <div className="flex gap-3 sm:gap-2 justify-center">
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
      
      {/* Enhanced popup overlay */}
      {showPopup !== null && hints[showPopup] && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 px-4 animate-in fade-in duration-300">
          <div 
            ref={popupRef}
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-4xl">
                💡
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Hint #{showPopup + 1}
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed">
                  {hints[showPopup]?.text || 'No hint available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
