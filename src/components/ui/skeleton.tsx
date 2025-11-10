import { motion } from 'motion/react';
import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

// Loading state for game board
function GameBoardSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="flex flex-col gap-3 items-center justify-center">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-xl"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Loading state for keyboard
function KeyboardSkeleton() {
  const rows = [10, 9, 9]; // Keys per row
  
  return (
    <div className="flex flex-col gap-2 max-w-lg mx-auto w-full px-2 sm:px-1">
      {rows.map((keyCount, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5 sm:gap-1 justify-center">
          {Array.from({ length: keyCount }).map((_, keyIndex) => (
            <Skeleton 
              key={keyIndex} 
              className="w-9 sm:w-10 h-12 rounded-lg"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Generic loading spinner
function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  
  return (
    <motion.div
      className={`${sizeClasses[size]} border-4 border-gray-200 border-t-indigo-600 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );
}

export { Skeleton, GameBoardSkeleton, KeyboardSkeleton, LoadingSpinner };
