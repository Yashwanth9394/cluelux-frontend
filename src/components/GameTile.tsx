import { motion } from 'motion/react';

type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';

interface GameTileProps {
  letter: string;
  state: TileState;
  position: number;
  delay?: number;
}

export function GameTile({ letter, state, position, delay = 0 }: GameTileProps) {
  const getBorderColor = () => {
    if (state === 'filled') return 'border-indigo-300';
    if (state === 'empty') return 'border-gray-300';
    return 'border-transparent';
  };

  const getBackgroundColor = () => {
    switch (state) {
      case 'correct':
        return 'bg-gradient-to-br from-emerald-500 to-teal-600';
      case 'present':
        return 'bg-gradient-to-br from-amber-500 to-orange-600';
      case 'absent':
        return 'bg-gradient-to-br from-slate-400 to-slate-500';
      default:
        return 'bg-white';
    }
  };

  const getTextColor = () => {
    return state === 'empty' || state === 'filled' ? 'text-gray-800' : 'text-white';
  };

  const shouldAnimate = state === 'correct' || state === 'present' || state === 'absent';

  return (
    <motion.div
      className={`w-16 h-16 border-2 ${getBorderColor()} ${getBackgroundColor()} ${getTextColor()} flex items-center justify-center uppercase rounded-xl shadow-md font-bold text-2xl`}
      initial={shouldAnimate ? { scale: 0.8, opacity: 0, rotateY: 0 } : false}
      animate={shouldAnimate ? { 
        scale: [0.8, 1.05, 1], 
        opacity: 1,
        rotateY: [0, 180, 360]
      } : { 
        scale: letter ? [1, 1.1, 1] : 1 
      }}
      transition={
        shouldAnimate
          ? { 
              duration: 0.6, 
              delay: delay * 0.15, 
              type: "spring", 
              stiffness: 200,
              damping: 15
            }
          : { duration: 0.15, type: "spring" }
      }
      whileHover={!shouldAnimate && letter ? { scale: 1.05 } : {}}
    >
      {letter}
    </motion.div>
  );
}
