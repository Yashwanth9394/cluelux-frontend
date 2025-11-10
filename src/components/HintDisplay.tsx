import { useState, useEffect } from 'react';
import { Lock, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import type { HintState } from '../types/game.types';

interface HintDisplayProps {
  hints: HintState[];
  onRevealHint: (index: number) => void;
}

export function HintDisplay({ hints, onRevealHint }: HintDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const revealedCount = hints.filter(h => h.revealed).length;
  const unlockedCount = hints.filter(h => h.unlocked).length;

  // Auto-reveal all unlocked hints when dropdown expands
  useEffect(() => {
    if (isExpanded) {
      hints.forEach((hint) => {
        if (hint.unlocked && !hint.revealed) {
          onRevealHint(hint.index);
        }
      });
    }
  }, [isExpanded, hints, onRevealHint]);

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            💡 Hints
          </h3>
          <span className="text-sm text-gray-600">
            {unlockedCount} unlocked
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          {hints.map((hint) => (
            <Card
              key={hint.index}
              className={`p-4 transition-all duration-300 ${
                hint.revealed
                  ? 'bg-blue-50 border-blue-300 shadow-sm'
                  : hint.unlocked
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gray-100 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {hint.revealed ? (
                    <p className="text-sm text-gray-800 leading-relaxed">{hint.text}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm text-gray-400">
                        Hint {hint.index + 1} locked
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
