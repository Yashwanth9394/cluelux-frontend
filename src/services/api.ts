/**
 * API Service for fetching daily word from backend
 */

export interface DailyWordResponse {
  date: string;
  word: string;
  hints: string[];
  fact?: string;
}

// Backend API endpoint - update this after deploying CDK stack
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Prod's direct API Gateway URL (never the custom CloudFront in front of it).
// Not a secret - same URL already used for normal API calls, just without
// that CDN, which only allows GET/HEAD/OPTIONS - so this is also what any
// POST (like recording a play, below) against prod has to use instead.
const PREVIEW_API_URL = 'https://qp5p347l9l.execute-api.us-east-1.amazonaws.com/prod';

/**
 * The URL to call for anything that must bypass the custom prod CloudFront
 * (which rejects POST outright). UAT's own VITE_API_URL is already a direct
 * API Gateway URL (UAT has no custom CloudFront in front of it at all), so
 * it needs no swap; only prod's CloudFront URL does.
 */
function getDirectApiUrl(): string {
  return API_BASE_URL.includes('cloudfront.net') ? PREVIEW_API_URL : API_BASE_URL;
}

/**
 * Dev-only override to load a specific date instead of real "today" - e.g. to
 * play through Nov 1's word before Nov 1 actually arrives. Set VITE_PREVIEW_DATE
 * and VITE_PREVIEW_KEY in a local .env.local (gitignored, never committed, never
 * part of a production build - import.meta.env.DEV is statically false in
 * `vite build`, so this whole branch is dead-code-eliminated from the real bundle).
 */
function getPreviewOverride(): { date: string; key: string } | null {
  if (!import.meta.env.DEV) return null;
  const date = import.meta.env.VITE_PREVIEW_DATE;
  const key = import.meta.env.VITE_PREVIEW_KEY;
  if (!date || !key) return null;
  return { date, key };
}

/**
 * Shared-link date override, e.g. https://uat.../?date=2026-11-05 - lets a
 * tester hand someone a link to a specific day's puzzle. No secret involved;
 * the backend only honors this when OPEN_DATE_OVERRIDE is set (UAT only -
 * see GetDailyWordHandler.java), so this is a harmless no-op against prod
 * regardless of what's in this function.
 */
function getSharedDateOverride(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('date');
}

/**
 * Get today's date in ET timezone (YYYY-MM-DD format)
 */
function getTodayET(): string {
  const etDate = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Parse MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = etDate.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Fetch today's word and hints from the backend
 */
export async function fetchDailyWord(): Promise<DailyWordResponse> {
  const preview = getPreviewOverride();
  const sharedDate = getSharedDateOverride();
  let fullUrl: string;
  if (preview) {
    console.warn(`[DEV PREVIEW] Loading ${preview.date} instead of today. Remove VITE_PREVIEW_DATE from .env.local to go back to normal.`);
    fullUrl = `${PREVIEW_API_URL}/daily-word?previewDate=${preview.date}&previewKey=${preview.key}`;
  } else if (sharedDate) {
    fullUrl = `${API_BASE_URL}/daily-word?date=${sharedDate}`;
  } else {
    // Add date as cache-busting parameter
    // This ensures each day gets a unique URL, so CloudFront caches separately
    // No manual invalidation needed! 🎯
    const today = getTodayET();
    fullUrl = `${API_BASE_URL}/daily-word?v=${today}`;
  }

  try {
    // no-store: the Lambda's Cache-Control header is meant for CloudFront's
    // edge cache (prod) and is harmless there either way, but without this
    // the player's own browser also honors it - which silently serves stale
    // data for hours against the UAT backend (no CDN in front to begin with).
    const response = await fetch(fullUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DailyWordResponse = await response.json();
    
    // Validate response
    if (!data.word || !data.hints || !Array.isArray(data.hints)) {
      throw new Error('Invalid response format from API');
    }

    return data;
  } catch (error) {
    console.error('Error fetching daily word:', error);

    // Throw error so App.tsx can handle fallback properly
    throw error;
  }
}

/**
 * Records one completed game (win or loss) against a date and returns the
 * running total of plays for that date. Call exactly once, at the moment
 * a game actually ends - never on page load/restore of an already-finished
 * game, or it double-counts. Non-fatal by design: the game has already
 * ended either way, so a failed network call here shouldn't disrupt that -
 * it just means no count to show.
 */
export async function recordPlay(date: string): Promise<number | null> {
  try {
    const url = `${getDirectApiUrl()}/daily-word/plays?date=${date}`;
    const response = await fetch(url, { method: 'POST', cache: 'no-store' });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data.count === 'number' ? data.count : null;
  } catch (error) {
    console.error('Error recording play:', error);
    return null;
  }
}

/**
 * Format the daily word data for the game
 */
export function formatDailyWordForGame(data: DailyWordResponse) {
  // Launch day (Nov 1, 2026) is #1. Anything before that counts backward
  // (Oct 31 = 0, Oct 30 = -1, ...) rather than using an arbitrary epoch.
  const gameNumber = Math.floor(
    (new Date(data.date).getTime() - new Date('2026-11-01').getTime()) /
    (1000 * 60 * 60 * 24)
  ) + 1;

  return {
    date: data.date,
    gameNumber,
    wordLength: data.word.length,
    answer: data.word.toUpperCase(),
    answerLower: data.word.toLowerCase(),
    hints: data.hints,
    validWords: [], // Add word validation if needed
    metadata: {
      difficulty: 'medium',
      category: 'general',
      generatedAt: data.date,
      fact: data.fact,
    },
  };
}
