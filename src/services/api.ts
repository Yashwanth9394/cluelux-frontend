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

// Direct API Gateway URL (never CloudFront) for local preview-date testing only.
// Not a secret - same URL already used for normal API calls, just without the CDN in front.
const PREVIEW_API_URL = 'https://qp5p347l9l.execute-api.us-east-1.amazonaws.com/prod';

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
  let fullUrl: string;
  if (preview) {
    console.warn(`[DEV PREVIEW] Loading ${preview.date} instead of today. Remove VITE_PREVIEW_DATE from .env.local to go back to normal.`);
    fullUrl = `${PREVIEW_API_URL}/daily-word?previewDate=${preview.date}&previewKey=${preview.key}`;
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
 * Format the daily word data for the game
 */
export function formatDailyWordForGame(data: DailyWordResponse) {
  const gameNumber = Math.floor(
    (new Date(data.date).getTime() - new Date('2025-01-01').getTime()) /
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

/**
 * Fetch a random practice word from the backend
 * Backend should return a random past daily word (from start date to today)
 * This allows users to practice with previously used daily words
 */
export async function fetchPracticeWord(): Promise<DailyWordResponse> {
  const fullUrl = `${API_BASE_URL}/practice-word`;

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
    console.error('Error fetching practice word:', error);
    throw error;
  }
}

/**
 * Format the practice word data for the game
 */
export function formatPracticeWordForGame(data: DailyWordResponse) {
  return {
    date: 'practice',  // Special identifier for practice mode
    gameNumber: 0,     // Practice games don't have numbers
    wordLength: data.word.length,
    answer: data.word.toUpperCase(),
    answerLower: data.word.toLowerCase(),
    hints: data.hints,
    validWords: [],
    metadata: {
      difficulty: 'medium',
      category: 'general',
      generatedAt: new Date().toISOString(),
      fact: data.fact,
    },
  };
}
