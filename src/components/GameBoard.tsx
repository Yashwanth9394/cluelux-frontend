import { useState, useEffect, useRef } from 'react';
import { LightbulbIcon } from 'lucide-react';
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
}

export function GameBoard({ guesses, currentGuess, evaluations, maxGuesses, wordLength, hints }: GameBoardProps) {
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
            
            return (
              <div key={rowIndex} className="flex gap-3 justify-center items-center">
                {/* Enhanced light bulb with animations */}
                <button 
                  onClick={() => handleHintClick(rowIndex)}
                  className={`
                    flex-shrink-0 p-2 rounded-full transition-all duration-200 
                    ${isLocked 
                      ? 'opacity-30 cursor-not-allowed' 
                      : 'hover:bg-yellow-50 hover:scale-110 cursor-pointer active:scale-95'
                    }
                  `}
                  aria-label={isLocked ? `Hint ${rowIndex + 1} locked` : `Show hint ${rowIndex + 1}`}
                  disabled={isLocked}
                >
                  <LightbulbIcon 
                    className={`h-6 w-6 transition-all ${
                      isLocked ? 'text-gray-400' : 'text-yellow-500 hover:text-yellow-600'
                    }`} 
                  />
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
