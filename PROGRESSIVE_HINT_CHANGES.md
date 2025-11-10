# Progressive Hint System - Implementation Changes

## Overview
Modified the hint system to unlock hints progressively after each guess is made, with the first hint already unlocked at game start.

## Detailed Changes

### 1. **src/lib/hintManager.ts**

#### Changed: `getHintUnlockSchedule()`
**Before:**
```typescript
export function getHintUnlockSchedule(wordLength: number): number[] {
  const schedules: Record<number, number[]> = {
    5: [0, 1, 2, 3, 4, 5],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 6],
    8: [0, 1, 2, 4, 6, 8],
  };
  return schedules[wordLength] || [0, 1, 2, 3, 4, 5];
}
```

**After:**
```typescript
export function getHintUnlockSchedule(wordLength: number): number[] {
  // Each hint unlocks after the corresponding guess number
  // Hint 0: unlocked at start (0 guesses)
  // Hint 1: unlocked after 1 guess
  // Hint 2: unlocked after 2 guesses, etc.
  const maxHints = 6;
  return Array.from({ length: maxHints }, (_, i) => i);
}
```

**Reason:** Simplified to create a consistent unlock pattern where each hint unlocks after the corresponding guess number.

---

#### Changed: `getAvailableHintsCount()`
**Before:**
```typescript
export function getAvailableHintsCount(
  wrongAttempts: number,
  wordLength: number
): number {
  const schedule = getHintUnlockSchedule(wordLength);
  return schedule.filter(attempt => attempt <= wrongAttempts).length;
}
```

**After:**
```typescript
export function getAvailableHintsCount(
  guessCount: number,
  wordLength: number
): number {
  // First hint is unlocked at start
  // Each subsequent hint unlocks after each guess
  return Math.min(guessCount + 1, 6);
}
```

**Changes:**
- Parameter renamed from `wrongAttempts` to `guessCount`
- Logic changed to unlock based on total guesses made, not just wrong attempts
- Returns `guessCount + 1` (because first hint is already unlocked at start)
- Capped at maximum of 6 hints

---

#### Changed: `updateHintStates()`
**Before:**
```typescript
export function updateHintStates(
  hintStates: HintState[],
  wrongAttempts: number,
  wordLength: number
): HintState[] {
  const availableCount = getAvailableHintsCount(wrongAttempts, wordLength);
  
  return hintStates.map((hint, index) => ({
    ...hint,
    unlocked: index < availableCount,
  }));
}
```

**After:**
```typescript
export function updateHintStates(
  hintStates: HintState[],
  guessCount: number,
  wordLength: number
): HintState[] {
  const availableCount = getAvailableHintsCount(guessCount, wordLength);
  
  return hintStates.map((hint, index) => ({
    ...hint,
    unlocked: index < availableCount,
  }));
}
```

**Changes:**
- Parameter renamed from `wrongAttempts` to `guessCount`
- Function now called with total guess count instead of wrong attempts

---

### 2. **src/components/GameBoard.tsx**

#### Changed: Component Props and Logic
**Before:**
```typescript
interface GameBoardProps {
  hints: string[];
}

const handleHintClick = (rowIndex: number) => {
  setShowPopup(rowIndex);
  setTimeout(() => {
    setShowPopup(null);
  }, 3500);
};

// All lightbulbs were always clickable and yellow
<button 
  onClick={() => handleHintClick(rowIndex)}
  className="flex-shrink-0 p-1 hover:bg-yellow-50 rounded-full transition-colors"
>
  <LightbulbIcon className="h-6 w-6 text-yellow-500" />
</button>

{hints[showPopup] || 'No hint available'}
```

