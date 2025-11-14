import { useState } from 'react';
import { Lock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { canRevealHint } from '../lib/hintManager';
import type { HintState } from '../types/game.types';

interface HintDisplayProps {
  hints: HintState[];
  onRevealHint: (index: number) => void;
}

export function HintDisplay({ hints, onRevealHint }: HintDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const revealedCount = hints.filter(h => h.revealed).length;
  const unlockedCount = hints.filter(h => h.unlocked).length;

  return (
    <div className="w-full max-w-2xl mx-auto mb-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {revealedCount > 0 ? `${revealedCount} hint${revealedCount > 1 ? 's' : ''} viewed` : 'View hints'}
            {unlockedCount > 0 && ` (${unlockedCount} available)`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-1.5 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {hints.map((hint) => {
            const canReveal = canRevealHint(hints, hint.index);
            const hintCost = hint.index + 1;

            return (
              <Card
                key={hint.index}
                className={`p-2.5 transition-all duration-300 ${
                  hint.revealed
                    ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 shadow-sm'
                    : canReveal
                    ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:shadow-md'
                    : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 opacity-40'
                }`}
                onClick={() => canReveal && !hint.revealed && onRevealHint(hint.index)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {hint.revealed ? (
                      <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed">{hint.text}</p>
                    ) : canReveal ? (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 animate-pulse" />
                          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
                            Reveal Hint {hint.index + 1}
                          </p>
                        </div>
                        {hint.index > 0 && (
                          <p className="text-[10px] text-yellow-600 dark:text-yellow-500 opacity-75 font-medium">
                            Costs {hintCost}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <p className="text-xs text-gray-400">
                          Hint {hint.index + 1} locked
                        </p>
                      </div>
                    )}
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
