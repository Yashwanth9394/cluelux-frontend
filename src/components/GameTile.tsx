import { memo } from 'react';
import { motion } from 'motion/react';

type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';

interface GameTileProps {
  letter: string;
  state: TileState;
  position: number;
  delay?: number;
}

export const GameTile = memo(function GameTile({ letter, state, position, delay = 0 }: GameTileProps) {
  const getBorderColor = () => {
    if (state === 'filled') return 'border-indigo-400';
    if (state === 'empty') return 'border-gray-300';
    return 'border-transparent';
  };

  const getBackgroundColor = () => {
    switch (state) {
      case 'correct':
        return 'bg-emerald-500';
      case 'present':
        return 'bg-amber-500';
      case 'absent':
        return 'bg-slate-400 dark:bg-slate-600';
      case 'filled':
        return 'bg-white dark:bg-slate-800 border-gray-400 dark:border-slate-600';
      default:
        return 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700';
    }
  };

  const getShadow = () => {
    switch (state) {
      case 'correct':
        return 'shadow-sm';
      case 'present':
        return 'shadow-sm';
      case 'absent':
        return 'shadow-sm';
      case 'filled':
        return 'shadow-sm border-2';
      default:
        return 'shadow-sm';
    }
  };

  const getTextColor = () => {
    return state === 'empty' || state === 'filled' 
      ? 'text-gray-900 dark:text-gray-100' 
      : 'text-white font-bold';
  };

  const shouldAnimate = state === 'correct' || state === 'present' || state === 'absent';

  return (
    <motion.div
      className={`
        w-14 h-14 sm:w-16 sm:h-16
        border-2 ${getBorderColor()}
        ${getBackgroundColor()}
        ${getTextColor()}
        ${getShadow()}
        flex items-center justify-center
        uppercase rounded-lg
        font-bold text-xl sm:text-2xl
        transition-colors duration-200
      `}
      initial={shouldAnimate ? { rotateX: 0 } : false}
      animate={shouldAnimate ? { 
        rotateX: [0, 90, 90, 0],
        scale: [1, 1.05, 1.05, 1]
      } : { 
        scale: letter ? [1, 1.1, 1] : 1 
      }}
      transition={
        shouldAnimate
          ? { 
              duration: 0.6, 
              delay: delay * 0.15,
              times: [0, 0.25, 0.5, 1],
              ease: "easeOut"
            }
          : { duration: 0.15, ease: "easeOut" }
      }
      style={{ 
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      <span className="relative z-10">
        {letter}
      </span>
    </motion.div>
  );
});
