/**
 * Personality utilities for ClueLux
 * Adds time-of-day and day-of-week greetings
 */

export interface TimePersonality {
  greeting: string;
  emoji: string;
}

export function getTimeOfDayGreeting(): TimePersonality {
  const hour = new Date().getHours();
  
  if (hour >= 0 && hour < 6) {
    return {
      emoji: '😴',
      greeting: "Can't sleep either?"
    };
  } else if (hour >= 6 && hour < 12) {
    return {
      emoji: '☀️',
      greeting: 'Good morning, wordsmith!'
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      emoji: '☕',
      greeting: 'Quick break from work?'
    };
  } else {
    return {
      emoji: '🌙',
      greeting: 'Burning the midnight oil?'
    };
  }
}

export function getDayOfWeekGreeting(): string {
  const day = new Date().getDay();
  const greetings = [
    "🌅 Sunday vibes! Take it easy",
    "☕ Monday brain? This one's a warm-up",
    "💪 Tuesday power! Let's see what you got",
    "🎯 Hump day hustle! You're halfway there",
    "⚡ Thursday thunder! Almost to the weekend",
    "🔥 Friday energy! Let's finish strong",
    "🎉 Saturday fun! Ready to play?"
  ];
  
  return greetings[day];
}

export function getCombinedGreeting(): string {
  const timeGreeting = getTimeOfDayGreeting();
  const dayGreeting = getDayOfWeekGreeting();
  
  return `${timeGreeting.emoji} ${timeGreeting.greeting} • ${dayGreeting}`;
}

/**
 * Get discovery message for failed games
 * Reframes failure as learning/discovery
 */
export function getDiscoveryMessage(answer: string, guesses: string[]): {
  title: string;
  message: string;
  emoji: string;
} {
  // Count how many unique correct letters they found
  const answerLetters = new Set(answer.toLowerCase().split(''));
  const foundLetters = new Set<string>();
  
  guesses.forEach(guess => {
    guess.toLowerCase().split('').forEach(letter => {
      if (answerLetters.has(letter)) {
        foundLetters.add(letter);
      }
    });
  });
  
  const correctCount = foundLetters.size;
  const totalCount = answerLetters.size;
  const percentage = Math.round((correctCount / totalCount) * 100);
  
  if (percentage >= 80) {
    return {
      title: `${answer} - discovered!`,
      message: `You found ${correctCount}/${totalCount} letters! So close!`,
      emoji: '🎯'
    };
  } else if (percentage >= 60) {
    return {
      title: `${answer} - discovered!`,
      message: `You found ${correctCount}/${totalCount} letters! Almost there!`,
      emoji: '💡'
    };
  } else if (percentage >= 40) {
    return {
      title: `${answer} - discovered!`,
      message: `You found ${correctCount}/${totalCount} letters! Good effort!`,
      emoji: '🌟'
    };
  } else {
    return {
      title: `${answer} - discovered!`,
      message: `You found ${correctCount}/${totalCount} letters! Every discovery counts!`,
      emoji: '✨'
    };
  }
}
