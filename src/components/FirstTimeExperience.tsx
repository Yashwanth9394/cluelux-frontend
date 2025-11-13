import { useState, useEffect } from 'react';
import { GameTile } from './GameTile';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';

type TileState = 'empty' | 'filled' | 'correct' | 'present' | 'absent';

interface FirstTimeExperienceProps {
  onComplete: () => void;
}

const TUTORIAL_KEY = 'hasSeenTutorial';

export function FirstTimeExperience({ onComplete }: FirstTimeExperienceProps) {
  const [step, setStep] = useState(1);
  const [showTiles, setShowTiles] = useState(false);
  const [tileStates, setTileStates] = useState<TileState[]>(['filled', 'filled', 'filled', 'filled', 'filled']);
  const [showHintBar, setShowHintBar] = useState(false);

  // Step 1: Automatically show tiles and flip them
  useEffect(() => {
    if (step === 1) {
      // Show tiles immediately
      setShowTiles(true);

      // After a brief moment, flip them to reveal colors
      const timer = setTimeout(() => {
        setTileStates(['correct', 'present', 'absent', 'absent', 'correct']);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [step]);

  // Step 2: Show hint bar animation
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        setShowHintBar(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else {
      // Mark tutorial as complete and close
      localStorage.setItem(TUTORIAL_KEY, 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200 dark:border-slate-800"
          >
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  This is ClueLux
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Watch how it works
                </p>
              </div>

              {/* Example word with tiles */}
              {showTiles && (
                <div className="flex gap-2 justify-center py-4">
                  {['R', 'E', 'A', 'C', 'T'].map((letter, index) => (
                    <GameTile
                      key={index}
                      letter={letter}
                      state={tileStates[index]}
                      position={index}
                      delay={index}
                    />
                  ))}
                </div>
              )}

              {/* Color legend */}
              <div className="space-y-2 text-left bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Right spot</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Wrong spot</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-400 dark:bg-slate-600 rounded"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Not in word</span>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Got it →
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200 dark:border-slate-800"
          >
            <div className="text-center space-y-6">
              <div>
                <div className="text-5xl mb-3">💡</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Stuck? Use Hints
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Wrong guesses unlock helpful hints
                </p>
              </div>

              {/* Hint bar examples */}
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="relative h-1 w-2 bg-slate-300 dark:bg-slate-700 opacity-20 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Locked hint</span>
                </div>

                {showHintBar && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border-2 border-amber-500"
                  >
                    <div className="relative h-1 w-8 bg-amber-500 rounded-full animate-hint-breathe shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                    <span className="text-sm font-medium text-amber-900 dark:text-amber-200">Click the glow!</span>
                  </motion.div>
                )}

                <div className="flex items-center gap-4 bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="relative h-1 w-3 bg-blue-500 opacity-60 rounded-full"></div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Already viewed</span>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Start Playing →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export utility to check if tutorial should show
export function shouldShowTutorial(): boolean {
  return !localStorage.getItem(TUTORIAL_KEY);
}
