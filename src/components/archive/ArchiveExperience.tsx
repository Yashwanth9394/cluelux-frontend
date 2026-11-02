import { useState } from 'react';
import { AccessGate } from './AccessGate';
import { ArchiveHub } from './ArchiveHub';
import { PuzzleRunner } from './PuzzleRunner';
import { getAccessTier } from '../../lib/archiveStore';
import type { PuzzleData } from '../../services/archiveApi';

interface ArchiveExperienceProps {
  onExit: () => void;
}

type Screen =
  | { name: 'gate' }
  | { name: 'hub' }
  | { name: 'play'; puzzle: PuzzleData; title: string };

/** Everything behind "Cluelux archive": access, the hub, and playing one puzzle. */
export function ArchiveExperience({ onExit }: ArchiveExperienceProps) {
  const [screen, setScreen] = useState<Screen>({ name: 'hub' });

  if (screen.name === 'play') {
    return <PuzzleRunner puzzle={screen.puzzle} title={screen.title} onExit={() => setScreen({ name: 'hub' })} />;
  }

  return (
    <ArchiveHub
      tier="test"
      onPlay={(puzzle, title) => setScreen({ name: 'play', puzzle, title })}
      onSignOut={() => setScreen({ name: 'gate' })}
      onBack={onExit}
    />
  );
}
