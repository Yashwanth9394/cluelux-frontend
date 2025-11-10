/**
 * Sound effects utility for game interactions
 * Note: Sound files should be added to public/sounds/ directory
 */

export type SoundType = 'keypress' | 'correct' | 'wrong' | 'win' | 'hint';

const SOUND_ENABLED_KEY = 'cluelux_sound_enabled';

// Check if sounds are enabled (default: false to avoid annoyance)
export const isSoundEnabled = (): boolean => {
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  return stored === 'true';
};

// Toggle sound setting
export const toggleSound = (): boolean => {
  const currentState = isSoundEnabled();
  const newState = !currentState;
  localStorage.setItem(SOUND_ENABLED_KEY, String(newState));
  return newState;
};

// Play a sound effect
export const playSound = (type: SoundType, volume: number = 0.3): void => {
  if (!isSoundEnabled()) return;
  
  try {
    // Create audio element
    const audio = new Audio();
    
    // Map sound types to file paths
    const soundPaths: Record<SoundType, string> = {
      keypress: '/sounds/key-press.mp3',
      correct: '/sounds/correct.mp3',
      wrong: '/sounds/wrong.mp3',
      win: '/sounds/win.mp3',
      hint: '/sounds/hint.mp3',
    };
    
    audio.src = soundPaths[type];
    audio.volume = Math.min(Math.max(volume, 0), 1); // Clamp between 0 and 1
    
    // Play and clean up
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        // Silently fail if autoplay is blocked
        console.debug('Sound playback failed:', error);
      });
    }
  } catch (error) {
    // Silently fail if sound files don't exist
    console.debug('Sound error:', error);
  }
};

// Preload sounds for better performance (optional)
export const preloadSounds = (): void => {
  if (!isSoundEnabled()) return;
  
  const sounds: SoundType[] = ['keypress', 'correct', 'wrong', 'win', 'hint'];
  
  sounds.forEach((type) => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = `/sounds/${type}.mp3`;
  });
};
