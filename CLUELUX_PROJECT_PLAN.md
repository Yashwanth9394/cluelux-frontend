# 🧩 ClueLux — Word Guessing Game with AI-Generated Hints

## Project Overview
Transform "Wordle-like Game Mocks" into ClueLux - a fully static, AI-powered daily word challenge game with progressive hints. No backend calls at runtime; all daily challenges pre-computed during build.

## Current State Analysis

### ✅ What We Have (Wordle-like Game Mocks)
- Clean, modern UI with Radix UI components
- TypeScript + React + Vite setup
- Basic game mechanics (5-letter words)
- Word validation system
- Keyboard component
- Good animation foundation

### ✅ What We Have (WordleAI)
- OpenAI hint generation integration (Firebase-based)
- Multiple word lengths support (5, 6, 7, 8 letters)
- Extensive valid word lists:
  - ~12,968 5-letter words
  - ~22,160 6-letter words
  - ~32,913 7-letter words
  - ~40,719 8-letter words
- Hint display system with lightbulb icon
- Progressive hint logic

### 🎯 What We Need to Build
1. Daily build script with AI hint generation
2. Static JSON data generation system
3. Multi-word-length support (5-8 letters)
4. Progressive hint reveal system
5. Enhanced animations
6. Analytics integration
7. Daily challenge rotation

---

## 1️⃣ High-Level Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Daily Build Process                       │
│  (Runs once per day via GitHub Actions/Cron)                │
├─────────────────────────────────────────────────────────────┤
│  1. Select unused word from master list                     │
│  2. Generate 5 progressive hints via OpenAI API             │
│  3. Bundle valid words for that length                      │
│  4. Write static JSON (today.json)                          │
│  5. Trigger Vite build                                      │
│  6. Deploy to hosting (Vercel/S3+CloudFront)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Application                      │
│              (Pure Static, No Runtime APIs)                 │
├─────────────────────────────────────────────────────────────┤
│  • Loads today.json at startup                              │
│  • Validates guesses locally                                │
│  • Manages game state in localStorage                       │
│  • Reveals hints progressively                              │
│  • Handles all animations client-side                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Analytics (Optional)                      │
│       CloudFront Logs / Google Analytics / Pinpoint         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ Data Architecture

### File Structure
```
src/
├── data/
│   ├── words/
│   │   ├── master_words.json         # All words with metadata
│   │   ├── valid_5_letter.json       # Valid guesses (5 letters)
│   │   ├── valid_6_letter.json       # Valid guesses (6 letters)
│   │   ├── valid_7_letter.json       # Valid guesses (7 letters)
│   │   └── valid_8_letter.json       # Valid guesses (8 letters)
│   └── today.json                    # Daily challenge (generated)
├── scripts/
│   ├── daily_build.ts                # Main build script
│   ├── hint_generator.ts             # OpenAI integration
│   ├── word_selector.ts              # Word selection logic
│   └── data_bundler.ts               # JSON generation
├── lib/
│   ├── gameEngine.ts                 # Core game logic
│   ├── hintManager.ts                # Hint progression
│   ├── validationEngine.ts           # Guess validation
│   └── localStorage.ts               # State persistence
├── components/
│   ├── GameBoard.tsx                 # Main game grid
│   ├── GameTile.tsx                  # Individual tile
│   ├── Keyboard.tsx                  # On-screen keyboard
│   ├── HintDisplay.tsx               # NEW: Hint reveal component
│   └── AnimationEffects.tsx          # NEW: Animation library
└── App.tsx                           # Main app
```

### Data Schemas

#### master_words.json
```json
[
  {
    "id": "uuid-1",
    "word": "serpent",
    "length": 7,
    "difficulty": "medium",
    "category": "nature",
    "used": false,
    "lastUsed": null,
    "createdAt": "2025-01-01"
  }
]
```