**After:**
```typescript
interface GameBoardProps {
  hints: HintState[];
}

const handleHintClick = (rowIndex: number) => {
  const hint = hints[rowIndex];
  // Only show popup if hint is unlocked
  if (hint && hint.unlocked) {
    setShowPopup(rowIndex);
    setTimeout(() => {
      setShowPopup(null);
    }, 3500);
  }
};

// Lightbulbs now have locked/unlocked states with visual feedback
const hint = hints[rowIndex];
const isLocked = !hint || !hint.unlocked;

<button 
  onClick={() => handleHintClick(rowIndex)}
  className={`flex-shrink-0 p-1 rounded-full transition-colors ${
    isLocked 
      ? 'opacity-30 cursor-not-allowed' 
      : 'hover:bg-yellow-50 cursor-pointer'
  }`}
  aria-label={isLocked ? `Hint ${rowIndex + 1} locked` : `Show hint ${rowIndex + 1}`}
  disabled={isLocked}
>
  <LightbulbIcon className={`h-6 w-6 ${isLocked ? 'text-gray-400' : 'text-yellow-500'}`} />
</button>

{hints[showPopup]?.text || 'No hint available'}
```

**Changes:**
- Props type changed from `string[]` to `HintState[]`
- Added unlock state checking in `handleHintClick`
- Added visual states for locked vs unlocked hints:
  - Locked: 30% opacity, gray color, cursor-not-allowed
  - Unlocked: Full opacity, yellow color, hover effects
- Added `disabled` attribute to locked buttons
- Updated hint text access to use `.text` property

---

### 3. **src/App.tsx**

#### Removed: `wrongAttempts` state
**Before:**
```typescript
const [hintStates, setHintStates] = useState<HintState[]>(() => initializeHints(challenge.hints));
const [wrongAttempts, setWrongAttempts] = useState(0);
```

**After:**
```typescript
const [hintStates, setHintStates] = useState<HintState[]>(() => initializeHints(challenge.hints));
```

**Reason:** No longer needed since hints unlock based on total guesses, not wrong attempts.

---

#### Changed: Hint state restoration
**Before:**
```typescript
setWrongAttempts(savedState.guesses.length - (savedState.gameStatus === 'won' ? 1 : 0));
const updatedHints = updateHintStates(restoredHints, savedState.guesses.length, challenge.wordLength);
```

**After:**
```typescript
const updatedHints = updateHintStates(restoredHints, savedState.guesses.length, challenge.wordLength);
```

**Changes:**
- Removed wrongAttempts calculation
- Directly pass guess count to updateHintStates

---

#### Changed: Hint unlocking after guess
**Before:**
```typescript
// Update hints on wrong guess
const newWrongAttempts = wrongAttempts + 1;
setWrongAttempts(newWrongAttempts);
const newHintStates = updateHintStates(hintStates, newWrongAttempts, challenge.wordLength);
setHintStates(newHintStates);
```

**After:**
```typescript
// Update hints based on guess count (unlock next hint after each guess)
const newHintStates = updateHintStates(hintStates, newGuesses.length, challenge.wordLength);
setHintStates(newHintStates);
```

**Changes:**
- Removed wrongAttempts tracking
- Pass `newGuesses.length` directly to unlock hints
- Comment updated to reflect new behavior

---

#### Changed: GameBoard component prop
**Before:**
```typescript
<GameBoard
  hints={challenge.hints}
/>
```

**After:**
```typescript
<GameBoard
  hints={hintStates}
/>
```

**Reason:** Pass HintState objects instead of raw hint strings to enable lock/unlock logic.

---

## Summary of Behavioral Changes

### Before
- All hint lightbulbs were always visible and clickable
- Hints unlocked based on wrong attempts with different schedules per word length
- Visual appearance was identical for all hints
- Clicking any bulb would show the hint

### After
- Hint lightbulbs show locked/unlocked states visually
- Hints unlock progressively: 1st at start, 2nd after 1st guess, etc.
- Locked hints: grayed out, 30% opacity, not clickable
- Unlocked hints: bright yellow, full opacity, show popup on click
- Hints unlock after every guess (not just wrong ones)
- Simpler, more predictable unlock pattern

## Files Modified
1. `src/lib/hintManager.ts` - Core hint unlock logic
2. `src/components/GameBoard.tsx` - Visual presentation and interaction
3. `src/App.tsx` - State management and coordination

## Testing Checklist
- ✅ First hint unlocked at game start
- ✅ Subsequent hints locked (grayed out)
- ✅ Locked hints don't respond to clicks
- ✅ Each guess unlocks next hint
- ✅ Unlocked hints show popup when clicked
- ✅ Visual feedback for locked vs unlocked state
- ✅ Game state saves and restores correctly
