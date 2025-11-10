# ✅ ClueLux Implementation Checklist

Use this checklist to track your progress building ClueLux.

---

## 📋 Pre-Development Setup

- [ ] Read README_CLUELUX.md (10 minutes)
- [ ] Review PROJECT_ROADMAP.md for visual overview (15 minutes)
- [ ] Read CLUELUX_PROJECT_PLAN.md in full (45 minutes)
- [ ] Study IMPLEMENTATION_STRATEGY.md (30 minutes)
- [ ] Bookmark QUICK_REFERENCE.md for quick lookups

**Total Reading Time**: ~2 hours (well worth it!)

---

## 🔧 Phase 1: Data Setup (Days 1-2)

### 1.1 Environment Setup
- [ ] Open terminal in "Wordle-like Game Mocks" directory
- [ ] Run `npm install` to install existing dependencies
- [ ] Install new dependencies:
  ```bash
  npm install openai date-fns zod uuid
  npm install -D @types/uuid
  ```
- [ ] Create `.env` file with OpenAI API key:
  ```bash
  echo "OPENAI_API_KEY=your_key_here" > .env
  echo ".env" >> .gitignore
  ```

### 1.2 Directory Structure
- [ ] Create data directories:
  ```bash
  mkdir -p src/data/words
  mkdir -p src/types
  mkdir -p src/lib
  mkdir -p scripts/utils
  ```

### 1.3 Extract Word Lists
- [ ] Create `scripts/extract_wordlists.ts`
- [ ] Copy word arrays from WordleAI project:
  - [ ] `validGuesses_5.ts` → `src/data/words/valid_5_letter.json`
  - [ ] `validGuesses_6.ts` → `src/data/words/valid_6_letter.json`
  - [ ] `validGuesses_7.ts` → `src/data/words/valid_7_letter.json`
  - [ ] `validGuesses_8.ts` → `src/data/words/valid_8_letter.json`
- [ ] Add extraction script to package.json:
  ```json
  "scripts": {
    "extract-words": "tsx scripts/extract_wordlists.ts"
  }
  ```
- [ ] Run extraction: `npm run extract-words`
- [ ] Verify JSON files created with correct word counts

### 1.4 Create Master Words List
- [ ] Create `scripts/create_master_words.ts`
- [ ] Curate 500-1000 answer words (mix of lengths 5-8)
- [ ] Add metadata (id, category, difficulty)
- [ ] Generate UUIDs for each word
- [ ] Output to `src/data/words/master_words.json`
- [ ] Add script to package.json: `"create-master": "tsx scripts/create_master_words.ts"`
- [ ] Run: `npm run create-master`
- [ ] Verify master_words.json structure

### 1.5 TypeScript Types
- [ ] Create `src/types/game.types.ts` with all interfaces:
  - [ ] TileState type
  - [ ] GameStatus type
  - [ ] KeyState type
  - [ ] MasterWord interface
  - [ ] DailyChallenge interface
  - [ ] GameState interface
  - [ ] GameStats interface
  - [ ] HintState interface

**Phase 1 Complete?** ✅ You now have all data files and types ready!

---

## 🎮 Phase 2: Core Game Engine (Days 2-3)

### 2.1 Validation Engine
- [ ] Create `src/lib/validationEngine.ts`
- [ ] Implement `isValidWord(word, length)` function
- [ ] Implement `normalizeWord(word)` function
- [ ] Implement `checkWordLength(word, length)` function
- [ ] Import and create Sets for each word length
- [ ] Test with sample words

### 2.2 Game Engine
- [ ] Create `src/lib/gameEngine.ts`
- [ ] Implement `evaluateGuess(guess, answer)` function
  - [ ] First pass: mark correct positions
  - [ ] Second pass: mark present letters
  - [ ] Handle duplicate letters correctly
- [ ] Implement `isWinningGuess(evaluation)` function
- [ ] Implement `getMaxAttempts(wordLength)` function
- [ ] Implement `updateKeyboardState(states, guess, evaluation)` function
- [ ] Write unit tests for evaluateGuess with edge cases