#### today.json (Generated Daily)
```json
{
  "date": "2025-11-03",
  "gameNumber": 307,
  "wordLength": 7,
  "answer": "SERPENT",
  "answerLower": "serpent",
  "hints": [
    "🌿 Found in myths and jungles.",
    "🐍 Often feared, but rarely seen.",
    "✨ Sheds its skin to renew itself.",
    "⚕️ A symbol of deception and healing.",
    "🔤 Starts with 'S', ends with 'T'."
  ],
  "validWords": ["serpent", "journey", "ancient", ...],
  "metadata": {
    "difficulty": "medium",
    "category": "nature",
    "generatedAt": "2025-11-03T00:00:00Z"
  }
}
```

#### valid_X_letter.json
```json
{
  "length": 7,
  "count": 32913,
  "words": ["ability", "absence", "account", ...]
}
```

---

## 3️⃣ Implementation Phases

### Phase 1: Data Migration & Setup (Day 1-2)
**Goal**: Migrate word lists from WordleAI and set up data structure

#### Tasks:
- [ ] Create `/src/data/words/` directory
- [ ] Extract and convert WordleAI word lists to JSON format
  - [ ] validGuesses_5.ts → valid_5_letter.json
  - [ ] validGuesses_6.ts → valid_6_letter.json
  - [ ] validGuesses_7.ts → valid_7_letter.json
  - [ ] validGuesses_8.ts → valid_8_letter.json
- [ ] Create master_words.json with curated answer list
- [ ] Add UUID generation for word tracking
- [ ] Set up TypeScript types for all data structures

**Files to Create**:
- `src/types/game.types.ts`
- `src/data/words/master_words.json`
- `src/data/words/valid_X_letter.json` (x4 files)

---

### Phase 2: Core Game Engine (Day 2-3)
**Goal**: Build the core game logic independent of UI

#### Tasks:
- [ ] Create `gameEngine.ts` with:
  - [ ] `initializeGame(todayData)` - Load daily challenge
  - [ ] `validateGuess(guess)` - Check if word is valid
  - [ ] `evaluateGuess(guess, answer)` - Return tile states
  - [ ] `checkWinCondition()` - Determine if game won
  - [ ] `updateGameState()` - Manage game state
- [ ] Create `validationEngine.ts` with:
  - [ ] `isValidWord(word, length)` - Check against valid word list
  - [ ] `checkWordLength(word, expectedLength)` - Validate length
  - [ ] `normalizeWord(word)` - Uppercase/sanitize
- [ ] Create `localStorage.ts` with:
  - [ ] `saveGameState()` - Persist current game
  - [ ] `loadGameState()` - Restore game
  - [ ] `clearOldGames()` - Cleanup old data

**Files to Create**:
- `src/lib/gameEngine.ts`
- `src/lib/validationEngine.ts`
- `src/lib/localStorage.ts` (enhance existing)

---

### Phase 3: Hint System (Day 3-4)
**Goal**: Implement progressive hint reveal system

#### Tasks:
- [ ] Create `hintManager.ts` with:
  - [ ] `getAvailableHints(wrongAttempts)` - Determine which hints to show
  - [ ] `shouldRevealHint(attempts)` - Progressive logic
  - [ ] `formatHint(hint, index)` - Add emojis and styling
- [ ] Create `HintDisplay.tsx` component with:
  - [ ] Locked/unlocked hint states
  - [ ] Reveal animations
  - [ ] Progress indicator (X/5 hints revealed)
- [ ] Implement hint progression rules:
  - Hint 1: After 1st wrong guess
  - Hint 2: After 2nd wrong guess
  - Hint 3: After 3rd wrong guess
  - Hint 4: After 4th wrong guess
  - Hint 5: After 5th wrong guess

**Files to Create**:
- `src/lib/hintManager.ts`
- `src/components/HintDisplay.tsx`

---

### Phase 4: Enhanced UI Components (Day 4-5)
**Goal**: Upgrade UI with multi-length support and animations

