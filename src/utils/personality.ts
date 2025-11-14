/**
 * Personality utilities for ClueLux
 * Adds time-of-day and day-of-week greetings
 */

export interface TimePersonality {
  greeting: string;
  emoji: string;
}

export interface VictoryMessage {
  title: string;
  subtitle: string;
  emoji: string;
  shareQuote: string;
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
 * Get victory message based on performance
 * Steve Jobs philosophy: Make them feel like they accomplished something rare
 */
export function getVictoryMessage(
  attempts: number,
  hintsUsed: number,
  answer: string
): VictoryMessage {
  // Perfect game - 1 attempt
  if (attempts === 1) {
    return {
      title: 'IMPOSSIBLE',
      subtitle: 'One guess. Pure genius.',
      emoji: '🎯',
      shareQuote: `Got ${answer.toUpperCase()} in ONE guess. Yes, really.`
    };
  }
  
  // Hint-free victory in 2-3 attempts
  if (attempts <= 3 && hintsUsed === 0) {
    return {
      title: 'BRILLIANT',
      subtitle: 'No hints. All skill.',
      emoji: '⚡',
      shareQuote: `Solved ${answer.toUpperCase()} without hints.`
    };
  }
  
  // Hint-free victory in 4-5 attempts
  if (attempts <= 5 && hintsUsed === 0) {
    return {
      title: 'IMPRESSIVE',
      subtitle: 'You figured it out yourself.',
      emoji: '🌟',
      shareQuote: `Cracked ${answer.toUpperCase()} solo. No hints needed.`
    };
  }
  
  // Clutch win on last attempt
  if (attempts === 6) {
    return {
      title: 'CLUTCH',
      subtitle: 'Under pressure, you deliver.',
      emoji: '🔥',
      shareQuote: `${answer.toUpperCase()} on the final attempt.`
    };
  }
  
  // Good performance with hints
  if (attempts <= 4) {
    return {
      title: 'EXCELLENT',
      subtitle: 'Smart use of clues.',
      emoji: '✨',
      shareQuote: `Found ${answer.toUpperCase()} in ${attempts} tries.`
    };
  }
  
  // Default victory
  return {
    title: 'SOLVED',
    subtitle: 'Another one conquered.',
    emoji: '🎉',
    shareQuote: `Today's word: ${answer.toUpperCase()}. Done.`
  };
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
