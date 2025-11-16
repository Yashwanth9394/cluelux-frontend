import { memo, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Delete } from 'lucide-react';

type KeyState = 'unused' | 'correct' | 'present' | 'absent';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
  keyStates: Record<string, KeyState>;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

export const Keyboard = memo(function Keyboard({ onKeyPress, onBackspace, onEnter, keyStates, disabled = false }: KeyboardProps) {
  // Memoize key color calculation with glassmorphic gradients
  const getKeyColor = useCallback((key: string) => {
    const state = keyStates[key.toUpperCase()];
    switch (state) {
      case 'correct':
        // Green for correct letters
        return 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white border-green-600/50 opacity-90 hover:opacity-100';
      case 'present':
        // Orange for letters in wrong position
        return 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 hover:from-orange-500 hover:via-orange-600 hover:to-orange-700 text-white border-orange-600/50 opacity-90 hover:opacity-100';
      case 'absent':
        // Grey for absent letters
        return 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 hover:from-slate-500 hover:via-slate-600 hover:to-slate-700 text-white border-slate-600/50 opacity-70 hover:opacity-80';
      default:
        return 'glass-subtle hover:glass-card text-gray-800 dark:text-gray-200 border-gray-300/50 dark:border-gray-600/50 hover:border-indigo-400/50 hover:shadow-[0_4px_16px_rgba(99,102,241,0.2)]';
    }
  }, [keyStates]);

  const handleClick = useCallback((key: string) => {
    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'BACK') {
      onBackspace();
    } else {
      onKeyPress(key);
    }
  }, [onEnter, onBackspace, onKeyPress]);

  return (
    <div className="flex flex-col gap-2 max-w-lg mx-auto w-full px-3 sm:px-4 pb-safe">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-1.5 justify-center">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACK';
            const state = keyStates[key.toUpperCase()];

            return (
              <motion.div
                key={key}
                whileTap={!disabled ? {
                  scale: 0.92,
                } : {}}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 20
                }}
              >
                <Button
                  onClick={() => handleClick(key)}
                  disabled={disabled}
                  className={`
                    h-14 sm:h-16 border-2
                    ${isSpecial ? 'px-3 min-w-[65px] sm:min-w-[75px] text-xs sm:text-sm font-extrabold' : 'w-9 sm:w-11 p-0 text-base sm:text-lg font-bold'}
                    ${getKeyColor(key)}
                    rounded-lg sm:rounded-xl
                    transition-all duration-200
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                    ${state !== 'unused' ? '[box-shadow:inset_0_-2px_0_rgba(0,0,0,0.15)]' : ''}
                    backdrop-blur-sm
                    relative overflow-hidden
                    group
                    touch-none
                  `}
                  variant="secondary"
                >
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full transform" 
                       style={{ transition: 'transform 0.6s ease-out' }} />
                  
                  {key === 'BACK' ? (
                    <Delete className="w-5 h-5 sm:w-6 sm:h-6 relative z-10" />
                  ) : (
                    <span className="uppercase relative z-10 drop-shadow-sm">{key}</span>
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
});