#### Tasks:
- [ ] Update `GameBoard.tsx`:
  - [ ] Support dynamic word lengths (5-8)
  - [ ] Responsive tile sizing
  - [ ] Dynamic max attempts based on length
- [ ] Update `GameTile.tsx`:
  - [ ] Enhanced flip animation
  - [ ] Correct/present/absent states
  - [ ] Delay animations for dramatic effect
- [ ] Update `Keyboard.tsx`:
  - [ ] Track key states (unused/correct/present/absent)
  - [ ] Visual feedback on key press
- [ ] Create `AnimationEffects.tsx`:
  - [ ] Flip animations (card flip effect)
  - [ ] Hint reveal (fade-in + glow)
  - [ ] Win celebration (confetti/bloom effect)
  - [ ] Shake animation (invalid word)

**Files to Update/Create**:
- `src/components/GameBoard.tsx`
- `src/components/GameTile.tsx`
- `src/components/Keyboard.tsx`
- `src/components/AnimationEffects.tsx` (new)

---

### Phase 5: Daily Build System (Day 5-7)
**Goal**: Create automated daily challenge generation

#### Tasks:
- [ ] Create `scripts/daily_build.ts`:
  - [ ] Load master_words.json
  - [ ] Select next unused word (or rotate through)
  - [ ] Track word usage
  - [ ] Update master list with usage info
- [ ] Create `scripts/hint_generator.ts`:
  - [ ] OpenAI API integration
  - [ ] Prompt engineering for 5 progressive hints
  - [ ] Error handling and retries
  - [ ] Fallback hints if API fails
- [ ] Create `scripts/word_selector.ts`:
  - [ ] Smart word selection (difficulty balancing)
  - [ ] Category rotation
  - [ ] Avoid recent repeats
- [ ] Create `scripts/data_bundler.ts`:
  - [ ] Generate today.json
  - [ ] Include valid words for selected length
  - [ ] Add metadata
  - [ ] Validate JSON structure
- [ ] Set up environment:
  - [ ] `.env` for OpenAI API key
  - [ ] Error logging
  - [ ] Build success/failure notifications

**Files to Create**:
- `scripts/daily_build.ts`
- `scripts/hint_generator.ts`
- `scripts/word_selector.ts`
- `scripts/data_bundler.ts`
- `.env.example`

---

### Phase 6: GitHub Actions / Automation (Day 7-8)
**Goal**: Automate daily builds and deployments

#### Tasks:
- [ ] Create `.github/workflows/daily-challenge.yml`:
  - [ ] Cron schedule (runs at midnight UTC)
  - [ ] Install dependencies
  - [ ] Run daily_build.ts script
  - [ ] Commit updated today.json and master_words.json
  - [ ] Trigger Vite build
  - [ ] Deploy to hosting
- [ ] Set up GitHub secrets:
  - [ ] OPENAI_API_KEY
  - [ ] VERCEL_TOKEN (or AWS credentials)
- [ ] Add manual trigger option (workflow_dispatch)
- [ ] Set up failure notifications (email/Slack)

**Files to Create**:
- `.github/workflows/daily-challenge.yml`
- `.github/workflows/manual-build.yml` (optional)

---

### Phase 7: Testing & Polish (Day 8-9)
**Goal**: Ensure reliability and smooth user experience

#### Tasks:
- [ ] Unit tests:
  - [ ] gameEngine.ts tests
  - [ ] validationEngine.ts tests
  - [ ] hintManager.ts tests
- [ ] Integration tests:
  - [ ] Full game flow
  - [ ] Hint progression
  - [ ] Win/loss scenarios
- [ ] Manual testing:
  - [ ] Test all word lengths (5-8)
  - [ ] Verify hint reveals
  - [ ] Check animations on different devices
  - [ ] Test localStorage persistence
