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
    <div className="flex flex-col gap-2">
      {rows.map((row, rowIndex) => {
        const hint = hints[rowIndex];
        const isLocked = !hint || !hint.unlocked;
        
        return (
          <div key={rowIndex} className="flex gap-2 justify-center items-center">
            {/* Light bulb on the left */}
            <button 
              onClick={() => handleHintClick(rowIndex)}
              className={`flex-shrink-0 p-1 rounded-full transition-colors ${
                isLocked 
                  ? 'opacity-30 cursor-not-allowed' 
                  : 'hover:bg-yellow-50 cursor-pointer'
              }`}
              aria-label={isLocked ? `Hint ${rowIndex + 1} locked` : `Show hint ${rowIndex + 1}`}
              disabled={isLocked}
            >
              <LightbulbIcon className={`h-6 w-6 ${isLocked ? 'text-gray-400' : 'text-yellow-500'}`} />
            </button>
            
            {/* Game tiles */}
            <div className="flex gap-2">
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
      
      {/* Popup overlay */}
      {showPopup !== null && hints[showPopup] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={popupRef}
            className="bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 transform transition-all animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-start gap-3">
              <LightbulbIcon className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-2">Hint {showPopup + 1}</h3>
                <p className="text-gray-700 leading-relaxed">
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
