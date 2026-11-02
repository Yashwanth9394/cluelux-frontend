import type { TileState } from '../types/game.types';

const CARD_W = 1080;
const CARD_H = 1920;
const TILE_SIZE = 80;
const TILE_GAP = 12;
const TILE_RADIUS = 14;

const COLORS = {
  bg: '#07071a',
  bgGlow1: 'rgba(67,56,202,0.25)',
  bgGlow2: 'rgba(245,184,61,0.10)',
  correct: '#16a34a',
  present: '#ca8a04',
  absent: 'rgba(255,255,255,0.12)',
  gold: '#f5b83d',
  indigo: '#4338ca',
  text: '#f0eff4',
  textDim: 'rgba(240,239,244,0.5)',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateShareCard(opts: {
  gameNumber: number;
  evaluations: TileState[][];
  hintsUsed: number;
  won: boolean;
  wordLength: number;
}): Promise<Blob> {
  const { gameNumber, evaluations, hintsUsed, won, wordLength } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Ambient glows
  const g1 = ctx.createRadialGradient(CARD_W * 0.25, CARD_H * 0.75, 0, CARD_W * 0.25, CARD_H * 0.75, CARD_W * 0.6);
  g1.addColorStop(0, COLORS.bgGlow1);
  g1.addColorStop(1, 'transparent');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const g2 = ctx.createRadialGradient(CARD_W * 0.75, CARD_H * 0.25, 0, CARD_W * 0.75, CARD_H * 0.25, CARD_W * 0.6);
  g2.addColorStop(0, COLORS.bgGlow2);
  g2.addColorStop(1, 'transparent');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Logo (lightning bolt on indigo square)
  const logoSize = 120;
  const logoX = (CARD_W - logoSize) / 2;
  const logoY = 280;
  roundRect(ctx, logoX, logoY, logoSize, logoSize, 28);
  ctx.fillStyle = COLORS.indigo;
  ctx.fill();

  // Lightning bolt
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  const s = logoSize / 64;
  ctx.moveTo(logoX + 36 * s, logoY + 8 * s);
  ctx.lineTo(logoX + 19 * s, logoY + 35 * s);
  ctx.lineTo(logoX + 30 * s, logoY + 35 * s);
  ctx.lineTo(logoX + 25 * s, logoY + 56 * s);
  ctx.lineTo(logoX + 44 * s, logoY + 27 * s);
  ctx.lineTo(logoX + 32 * s, logoY + 27 * s);
  ctx.closePath();
  ctx.fill();

  // "ClueLux #47" title
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`ClueLux #${gameNumber}`, CARD_W / 2, logoY + logoSize + 80);

  // Result line
  const hintText = hintsUsed === 0 ? 'No hints ⚡' : `${hintsUsed} hint${hintsUsed > 1 ? 's' : ''} used`;
  const guessText = won ? `Solved in ${evaluations.length}` : 'Not this time';
  ctx.font = '500 40px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = COLORS.gold;
  ctx.fillText(`${guessText} · ${hintText}`, CARD_W / 2, logoY + logoSize + 140);

  // Tile grid
  const gridTop = logoY + logoSize + 200;
  const totalW = wordLength * TILE_SIZE + (wordLength - 1) * TILE_GAP;

  evaluations.forEach((row, ri) => {
    const rowX = (CARD_W - totalW) / 2;
    const rowY = gridTop + ri * (TILE_SIZE + TILE_GAP);

    row.forEach((state, ci) => {
      const x = rowX + ci * (TILE_SIZE + TILE_GAP);
      const color = state === 'correct' ? COLORS.correct
        : state === 'present' ? COLORS.present
        : COLORS.absent;

      roundRect(ctx, x, rowY, TILE_SIZE, TILE_GAP + TILE_SIZE - TILE_GAP, TILE_RADIUS);
      ctx.fillStyle = color;
      ctx.fill();
    });
  });

  // Divider glow line
  const divY = gridTop + evaluations.length * (TILE_SIZE + TILE_GAP) + 60;
  const grad = ctx.createLinearGradient(CARD_W * 0.2, divY, CARD_W * 0.8, divY);
  grad.addColorStop(0, 'transparent');
  grad.addColorStop(0.5, COLORS.gold);
  grad.addColorStop(1, 'transparent');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(CARD_W * 0.2, divY);
  ctx.lineTo(CARD_W * 0.8, divY);
  ctx.stroke();

  // CTA
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 52px system-ui, -apple-system, sans-serif';
  ctx.fillText('Can you beat this?', CARD_W / 2, divY + 80);

  ctx.fillStyle = COLORS.gold;
  ctx.font = '500 36px system-ui, -apple-system, sans-serif';
  ctx.fillText('cluelux.com', CARD_W / 2, divY + 140);

  // Bottom branding
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '32px system-ui, -apple-system, sans-serif';
  ctx.fillText('Play daily · Free · No app needed', CARD_W / 2, CARD_H - 120);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

export async function shareWithImage(opts: {
  gameNumber: number;
  evaluations: TileState[][];
  hintsUsed: number;
  won: boolean;
  wordLength: number;
}): Promise<'shared' | 'clipboard' | 'failed'> {
  const { gameNumber, evaluations, hintsUsed, won } = opts;

  const blob = await generateShareCard(opts);
  const file = new File([blob], `cluelux-${gameNumber}.png`, { type: 'image/png' });

  const guessText = won ? `Solved in ${evaluations.length}` : 'Failed';
  const hintText = hintsUsed === 0 ? '⚡ No hints' : `${hintsUsed} hint${hintsUsed > 1 ? 's' : ''}`;
  const text = `ClueLux #${gameNumber} — ${guessText} · ${hintText}\n\nCan you beat me? → cluelux.com`;

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ text, files: [file] });
      return 'shared';
    } catch (err: any) {
      if (err.name === 'AbortError') return 'failed';
    }
  }

  // Fallback: copy text to clipboard
  try {
    await navigator.clipboard.writeText(text);
    return 'clipboard';
  } catch {
    return 'failed';
  }
}
