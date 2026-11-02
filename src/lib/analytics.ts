import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';

let initialized = false;

export function initAnalytics() {
  if (initialized || !POSTHOG_KEY) return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
    session_recording: {
      recordCrossOriginIframes: false,
    },
  });
  initialized = true;
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

// Game-specific tracking helpers

export function trackGameStart(mode: 'daily' | 'vocab' | 'revise' | 'archive' | 'practice', wordLength?: number) {
  track('game_start', { mode, word_length: wordLength });
}

export function trackGuess(mode: string, guessNumber: number, wordLength: number) {
  track('guess_made', { mode, guess_number: guessNumber, word_length: wordLength });
}

export function trackHintRevealed(mode: string, hintIndex: number, guessNumber: number) {
  track('hint_revealed', { mode, hint_index: hintIndex, guess_number: guessNumber });
}

export function trackGameEnd(mode: string, won: boolean, guesses: number, hintsUsed: number, timeTakenMs: number) {
  track('game_end', {
    mode,
    won,
    guesses,
    hints_used: hintsUsed,
    time_taken_seconds: Math.round(timeTakenMs / 1000),
  });
}

export function trackModeSwitch(from: string, to: string) {
  track('mode_switch', { from, to });
}

export function trackShare(mode: string, method: 'native' | 'clipboard') {
  track('share', { mode, method });
}

export function trackDropOff(mode: string, stage: string, guessNumber?: number) {
  track('drop_off', { mode, stage, guess_number: guessNumber });
}
