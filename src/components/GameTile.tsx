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
        return 'bg-gradient-to-br from-emerald-500 to-teal-600';
      case 'present':
        return 'bg-gradient-to-br from-amber-500 to-orange-500';
      case 'absent':
        return 'bg-gradient-to-br from-slate-400 to-slate-500';
      default:
        return 'bg-white';
    }
  };

  const getShadow = () => {
    switch (state) {
      case 'correct':
        return 'shadow-lg shadow-emerald-500/50';
      case 'present':
        return 'shadow-lg shadow-amber-500/50';
      case 'absent':
        return 'shadow-sm';
      case 'filled':
        return 'shadow-lg shadow-indigo-500/30';
      default:
        return 'shadow-md';
    }
  };

  const getInsetShadow = () => {
    switch (state) {
      case 'correct':
      case 'present':
      case 'absent':
        return '[box-shadow:inset_0_-2px_0_rgba(0,0,0,0.15)]';
      default:
        return '';
    }
  };

  const getTextColor = () => {
    return state === 'empty' || state === 'filled' ? 'text-gray-800' : 'text-white';
  };

  const shouldAnimate = state === 'correct' || state === 'present' || state === 'absent';

  return (
    <motion.div
      className={`
        w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem]
        border-2 ${getBorderColor()} 
        ${getBackgroundColor()} 
        ${getTextColor()} 
        ${getShadow()}
        ${getInsetShadow()}
        flex items-center justify-center 
        uppercase rounded-xl 
        font-extrabold text-2xl sm:text-3xl
        transition-colors
        transform-gpu
      `}
      initial={shouldAnimate ? { scale: 0.8, opacity: 0, rotateY: -90 } : false}
      animate={shouldAnimate ? { 
        scale: [0.8, 1.08, 1], 
        opacity: 1,
        rotateY: [0, 180, 360]
      } : { 
        scale: letter ? [1, 1.15, 1] : 1 
      }}
      transition={
        shouldAnimate
          ? { 
              duration: 0.7, 
              delay: delay * 0.12, 
              type: "spring", 
              stiffness: 260,
              damping: 18
            }
          : { duration: 0.2, type: "spring", stiffness: 400, damping: 20 }
      }
      whileHover={!shouldAnimate && letter ? { scale: 1.08, y: -2 } : {}}
      style={{ 
        willChange: 'transform',
        backfaceVisibility: 'hidden'
      }}
    >
      <motion.span
        animate={letter && !shouldAnimate ? { 
          scale: [1, 1.2, 1]
        } : {}}
        transition={{ duration: 0.2 }}
      >
        {letter}
      </motion.span>
    </motion.div>
  );
});
