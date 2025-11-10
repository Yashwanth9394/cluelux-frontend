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
    const state = keyStates[key.toLowerCase()];
    switch (state) {
      case 'correct':
        return 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white border-emerald-600/50 shadow-[0_4px_20px_rgba(16,185,129,0.4)] hover:shadow-[0_6px_30px_rgba(16,185,129,0.6)]';
      case 'present':
        return 'bg-gradient-to-br from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:via-amber-700 hover:to-orange-600 text-white border-amber-600/50 shadow-[0_4px_20px_rgba(245,158,11,0.4)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.6)]';
      case 'absent':
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
    <div className="flex flex-col gap-2.5 max-w-lg mx-auto w-full px-2 sm:px-1">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 sm:gap-2 justify-center">
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === 'BACK';
            const state = keyStates[key.toLowerCase()];
            
            return (
              <motion.div
                key={key}
                whileHover={!disabled ? { 
                  scale: 1.05, 
                  y: -2,
                  rotate: [0, -1, 1, 0]
                } : {}}
                whileTap={!disabled ? { 
                  scale: 0.95,
                  y: 1,
                } : {}}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 17 
                }}
              >
                <Button
                  onClick={() => handleClick(key)}
                  disabled={disabled}
                  className={`
                    min-h-[48px] sm:h-14 border-2
                    ${isSpecial ? 'px-4 min-w-[70px] text-xs sm:text-sm font-extrabold' : 'w-10 sm:w-11 p-0 text-sm sm:text-base font-bold'}
                    ${getKeyColor(key)} 
                    rounded-xl sm:rounded-2xl
                    transition-all duration-300
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${state !== 'unused' ? '[box-shadow:inset_0_-2px_0_rgba(0,0,0,0.15)]' : ''}
                    backdrop-blur-sm
                    relative overflow-hidden
                    group
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
