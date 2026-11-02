import { useState } from 'react';
import { ArchiveHub } from './ArchiveHub';
import { PuzzleRunner } from './PuzzleRunner';
import { ArchiveLoginGate } from './ArchiveLoginGate';
import { getUser } from '../../lib/auth';
import { getArchiveFreeUsed, recordArchiveFreeUse } from '../../lib/archiveStore';
import { track } from '../../lib/analytics';
import type { PuzzleData } from '../../services/archiveApi';

interface ArchiveExperienceProps {
  onExit: () => void;
}

type Screen =
  | { name: 'hub' }
  | { name: 'login' }
  | { name: 'play'; puzzle: PuzzleData; title: string };

const FREE_ARCHIVE_LIMIT = 1;

export function ArchiveExperience({ onExit }: ArchiveExperienceProps) {
  const [screen, setScreen] = useState<Screen>(() => {
    if (getUser()) return { name: 'hub' };
    return getArchiveFreeUsed() >= FREE_ARCHIVE_LIMIT ? { name: 'login' } : { name: 'hub' };
  });

  if (screen.name === 'play') {
    return <PuzzleRunner puzzle={screen.puzzle} title={screen.title} onExit={() => setScreen({ name: 'hub' })} />;
  }

  if (screen.name === 'login') {
    return <ArchiveLoginGate onLoggedIn={() => setScreen({ name: 'hub' })} onBack={onExit} />;
  }

  const handlePlay = (puzzle: PuzzleData, title: string) => {
    if (!getUser()) {
      recordArchiveFreeUse();
    }
    setScreen({ name: 'play', puzzle, title });
  };

  const handleBack = () => {
    if (!getUser() && getArchiveFreeUsed() >= FREE_ARCHIVE_LIMIT) {
      setScreen({ name: 'login' });
    } else {
      onExit();
    }
  };

  return (
    <ArchiveHub
      tier="test"
      onPlay={handlePlay}
      onSignOut={() => setScreen({ name: 'login' })}
      onBack={handleBack}
    />
  );
}