- [ ] Performance optimization:
  - [ ] Lazy load valid word lists
  - [ ] Optimize bundle size
  - [ ] Preload animations
- [ ] Accessibility:
  - [ ] Keyboard navigation
  - [ ] Screen reader support
  - [ ] Color contrast (color blind mode)

---

### Phase 8: Analytics & Deployment (Day 9-10)
**Goal**: Launch with monitoring

#### Tasks:
- [ ] Set up analytics:
  - [ ] Google Analytics 4 integration
  - [ ] Track key events (game started, hints used, wins, losses)
  - [ ] Track word difficulty vs completion rate
- [ ] CloudFront/CDN setup:
  - [ ] S3 bucket configuration
  - [ ] CloudFront distribution
  - [ ] Custom domain (cluelux.com)
  - [ ] SSL certificate
- [ ] OR Vercel deployment:
  - [ ] Connect GitHub repo
  - [ ] Set environment variables
  - [ ] Configure build settings
- [ ] Monitoring:
  - [ ] Uptime monitoring (UptimeRobot)
  - [ ] Error tracking (Sentry - optional)
  - [ ] Build failure alerts

**Files to Create**:
- `src/lib/analytics.ts`
- `public/_redirects` (for SPA routing)

---

## 4️⃣ Technical Specifications

### Frontend Tech Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Radix UI (already in place)
- **Styling**: CSS + Tailwind (via index.css)
- **Animations**: Framer Motion or CSS transitions
- **State**: React hooks + localStorage
- **Date Handling**: date-fns

### Build Script Tech Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **AI API**: OpenAI GPT-4
- **File I/O**: Node fs/promises
- **Validation**: Zod for JSON schema validation

### Deployment Options
**Option A: AWS S3 + CloudFront**
- Cost: ~$1-5/month
- Control: Full
- CDN: Built-in
- Setup: Medium complexity

**Option B: Vercel**
- Cost: Free (hobby tier)
- Control: Limited
- CDN: Built-in
- Setup: Simple (recommended for MVP)

---

## 5️⃣ Game Logic Specifications

### Word Length Support
| Length | Max Attempts | Hint Unlock Schedule |
|--------|--------------|---------------------|
| 5      | 6            | After attempts: 1,2,3,4,5 |
| 6      | 7            | After attempts: 1,2,3,4,5 |
| 7      | 8            | After attempts: 1,2,3,4,6 |
| 8      | 9            | After attempts: 1,2,4,6,8 |

### Guess Evaluation Logic
```typescript
function evaluateGuess(guess: string, answer: string): TileState[] {
  const result: TileState[] = new Array(guess.length).fill('absent');
  const answerChars = answer.split('');
  const guessChars = guess.split('');
  
  // First pass: mark correct positions
  for (let i = 0; i < guessChars.length; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = 'correct';
      answerChars[i] = null; // Mark as used
    }
  }
  
  // Second pass: mark present letters
  for (let i = 0; i < guessChars.length; i++) {
    if (result[i] !== 'correct') {
      const index = answerChars.indexOf(guessChars[i]);
      if (index !== -1) {
        result[i] = 'present';
        answerChars[index] = null; // Mark as used
      }
    }
  }
  
  return result;
}
```

### Hint Progression
```typescript
function shouldRevealHint(attemptNumber: number, wordLength: number): boolean {
  const schedules = {
    5: [1, 2, 3, 4, 5],
    6: [1, 2, 3, 4, 5],
    7: [1, 2, 3, 4, 6],
    8: [1, 2, 4, 6, 8]
  };
  
  return schedules[wordLength].includes(attemptNumber);
}
```

---

## 6️⃣ OpenAI Prompt Engineering