### 2.3 Hint Manager
- [ ] Create `src/lib/hintManager.ts`
- [ ] Implement `getHintUnlockSchedule(wordLength)` function
- [ ] Implement `getAvailableHintsCount(attempts, length)` function
- [ ] Implement `shouldRevealHint(attemptNumber, length)` function
- [ ] Implement `initializeHints(hints)` function
- [ ] Implement `updateHintStates(hintStates, attempts, length)` function
- [ ] Test hint progression logic for all word lengths

### 2.4 localStorage Manager
- [ ] Create `src/lib/localStorage.ts`
- [ ] Implement `saveGameState(state)` function
- [ ] Implement `loadGameState()` function
- [ ] Implement `clearGameState()` function
- [ ] Implement `saveStats(stats)` function
- [ ] Implement `loadStats()` function with defaults
- [ ] Implement `updateStats(prevStats, gameState)` function
- [ ] Test with browser localStorage

**Phase 2 Complete?** ✅ Core game logic is ready!

---

## 🤖 Phase 3: Build Scripts (Days 3-5)

### 3.1 Hint Generator
- [ ] Install OpenAI SDK: `npm install openai`
- [ ] Create `scripts/hint_generator.ts`
- [ ] Implement `generateHints(word)` function
  - [ ] Setup OpenAI client with API key
  - [ ] Create prompt template
  - [ ] Call GPT-4 API
  - [ ] Parse JSON response
  - [ ] Validate 5 hints returned
- [ ] Implement `generateFallbackHints(word)` function
- [ ] Test with sample words
- [ ] Check API costs (should be ~$0.01 per call)

### 3.2 Word Selector
- [ ] Create `scripts/word_selector.ts`
- [ ] Implement `selectDailyWord()` function
  - [ ] Load master_words.json
  - [ ] Filter unused words
  - [ ] Random selection
  - [ ] Mark word as used
  - [ ] Update lastUsed timestamp
  - [ ] Save back to file
- [ ] Handle case when all words used (reset)
- [ ] Test selection logic

### 3.3 Data Bundler
- [ ] Create `scripts/data_bundler.ts`
- [ ] Implement `bundleDailyChallenge(word, hints)` function
  - [ ] Load valid words for word length
  - [ ] Calculate game number from start date
  - [ ] Create DailyChallenge object
  - [ ] Write to `src/data/today.json`
- [ ] Validate JSON schema with Zod
- [ ] Test bundle generation

### 3.4 Main Build Script
- [ ] Create `scripts/daily_build.ts`
- [ ] Implement main() orchestrator:
  - [ ] Step 1: Select word
  - [ ] Step 2: Generate hints
  - [ ] Step 3: Bundle data
  - [ ] Add error handling
  - [ ] Add logging
- [ ] Add to package.json: `"daily-build": "tsx scripts/daily_build.ts"`
- [ ] Test full build: `npm run daily-build`
- [ ] Verify today.json created correctly
- [ ] Test multiple runs (should select different words)

**Phase 3 Complete?** ✅ Build automation ready!

---

## 🎨 Phase 4: UI Enhancement (Days 5-7)

### 4.1 Update GameBoard Component
- [ ] Open `src/components/GameBoard.tsx`
- [ ] Add support for dynamic word lengths (5-8)
- [ ] Make tile sizing responsive
- [ ] Update max rows based on word length
- [ ] Test with different word lengths

### 4.2 Update GameTile Component
- [ ] Open `src/components/GameTile.tsx`
- [ ] Enhance flip animation
- [ ] Add delay for sequential reveals
- [ ] Implement correct/present/absent styling
- [ ] Test animations

### 4.3 Update Keyboard Component
- [ ] Open `src/components/Keyboard.tsx`
- [ ] Track key states (correct/present/absent)
- [ ] Update visual feedback
- [ ] Test keyboard state updates

### 4.4 Create HintDisplay Component
- [ ] Create `src/components/HintDisplay.tsx`
- [ ] Design locked/unlocked/revealed states
- [ ] Add click to reveal functionality
- [ ] Implement reveal animation
- [ ] Add progress indicator (X/5 revealed)
- [ ] Style with Radix UI components
- [ ] Test hint progression

