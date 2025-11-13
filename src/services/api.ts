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
  // Add date as cache-busting parameter
  // This ensures each day gets a unique URL, so CloudFront caches separately
  // No manual invalidation needed! 🎯
  const today = getTodayET();
  const fullUrl = `${API_BASE_URL}/daily-word?v=${today}`;

  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
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
