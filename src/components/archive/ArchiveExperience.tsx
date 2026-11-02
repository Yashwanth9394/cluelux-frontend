import { useState } from 'react';
import { ArchiveHub } from './ArchiveHub';
import { PuzzleRunner } from './PuzzleRunner';
import { ArchiveLoginGate } from './ArchiveLoginGate';
import { getUser } from '../../lib/auth';
import { getTodayET } from '../../lib/dates';
import type { PuzzleData } from '../../services/archiveApi';

interface ArchiveExperienceProps {
  onExit: () => void;
}

type Screen =
  | { name: 'hub' }
  | { name: 'login' }
  | { name: 'play'; puzzle: PuzzleData; title: string };

/** Yesterday in ET (YYYY-MM-DD) — the one archive day that's free without login. */
function yesterdayET(): string {
  const d = new Date(getTodayET() + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Free without login only for yesterday's archive puzzle. Everything older,
 *  and the special/random puzzles, needs a signed-in account. */
function isFree(puzzle: PuzzleData): boolean {
  return puzzle.kind === 'archive' && puzzle.label === yesterdayET();
}

export function ArchiveExperience({ onExit }: ArchiveExperienceProps) {
  const [screen, setScreen] = useState<Screen>({ name: 'hub' });

  if (screen.name === 'play') {
    return <PuzzleRunner puzzle={screen.puzzle} title={screen.title} onExit={() => setScreen({ name: 'hub' })} />;
  }

  if (screen.name === 'login') {
    return <ArchiveLoginGate onLoggedIn={() => setScreen({ name: 'hub' })} onBack={() => setScreen({ name: 'hub' })} />;
  }

  const handlePlay = (puzzle: PuzzleData, title: string) => {
    if (!getUser() && !isFree(puzzle)) {
      setScreen({ name: 'login' });
      return;
    }
    setScreen({ name: 'play', puzzle, title });
  };

  return (
    <ArchiveHub
      tier="test"
      onPlay={handlePlay}
      onSignOut={() => setScreen({ name: 'hub' })}
      onBack={onExit}
    />
  );
}