### 4.5 Create Animation Effects
- [ ] Create `src/components/AnimationEffects.tsx` (optional)
- [ ] Implement flip animation
- [ ] Implement hint reveal animation
- [ ] Implement win celebration (confetti/bloom)
- [ ] Implement shake animation (invalid word)
- [ ] Test all animations

**Phase 4 Complete?** ✅ UI is polished and responsive!

---

## 🔄 Phase 5: App Integration (Days 6-7)

### 5.1 Update App.tsx
- [ ] Import today.json
- [ ] Import all new lib functions
- [ ] Import new components (HintDisplay)
- [ ] Setup state for:
  - [ ] Daily challenge data
  - [ ] Current game state
  - [ ] Hint states
  - [ ] Keyboard states
- [ ] Implement game initialization:
  - [ ] Load today.json
  - [ ] Check localStorage for existing game
  - [ ] Initialize or restore game state
- [ ] Implement guess submission:
  - [ ] Validate word
  - [ ] Evaluate guess
  - [ ] Update tile states
  - [ ] Update keyboard states
  - [ ] Check win condition
  - [ ] Update hint states
  - [ ] Save to localStorage
- [ ] Implement hint reveal:
  - [ ] Click handler for hints
  - [ ] Update hint state
  - [ ] Track hints used
- [ ] Implement game completion:
  - [ ] Win/loss detection
  - [ ] Update statistics
  - [ ] Show results modal
  - [ ] Share functionality
- [ ] Test complete game flow

### 5.2 Testing
- [ ] Test 5-letter words
- [ ] Test 6-letter words
- [ ] Test 7-letter words
- [ ] Test 8-letter words
- [ ] Test hint progression
- [ ] Test localStorage persistence
- [ ] Test statistics tracking
- [ ] Test on mobile devices
- [ ] Test keyboard navigation
- [ ] Test accessibility

**Phase 5 Complete?** ✅ Game is fully functional!

---

## ⚙️ Phase 6: Automation (Days 7-8)

### 6.1 GitHub Actions Setup
- [ ] Create `.github/workflows` directory
- [ ] Create `daily-challenge.yml` workflow:
  - [ ] Trigger: cron schedule (0 0 * * *)
  - [ ] Checkout code
  - [ ] Setup Node.js 18
  - [ ] Install dependencies
  - [ ] Run daily-build script
  - [ ] Commit updated files
  - [ ] Push to repository
- [ ] Add manual trigger (workflow_dispatch)
- [ ] Test workflow manually

### 6.2 GitHub Secrets
- [ ] Go to repository Settings > Secrets
- [ ] Add `OPENAI_API_KEY` secret
- [ ] Add `VERCEL_TOKEN` secret (if using Vercel)
- [ ] Update workflow to use secrets

### 6.3 Deployment Setup
- [ ] Choose hosting platform:
  - [ ] **Option A: Vercel** (recommended)
    - [ ] Connect GitHub repo
    - [ ] Configure build command: `npm run build`
    - [ ] Configure output directory: `dist`
    - [ ] Add environment variables
  - [ ] **Option B: AWS S3 + CloudFront**
    - [ ] Create S3 bucket
    - [ ] Enable static website hosting
    - [ ] Create CloudFront distribution
    - [ ] Add sync script to workflow
- [ ] Test manual deployment
- [ ] Verify site loads correctly

### 6.4 Error Notifications
- [ ] Add notification step to workflow
- [ ] Configure email/Slack on failure
- [ ] Test notification

**Phase 6 Complete?** ✅ Automation is live!

---

## ✅ Phase 7: Testing & Optimization (Days 8-9)

### 7.1 Unit Tests
- [ ] Install testing library: `npm install -D vitest @testing-library/react`
- [ ] Write tests for gameEngine.ts
- [ ] Write tests for validationEngine.ts
- [ ] Write tests for hintManager.ts
- [ ] Run tests: `npm test`
- [ ] Aim for >80% coverage

