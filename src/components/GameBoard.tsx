import { useState, useEffect, useRef } from 'react';
import { GameTile } from './GameTile';
import { canRevealHint } from '../lib/hintManager';
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
  const popupRef = useRef<HTMLDivElement>(null);

  // Fluid tile size: words run 5-12 letters, and a fixed tile size that looks
  // right at 6 letters overflows badly at 12 on a narrow phone (or a folded
  // foldable, where height is the tighter constraint than width - hence
  // vmin, not vw, so it adapts to whichever dimension is actually smaller).
  const gapPx = 4; // matches the row's gap-1
  // 84vmin, not 100: leaves room for the page's own side padding (px-4, 32px)
  // and the board card's padding (p-2, 16px) that sit outside this row.
  // Bounds are px, not rem: the OS/browser "larger text" setting can scale
  // the root font-size independently of the actual viewport, and a rem floor
  // would scale right along with it, fighting the vmin term and overflowing
  // again. Real pinch/page zoom (re-enabled by the viewport meta fix) scales
  // vmin itself correctly, so this doesn't need to track font-size at all.
  const tileSize = `clamp(22px, calc((84vmin - ${(wordLength - 1) * gapPx}px) / ${wordLength}), 64px)`;

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
    // Only show popup if this hint is actually revealable (unlocked AND every earlier hint already revealed)
    if (hint && canRevealHint(hints, hintIndex)) {
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
      <div className="rounded-2xl p-2 sm:p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800">
        <div className="flex flex-col gap-1">
          {rows.map((row, rowIndex) => {
            // Skip light bar for first row (rowIndex 0)
            // Map remaining rows to hints: row 1 -> hint 0, row 2 -> hint 1, etc.
            const hintIndex = rowIndex - 1;
            const hint = rowIndex > 0 ? hints[hintIndex] : null;
            const isUnlocked = !!hint?.unlocked;
            const isRevealed = hint?.revealed;
            const canReveal = hint ? canRevealHint(hints, hintIndex) : false;
            // Unlocked but waiting on an earlier hint being revealed first
            const isBlockedBySequence = isUnlocked && !isRevealed && !canReveal;
            const isUnlockedNotViewed = canReveal && !isRevealed;
            const shouldShake = shakeRow === rowIndex;

            return (
              <div key={rowIndex} className="flex flex-col gap-1">
                {/* Minimal indicator - skip for first row, and skip entirely until this hint unlocks */}
                {rowIndex > 0 && isUnlocked && (
                  <button
                    onClick={() => handleHintClick(hintIndex)}
                    className={`
                      relative h-1 rounded-full transition-all duration-300 mx-auto
                      ${isBlockedBySequence
                        ? 'w-2 bg-slate-300 dark:bg-slate-700 opacity-30 cursor-not-allowed'
                        : isUnlockedNotViewed
                        ? 'w-8 bg-amber-500 cursor-pointer hover:w-9 hover:shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-hint-breathe'
                        : 'w-3 bg-blue-500 opacity-60 cursor-pointer hover:scale-105 hover:opacity-70 transition-transform'
                      }
                    `}
                    aria-label={
                      isBlockedBySequence
                        ? `Reveal Hint ${hintIndex} first`
                        : isRevealed
                        ? `Hint ${hintIndex + 1} viewed`
                        : `Hint ${hintIndex + 1} available`
                    }
                    disabled={isBlockedBySequence}
                  />
                )}
                
                {/* Game tiles with victory glow and shake animation */}
                <div className={`
                  flex gap-1 justify-center transition-all duration-500
                  ${row.isWinningRow
                    ? 'p-2 rounded-xl bg-gradient-to-r from-amber-50/80 via-yellow-50 to-amber-50/80 dark:from-amber-950/20 dark:via-yellow-950/30 dark:to-amber-950/20 shadow-lg animate-glow-pulse'
                    : ''
                  }
                  ${shouldShake ? 'animate-shake' : ''}
                `}>
                  {row.letters.map((letter, colIndex) => (
                    <GameTile
                      key={`${rowIndex}-${colIndex}`}
                      letter={letter.trim()}
                      state={letter.trim() ? row.states[colIndex] : 'empty'}
                      size={tileSize}
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
