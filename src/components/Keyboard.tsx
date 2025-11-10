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
  // Memoize key color calculation
  const getKeyColor = useCallback((key: string) => {
    const state = keyStates[key.toLowerCase()];
    switch (state) {
      case 'correct':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-md hover:shadow-lg shadow-emerald-500/30';
      case 'present':
        return 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-md hover:shadow-lg shadow-amber-500/30';
      case 'absent':
        return 'bg-slate-400 hover:bg-slate-500 text-white border-slate-500 opacity-60';
      default:
        return 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300 hover:shadow-md hover:border-gray-400';
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
    <div className="flex flex-col gap-2 max-w-lg mx-auto w-full px-2 sm:px-1">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 sm:gap-1 justify-center">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACK';
            return (
              <motion.div
                key={key}
                whileHover={!disabled ? { scale: 1.08, y: -3 } : {}}
                whileTap={!disabled ? { 
                  scale: 0.92,
                  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)"
                } : {}}
              >
                <Button
                  onClick={() => handleClick(key)}
                  disabled={disabled}
                  className={`
                    min-h-[44px] sm:h-12 border-2
                    ${isSpecial ? 'px-3 min-w-[64px] text-xs sm:text-sm font-bold' : 'w-9 sm:w-10 p-0 text-sm sm:text-base'}
                    ${getKeyColor(key)} 
                    rounded-xl
                    transition-all duration-200
                    font-bold
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                  `}
                  variant="secondary"
                >
                  {key === 'BACK' ? (
                    <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <span className="uppercase">{key}</span>
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