### 7.2 Integration Tests
- [ ] Test complete game flow (5-letter)
- [ ] Test complete game flow (8-letter)
- [ ] Test hint progression
- [ ] Test win scenario
- [ ] Test loss scenario
- [ ] Test localStorage persistence

### 7.3 Performance Optimization
- [ ] Run Lighthouse audit
- [ ] Check bundle size: `npm run build && ls -lh dist/assets`
- [ ] Optimize if needed:
  - [ ] Lazy load word lists
  - [ ] Code split if >500KB
  - [ ] Compress assets
- [ ] Test load time on slow 3G

### 7.4 Accessibility
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader
- [ ] Check color contrast ratios
- [ ] Add ARIA labels where needed
- [ ] Test on VoiceOver (iOS) / TalkBack (Android)

### 7.5 Cross-Browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on mobile browsers

**Phase 7 Complete?** ✅ Game is polished and tested!

---

## 🚀 Phase 8: Launch (Day 10)

### 8.1 Pre-Launch Checklist
- [ ] All P0 features working
- [ ] 30+ words loaded in master list
- [ ] Daily build tested and working
- [ ] Site deployed and accessible
- [ ] Analytics configured
- [ ] Error monitoring setup
- [ ] Privacy policy page added
- [ ] How to play guide added
- [ ] Share functionality tested

### 8.2 Launch Day
- [ ] Final production build
- [ ] Verify today's challenge loads
- [ ] Test on multiple devices
- [ ] Announce on social media
- [ ] Post on relevant subreddits (r/wordle, r/sideproject)
- [ ] Share with friends/family
- [ ] Monitor analytics dashboard
- [ ] Watch for errors in logs

### 8.3 Post-Launch (Week 1)
- [ ] Monitor daily build success
- [ ] Check user engagement metrics
- [ ] Collect feedback
- [ ] Fix any critical bugs
- [ ] Plan P1 features
- [ ] Update documentation

**Phase 8 Complete?** 🎉 ClueLux is LIVE!

---

## 📊 Success Criteria

After launch, verify these metrics:

**Technical**
- [ ] Daily build success rate > 99%
- [ ] Page load time < 2 seconds
- [ ] Bundle size < 500KB gzipped
- [ ] Lighthouse score > 90

**User Experience**
- [ ] Game completion rate > 70%
- [ ] Average hints used < 3
- [ ] Share rate > 20%
- [ ] Return rate (next day) > 50%

---

## 🎯 Optional P1 Features (Post-Launch)

- [ ] Statistics dashboard with charts
- [ ] Streak tracking
- [ ] Dark mode toggle
- [ ] Sound effects (optional toggle)
- [ ] Hard mode (must use revealed hints)
- [ ] Category selector (animals, objects, etc.)
- [ ] Leaderboard (localStorage-based)
- [ ] Multiple language support

---

## 📝 Notes & Learnings

Use this space to track issues, learnings, and ideas:

```
Date: ___________
Issue: ___________________________________________________________
Solution: _________________________________________________________

Date: ___________
Learning: _________________________________________________________

Date: ___________
Feature Idea: ____________________________________________________
```

---

## 🎉 Celebration Milestones

- [ ] 🎊 First successful daily build
- [ ] 🎊 First complete game (local)
- [ ] 🎊 First deployment to production
- [ ] 🎊 First external user completes game
- [ ] 🎊 100 daily active users
- [ ] 🎊 1000 games played
- [ ] 🎊 10K games played
- [ ] 🎊 Featured on a blog/newsletter

---

**Good luck building ClueLux! You've got this! 🚀**

---

**Quick Commands Reference:**
```bash
# Development
npm run dev                  # Start dev server
npm run build               # Build for production

# Data & Build
npm run extract-words       # Extract word lists
npm run create-master       # Create master words
npm run daily-build         # Generate daily challenge

# Testing
npm test                    # Run tests
npm run lint               # Lint code
```

**File Sizes Check:**
```bash
# Check bundle size
npm run build && ls -lh dist/assets/*.js

# Check data files
ls -lh src/data/words/*.json
```
