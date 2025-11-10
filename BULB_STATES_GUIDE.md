# Bulb States Implementation Guide

## Overview
The hint bulbs now have three distinct visual states to clearly communicate their availability and usage status to users.

## Three States

### State 1: Locked (No Clue Available)
**When:** Hint hasn't unlocked yet based on game progress
**Visual Indicators:**
- Gray/dimmed lightbulb icon (`text-gray-300`)
- Small lock icon overlay (bottom-right corner)
- Very low opacity (`opacity-25`)
- Non-interactive (cursor: not-allowed)

**Code Implementation:**
```tsx
{isLocked && (
  <div className="relative">
    <LightbulbIcon className="h-6 w-6 text-gray-300" />
    <Lock className="h-3 w-3 text-gray-400 absolute -bottom-0.5 -right-0.5" />
  </div>
)}
```

### State 2: Unlocked but Not Viewed (Clue Available)
**When:** Hint is unlocked but user hasn't clicked to view it yet
**Visual Indicators:**
- Bright amber/yellow bulb (`text-amber-500`)
- Glowing drop shadow effect
- Pulsing animation on the bulb itself
- Pulsing glow ring around the bulb
- Hover effects (scale up, yellow background)
- Most visually prominent state to draw attention

**Code Implementation:**
```tsx
{isUnlockedNotViewed && (
  <div className="relative">
    <LightbulbIcon className="h-6 w-6 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
    <div className="absolute inset-0 rounded-full bg-amber-400/30 animate-ping" />
  </div>
)}
```

### State 3: Viewed (Clue Seen)
**When:** User has clicked and viewed the hint content
**Visual Indicators:**
- Blue lightbulb icon (`text-blue-500`)
- Green checkmark overlay (bottom-right corner) with white background
- Subtle hover effect (scale slightly, blue background)
- Still clickable to re-view the hint
- Less prominent than State 2, showing completion

**Code Implementation:**
```tsx
{isRevealed && !isLocked && (
  <div className="relative">
    <LightbulbIcon className="h-6 w-6 text-blue-500" />
    <CheckCircle2 className="h-3 w-3 text-green-500 absolute -bottom-0.5 -right-0.5 bg-white rounded-full" />
  </div>
)}
```

## State Transitions

```
State 1 (Locked)
    ↓ (hint unlocks after guess)
State 2 (Unlocked but Not Viewed)
    ↓ (user clicks bulb)
State 3 (Viewed)
    → (can click again to re-view)
```

## Animation Details

### State 1: Locked
- No animations
- Static appearance

### State 2: Unlocked but Not Viewed
- Button pulse: `animate-pulse` on entire button
- Glow ring pulse: `animate-ping` on the glow effect
- Hover scale: `hover:scale-110`
- Active press: `active:scale-95`

### State 3: Viewed
- Subtle hover scale: `hover:scale-105`
- Active press: `active:scale-95`

## Accessibility

Each state has descriptive ARIA labels:
- State 1: "Hint {number} locked"
- State 2: "New hint {number} available!"
- State 3: "Hint {number} viewed - click to view again"

## User Flow

1. User starts game → First bulb is in State 2 (unlocked, available)
2. User makes guesses → More bulbs transition from State 1 to State 2
3. User clicks a State 2 bulb → Popup shows hint, bulb becomes State 3
4. User can click State 3 bulbs again to re-read hints
5. State 1 bulbs remain locked until the appropriate number of guesses

## Technical Details

### Component: `GameBoard.tsx`
- Added `onRevealHint` callback prop
- Tracks three conditions: `isLocked`, `isRevealed`, `isUnlockedNotViewed`
- Auto-marks hints as revealed when clicked for the first time
- Integrated with existing `HintState` type from game types

### Icons Used
- `LightbulbIcon` from `lucide-react` - main hint indicator
- `Lock` from `lucide-react` - locked state overlay
- `CheckCircle2` from `lucide-react` - viewed state overlay

### Color Scheme
- **Locked:** Gray tones (`gray-300`, `gray-400`)
- **Unlocked:** Amber/yellow (`amber-500`, `amber-400`)
- **Viewed:** Blue + green (`blue-500` + `green-500`)

## Benefits

1. **Clear Visual Feedback:** Users instantly know which hints they can use
2. **Attention Drawing:** Pulsing animation draws eyes to new hints
3. **Progress Tracking:** Checkmarks show which hints have been used
4. **Re-viewable:** Viewed hints remain accessible for reference
5. **Progressive Disclosure:** Locked hints don't distract early in the game
