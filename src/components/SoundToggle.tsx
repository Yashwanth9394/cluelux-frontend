import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import { isSoundEnabled, toggleSound } from '../utils/sounds';

export function SoundToggle() {
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleToggle = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="hover:bg-purple-50 transition-colors"
      title={soundOn ? 'Disable sounds' : 'Enable sounds'}
    >
      {soundOn ? (
        <Volume2 className="h-5 w-5 text-gray-600" />
      ) : (
        <VolumeX className="h-5 w-5 text-gray-400" />
      )}
    </Button>
  );
}