### Hint Generation Prompt
```
You are a creative hint writer for a word guessing game. Generate exactly 5 progressive hints for the word "{WORD}".

Rules:
1. Each hint should be more specific than the last
2. First 3 hints should be broad and thematic
3. Hint 4 should give structural clues (rhymes with, category)
4. Hint 5 should give letter clues (first letter, last letter, length)
5. Keep hints under 15 words each
6. Make them clever and engaging, not boring
7. Use emojis sparingly to add visual interest
8. Never reveal the exact word

Format your response as a JSON array of exactly 5 strings.

Example for "OCEAN":
[
  "🌊 Covers most of our planet's surface.",
  "🐠 Home to countless marine creatures.",
  "⛵ Sailors navigate its vast expanse.",
  "💙 Rhymes with 'motion', sounds like 'potion'.",
  "🔤 5 letters: starts with 'O', ends with 'N'."
]
```

### Fallback Hints
If OpenAI fails, use template-based hints:
```typescript
const fallbackHints = [
  `This is a ${wordLength}-letter word.`,
  `It's commonly used in everyday language.`,
  `Think about words related to ${category}.`,
  `The first letter is '${word[0]}' and last letter is '${word[word.length-1]}'.`,
  `It has ${vowelCount} vowels and ${consonantCount} consonants.`
];
```

---

## 7️⃣ localStorage Schema

### Game State
```typescript
interface SavedGameState {
  date: string;              // "2025-11-03"
  gameNumber: number;        // 307
  guesses: string[];         // ["TRACE", "SLIME"]
  evaluations: TileState[][]; // [["absent","absent",...], ...]
  hintsRevealed: number;     // 2
  gameStatus: GameStatus;    // "playing" | "won" | "lost"
  startTime: number;         // Unix timestamp
  endTime?: number;          // Unix timestamp (if finished)
}
```

### Statistics
```typescript
interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  currentStreak: number;
  maxStreak: number;
  hintsUsed: number;
  avgHintsPerGame: number;
  winDistribution: {
    1: number,  // Won on attempt 1
    2: number,
    3: number,
    // ...
  };
  lastPlayed: string;
}
```

---

## 8️⃣ Animation Specifications

### Tile Flip Animation
```css
@keyframes flip {
  0% { transform: rotateX(0); }
  50% { transform: rotateX(90deg); }
  100% { transform: rotateX(0); }
}

.tile-flip {
  animation: flip 0.6s cubic-bezier(0.45, 0.05, 0.55, 0.95);
}
```

### Hint Reveal Animation
```css
@keyframes hintReveal {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.hint-reveal {
  animation: hintReveal 0.5s ease-out;
}
```

### Win Celebration
```css
@keyframes bloom {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.05); filter: brightness(1.2); }
  100% { transform: scale(1); filter: brightness(1); }
}

