import type { TileState } from '../types/game.types';

function buildEmojiGrid(evaluations: TileState[][]): string {
  return evaluations
    .map((row) =>
      row
        .map((state) =>
          state === 'correct' ? '🟩' : state === 'present' ? '🟨' : '⬛'
        )
        .join('')
    )
    .join('\n');
}

export function buildShareText(opts: {
  gameNumber: number;
  evaluations: TileState[][];
  hintsUsed: number;
  won: boolean;
}): string {
  const { gameNumber, evaluations, hintsUsed, won } = opts;
  const guessText = won ? `Solved in ${evaluations.length}` : 'X';
  const hintText = hintsUsed === 0 ? '⚡ No hints' : `⚡ ${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}`;
  return `ClueLux #${gameNumber} — ${guessText} · ${hintText}\n\n${buildEmojiGrid(evaluations)}\n\ncluelux.com`;
}

// Text-only share (no image attached) so the emoji grid is what actually lands
// in the chat - many apps drop the text when a file is attached.
export async function shareResult(opts: {
  gameNumber: number;
  evaluations: TileState[][];
  hintsUsed: number;
  won: boolean;
}): Promise<'shared' | 'clipboard' | 'failed'> {
  const text = buildShareText(opts);

  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') return 'failed';
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return 'clipboard';
  } catch {
    return 'failed';
  }
}
