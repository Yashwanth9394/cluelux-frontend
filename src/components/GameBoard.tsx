import { useState, useEffect, useRef } from 'react';
import { LightbulbIcon, Lock, CheckCircle2 } from 'lucide-react';
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
              <div key={rowIndex} className="flex gap-3 justify-center items-center">
                {/* Three-state light bulb indicator */}
                <button 
                  onClick={() => handleHintClick(rowIndex)}
                  className={`
                    relative flex-shrink-0 p-2 rounded-full transition-all duration-300
                    ${isLocked 
                      ? 'opacity-25 cursor-not-allowed' 
                      : isUnlockedNotViewed
                      ? 'hover:bg-yellow-50 hover:scale-110 cursor-pointer active:scale-95'
                      : 'hover:bg-green-50 hover:scale-105 cursor-pointer active:scale-95'
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
                  {/* State 1: Locked - Gray bulb with lock icon */}
                  {isLocked && (
                    <div className="relative">
                      <LightbulbIcon className="h-6 w-6 text-gray-300" />
                      <Lock className="h-3 w-3 text-gray-400 absolute -bottom-0.5 -right-0.5" />
                    </div>
                  )}
                  
                  {/* State 2: Unlocked but not viewed - Glowing yellow bulb */}
                  {isUnlockedNotViewed && (
                    <div className="relative">
                      <LightbulbIcon className="h-6 w-6 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                      {/* Subtle glow indicator */}
                      <div className="absolute inset-0 rounded-full bg-amber-400/20" />
                    </div>
                  )}
                  
                  {/* State 3: Viewed - Green bulb with checkmark */}
                  {isRevealed && !isLocked && (
                    <div className="relative">
                      <LightbulbIcon className="h-6 w-6 text-emerald-500" />
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
                    </div>
                  )}
                </button>
                
                {/* Game tiles */}
                <div className="flex gap-3 sm:gap-2">
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
              <div className="flex-shrink-0">
                <LightbulbIcon className="h-8 w-8 text-yellow-500 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-3 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  💡 Hint #{showPopup + 1}
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