.win-bloom {
  animation: bloom 0.8s ease-in-out;
}
```

---

## 9️⃣ Performance Targets

- **Bundle Size**: < 500KB (gzipped)
- **Initial Load**: < 2s (3G connection)
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+ (Performance, Accessibility, SEO)
- **Valid Word Lookup**: < 50ms

---

## 🔟 Success Metrics

### Technical Metrics
- ✅ Daily build success rate > 99%
- ✅ Zero runtime API calls
- ✅ 100% static hosting
- ✅ Word rotation without repeats for 1000+ days
- ✅ Hint generation success rate > 95%

### User Experience Metrics
- 📊 Track via Google Analytics:
  - Daily active users (DAU)
  - Game completion rate
  - Average hints used per game
  - Win rate by word length
  - Share rate (social sharing)

---

## 📋 MVP Definition (First Launch)

### Must Have (P0)
- [x] Single word length (5 letters) support
- [ ] 6 attempts per game
- [ ] Progressive hint system (5 hints)
- [ ] Daily word rotation
- [ ] localStorage game persistence
- [ ] Win/loss tracking
- [ ] Basic animations
- [ ] Keyboard support
- [ ] Share functionality

### Should Have (P1)
- [ ] Multiple word lengths (5-8)
- [ ] Statistics dashboard
- [ ] Dark mode
- [ ] Accessibility features
- [ ] Google Analytics

### Could Have (P2)
- [ ] Streak tracking
- [ ] Leaderboard (local)
- [ ] Sound effects
- [ ] Hard mode (must use revealed hints)
- [ ] Color blind mode
- [ ] Mobile app wrapper

### Won't Have (v1)
- ❌ User accounts
- ❌ Multiplayer
- ❌ Custom word lists
- ❌ Paid features
- ❌ Backend database

---

## 🚀 Go-Live Checklist

### Pre-Launch
- [ ] All P0 features complete
- [ ] 30+ days of words pre-loaded
- [ ] OpenAI API key secured
- [ ] GitHub Actions tested
- [ ] Domain purchased (cluelux.com)
- [ ] SSL certificate configured
- [ ] Analytics set up
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Social media accounts created

### Launch Day
- [ ] Deploy to production
- [ ] Verify daily build running
- [ ] Test on multiple devices
- [ ] Monitor error logs
- [ ] Share on social media
- [ ] Submit to web directories
- [ ] Post on Product Hunt (optional)

### Post-Launch
- [ ] Monitor analytics daily
- [ ] Collect user feedback
- [ ] Fix critical bugs within 24h
- [ ] Plan P1 features
- [ ] Regular word list updates

---

## 💰 Cost Estimation

### Development (One-time)
- Development time: 80-100 hours
- Cost: $0 (self-developed)

### Monthly Operating Costs
| Service | Cost |
|---------|------|
| Vercel Hosting | $0 (hobby) or $20 (pro) |
| Domain (cluelux.com) | $1-2/month |
| OpenAI API | $5-20/month (30 calls/month) |
| Analytics | $0 (GA4 free tier) |
| **Total** | **$6-42/month** |

### AWS Alternative
| Service | Cost |
|---------|------|
| S3 Storage | $0.50/month |
| CloudFront | $1-3/month |
| Route 53 | $0.50/month |
| OpenAI API | $5-20/month |
| **Total** | **$7-24/month** |

---

## 📚 Documentation Requirements

### Developer Documentation
- [ ] README.md with setup instructions
- [ ] CONTRIBUTING.md for future contributors
- [ ] API documentation for build scripts
- [ ] Data schema documentation
- [ ] Deployment guide

### User Documentation
- [ ] How to play guide
- [ ] FAQ section
- [ ] Hint system explanation
- [ ] Privacy policy
- [ ] Contact information

---

## 🔐 Security Considerations

### API Key Protection
- ✅ Never commit .env file
- ✅ Use GitHub secrets for CI/CD
- ✅ Rotate keys quarterly
- ✅ Monitor API usage

### Content Security
- ✅ Validate all word inputs
- ✅ Sanitize user-generated content (if added later)
- ✅ CSP headers configured
- ✅ HTTPS only

---

## 🎯 Next Immediate Actions

1. **Create data structure** (scripts/setup_data.ts)
2. **Migrate word lists** from WordleAI to JSON
3. **Build game engine** (lib/gameEngine.ts)
4. **Implement hint manager** (lib/hintManager.ts)
5. **Create daily build script** (scripts/daily_build.ts)
6. **Set up GitHub Actions** (.github/workflows/)
7. **Deploy MVP** to Vercel

---

## 📞 Project Contacts & Resources

### Key Files to Reference
- WordleAI hint system: `WordleAI/reactwordle/src/components/grid/CompletedRow.tsx`
- Word lists: `WordleAI/reactwordle/src/constants/validGuesses_*.ts`
- Current UI: `Wordle-like Game Mocks/src/App.tsx`

### External Resources
- OpenAI API Docs: https://platform.openai.com/docs
- GitHub Actions Docs: https://docs.github.com/en/actions
- Vercel Deployment: https://vercel.com/docs

---

**Last Updated**: November 3, 2025
**Version**: 1.0
**Status**: Ready to Begin Implementation
