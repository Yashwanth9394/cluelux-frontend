import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Card } from './ui/card';
import { canRevealHint } from '../lib/hintManager';
import type { HintState } from '../types/game.types';

const STREAK_SEGMENTS = Array.from({ length: 16 }, (_, i) => {
  const t = i / 15;
  return {
    offset: (i + 1) * 0.9,
    opacity: Math.pow(1 - t, 1.4) * 0.98,
    color: i < 4 ? '#ffe6a3' : '#f5b83d',
  };
});

interface HintDisplayProps {
  hints: HintState[];
  onRevealHint: (index: number) => void;
  gameOver?: boolean;
}

export function HintDisplay({ hints, onRevealHint, gameOver = false }: HintDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [solvedWithoutToast, setSolvedWithoutToast] = useState<number | null>(null);
  const revealedCount = hints.filter(h => h.revealed).length;
  const unlockedCount = hints.filter(h => h.unlocked).length;

  const unrevealedUnlocked = hints.filter(h => h.unlocked && !h.revealed).length;
  const showStreak = !gameOver && unrevealedUnlocked > 0 && !isExpanded;

  const handlePostGameHintClick = (index: number) => {
    setSolvedWithoutToast(index);
    setTimeout(() => setSolvedWithoutToast(null), 2500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-2">
      <div className={`rounded-lg ${showStreak ? 'hint-streak relative p-[2px]' : ''}`}>
        {showStreak && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full"
          >
            {STREAK_SEGMENTS.map((seg, i) => (
              <rect
                key={i}
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                rx="7"
                ry="7"
                pathLength={100}
                className="hint-streak-seg"
                stroke={seg.color}
                strokeOpacity={seg.opacity}
                style={{ '--off': `${seg.offset}px` } as CSSProperties}
              />
            ))}
          </svg>
        )}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative z-10 w-full flex items-center justify-between px-3 py-2 rounded-[6px] hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
            showStreak
              ? 'bg-white dark:bg-slate-900 border-0'
              : 'bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {gameOver
                ? `${revealedCount} hint${revealedCount !== 1 ? 's' : ''} used`
                : revealedCount > 0
                  ? `${revealedCount} hint${revealedCount > 1 ? 's' : ''} viewed`
                  : 'View hints'}
              {!gameOver && unlockedCount > 0 && ` (${unlockedCount} available)`}
            </span>
          </div>
          <span className="text-gray-500 text-xs leading-none" aria-hidden="true">
            {isExpanded ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-1.5 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {hints.map((hint) => {
            const canReveal = canRevealHint(hints, hint.index);
            const isVisible = hint.revealed || canReveal || gameOver || hint.unlocked;
            if (!isVisible) return null;

            if (hint.revealed) {
              return (
                <Card
                  key={hint.index}
                  className="p-2.5 bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold shrink-0">Hint {hint.index + 1}:</span>
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{hint.text}</p>
                  </div>
                </Card>
              );
            }

            if (gameOver) {
              return (
                <Card
                  key={hint.index}
                  className="p-2.5 bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                  onClick={() => handlePostGameHintClick(hint.index)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold shrink-0">Hint {hint.index + 1}:</span>
                    {solvedWithoutToast === hint.index ? (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">You solved without this hint!</p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500">Not used</p>
                    )}
                  </div>
                </Card>
              );
            }

            if (!canReveal) {
              const prevUnrevealed = hints.findIndex((h, i) => i < hint.index && h.unlocked && !h.revealed);
              const blockingHint = prevUnrevealed >= 0 ? prevUnrevealed + 1 : hint.index;
              return (
                <Card
                  key={hint.index}
                  className="p-2.5 bg-gray-50 dark:bg-slate-800/30 border-gray-200 dark:border-slate-700 opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold shrink-0">Hint {hint.index + 1}:</span>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Reveal Hint {blockingHint} first</p>
                  </div>
                </Card>
              );
            }

            return (
              <Card
                key={hint.index}
                className="p-2.5 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:shadow-md transition-all duration-300"
                onClick={() => onRevealHint(hint.index)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="text-yellow-600 dark:text-yellow-500 text-xs leading-none animate-pulse" aria-hidden="true">●</span>
                    <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                      Reveal Hint {hint.index + 1}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
