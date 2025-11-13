/**
 * Time utility functions for ClueLux game
 */

/**
 * Calculate time remaining until next puzzle (midnight)
 * New puzzles arrive daily at 12:00 AM (midnight)
 * @returns Object with hours and minutes remaining
 */
export function getTimeUntilNextPuzzle(): { hours: number; minutes: number } {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0); // Set to midnight (start of next day)
  
  const diff = tomorrow.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
}

/**
 * Format time remaining as a string
 * @returns Formatted string like "6h 23m"
 */
export function formatTimeUntilNextPuzzle(): string {
  const { hours, minutes } = getTimeUntilNextPuzzle();
  return `${hours}h ${minutes}m`;
}
