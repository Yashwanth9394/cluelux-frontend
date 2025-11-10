# 🎯 ClueLux - Project Roadmap & Flow Diagram

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                         🧩 CLUELUX PROJECT                                ║
║               AI-Powered Word Guessing with Progressive Hints             ║
╚═══════════════════════════════════════════════════════════════════════════╝


┌───────────────────────────────────────────────────────────────────────────┐
│                        📊 CURRENT STATE                                   │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  PROJECT 1: Wordle-like Game Mocks                                       │
│  ├─ ✅ Clean modern UI (Radix UI)                                        │
│  ├─ ✅ React + TypeScript + Vite                                         │
│  ├─ ✅ Basic game mechanics (5-letter)                                   │
│  └─ ✅ Good component structure                                          │
│                                                                           │
│  PROJECT 2: WordleAI                                                     │
│  ├─ ✅ OpenAI hint integration (Firebase)                                │
│  ├─ ✅ Multi-length support (5-8 letters)                                │
│  ├─ ✅ 108K+ valid words across lengths                                  │
│  └─ ✅ Progressive hint system                                           │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                     🎯 TARGET ARCHITECTURE                                │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│                    ┌────────────────────────┐                            │
│                    │   GitHub Repository    │                            │
│                    │  (Source Code + Data)  │                            │
│                    └───────────┬────────────┘                            │
│                                │                                          │
│                                ▼                                          │
│              ┌─────────────────────────────────┐                         │
│              │   GitHub Actions (Cron)         │                         │
│              │   Runs Daily at Midnight UTC    │                         │
│              └────────────┬────────────────────┘                         │
│                           │                                               │
│          ┌────────────────┼────────────────┐                            │
│          ▼                ▼                ▼                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐                         │
│   │  Select  │    │ Generate │    │  Bundle  │                         │
│   │   Word   │───▶│  5 Hints │───▶│   Data   │                         │
│   │          │    │ (OpenAI) │    │  (JSON)  │                         │
│   └──────────┘    └──────────┘    └─────┬────┘                         │
│                                          │                                │
│                                          ▼                                │
│                              ┌───────────────────┐                       │
│                              │   Build Static    │                       │
│                              │   Site (Vite)     │                       │
│                              └─────────┬─────────┘                       │
│                                        │                                  │
│                                        ▼                                  │
│                             ┌──────────────────┐                         │
│                             │  Deploy to CDN   │                         │
│                             │ (Vercel/S3+CF)   │                         │
│                             └────────┬─────────┘                         │
│                                      │                                    │
│                                      ▼                                    │
│                           ┌─────────────────────┐                        │
│                           │   🌐 Production     │                        │
│                           │   (Static Site)     │                        │
│                           └─────────────────────┘                        │
│                                      │                                    │
│                                      ▼                                    │
│                             ┌─────────────────┐                          │
│                             │   👥 Users      │                          │
│                             │   Play Game     │                          │
│                             │   (100% Offline)│                          │
│                             └─────────────────┘                          │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                      📅 IMPLEMENTATION TIMELINE                           │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Week 1: Foundation                                                       │
│  ├─ Day 1-2:  📊 Phase 1: Data Setup                                     │
│  │            • Extract word lists from WordleAI                          │
│  │            • Create master_words.json (500+ words)                     │
│  │            • Setup TypeScript types                                    │
│  │                                                                        │
│  ├─ Day 2-3:  🎮 Phase 2: Core Game Engine                               │
│  │            • Build validation engine                                   │
│  │            • Create game engine (evaluate, win check)                  │
│  │            • Implement hint manager                                    │
│  │            • Setup localStorage                                        │
│  │                                                                        │
│  └─ Day 3-5:  🤖 Phase 3: Build Scripts                                  │
│               • OpenAI hint generator                                     │
│               • Word selector with rotation                               │
│               • Data bundler (today.json)                                 │
│               • Main build orchestrator                                   │
│                                                                           │
│  Week 2: Polish & Launch                                                  │
│  ├─ Day 5-7:  🎨 Phase 4: UI Enhancement                                 │
│  │            • Update GameBoard for multi-length                         │
│  │            • Create HintDisplay component                              │
│  │            • Enhanced animations                                       │
│  │            • Responsive design                                         │
│  │                                                                        │
│  ├─ Day 7-8:  ⚙️  Phase 5: Automation                                    │
│  │            • GitHub Actions workflow                                   │
│  │            • Daily cron job setup                                      │
│  │            • Auto-deployment pipeline                                  │
│  │            • Error notifications                                       │
│  │                                                                        │
│  └─ Day 8-10: ✅ Phase 6: Testing & Launch                               │
│               • Unit & integration tests                                  │
│               • Performance optimization                                  │
│               • Analytics setup                                           │
│               • Production deployment                                     │
│               • 🚀 GO LIVE!                                               │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                       💾 DATA FLOW DIAGRAM                                │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────┐                                                  │
│  │ master_words.json  │  (500-1000 words with metadata)                  │
│  │ ├─ id: uuid        │                                                  │
│  │ ├─ word: string    │                                                  │
│  │ ├─ length: 5-8     │                                                  │
│  │ ├─ category: str   │                                                  │
│  │ ├─ used: boolean   │                                                  │
│  │ └─ lastUsed: date  │                                                  │
│  └─────────┬──────────┘                                                  │
│            │                                                              │
│            ▼ (Select one unused word)                                    │
│  ┌──────────────────┐                                                    │
│  │ daily_build.ts   │                                                    │
│  └─────────┬────────┘                                                    │
│            │                                                              │
│            ▼ (Generate hints)                                            │
│  ┌──────────────────┐                                                    │
│  │ OpenAI GPT-4 API │                                                    │
│  │ Returns: [5 hints]│                                                   │
│  └─────────┬────────┘                                                    │
│            │                                                              │
│            ▼ (Bundle with valid words)                                   │
│  ┌──────────────────┐                                                    │
│  │ today.json       │  (Generated daily)                                 │
│  │ ├─ date: string  │                                                    │
│  │ ├─ gameNumber    │                                                    │
│  │ ├─ wordLength    │                                                    │
│  │ ├─ answer: str   │                                                    │
│  │ ├─ hints: [5]    │                                                    │
│  │ └─ validWords[]  │                                                    │
│  └─────────┬────────┘                                                    │
│            │                                                              │
│            ▼ (Embedded in build)                                         │
│  ┌──────────────────┐                                                    │
│  │ Frontend App     │                                                    │
│  │ ├─ Loads today   │                                                    │
│  │ ├─ Validates     │                                                    │
│  │ ├─ Shows hints   │                                                    │
│  │ └─ Saves state   │                                                    │
│  └──────────────────┘                                                    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                        🎮 GAME FLOW DIAGRAM                               │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  User Opens Site                                                          │
│       │                                                                   │
│       ▼                                                                   │
│  Load today.json ────────┐                                               │
│       │                  │                                                │
│       ▼                  ▼                                                │
│  Check localStorage    Parse Challenge Data                              │
│       │                  │                                                │
│       ├─ Exists?        │                                                 │
│       │   └─ Yes ──────▶│ Restore Game State                            │
│       │   └─ No ───────▶│ Initialize New Game                           │
│       │                  │                                                │
│       ▼                  ▼                                                │
│  ┌─────────────────────────────────────┐                                │
│  │        GAME LOOP (Playing)          │                                 │
│  ├─────────────────────────────────────┤                                │
│  │  1. User types guess                │                                 │
│  │  2. Press Enter                     │                                 │
│  │      │                               │                                 │
│  │      ├─ Too short? → Show error     │                                 │
│  │      ├─ Invalid?   → Shake + error  │                                 │
│  │      ├─ Valid!     → Evaluate       │                                 │
│  │           │                          │                                 │
│  │           ├─ All correct? → WIN!    │                                 │
│  │           │                          │                                 │
│  │           ├─ Wrong guess             │                                 │
│  │           │   ├─ Update tiles        │                                 │
│  │           │   ├─ Update keyboard     │                                 │
│  │           │   ├─ Unlock hint?        │                                 │
│  │           │   └─ Save state          │                                 │
│  │           │                          │                                 │
│  │           └─ Max attempts? → LOSE   │                                 │
│  └─────────────────────────────────────┘                                │
│       │                  │                                                │
│       ▼                  ▼                                                │
│   🏆 WIN            ❌ LOSE                                               │
│       │                  │                                                │
│       ├─ Celebration     ├─ Reveal answer                                │
│       ├─ Update stats    ├─ Update stats                                 │
│       ├─ Save stats      ├─ Save stats                                   │
│       └─ Share button    └─ Share button                                 │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                    💡 HINT PROGRESSION SYSTEM                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Word: "SERPENT" (7 letters)                                              │
│  Max Attempts: 8                                                          │
│  Hint Schedule: [1, 2, 3, 4, 6]                                          │
│                                                                           │
│  Attempt  │ Result  │ Hint Unlocked                                      │
│  ────────┼─────────┼───────────────────────────────────────────────      │
│     1     │  Wrong  │ 🌿 Found in myths and jungles                      │
│     2     │  Wrong  │ 🐍 Often feared, but rarely seen                   │
│     3     │  Wrong  │ ✨ Sheds its skin to renew itself                  │
│     4     │  Wrong  │ ⚕️  A symbol of deception and healing              │
│     5     │  Wrong  │ (no new hint)                                      │
│     6     │  Wrong  │ 🔤 Starts with 'S', ends with 'T'                  │
│     7     │  Wrong  │ (no new hint)                                      │
│     8     │  Wrong  │ GAME OVER - Answer revealed                        │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │ Hint States:                                                 │        │
│  │ • 🔒 Locked   - Not yet unlocked (gray)                      │        │
│  │ • 🔓 Unlocked - Available to reveal (blue)                   │        │
│  │ • 👁️  Revealed - User clicked to see hint (bright blue)      │        │
│  └─────────────────────────────────────────────────────────────┘        │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                      🚀 DEPLOYMENT PIPELINE                               │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Trigger: Cron Schedule (Daily at 00:00 UTC)            │            │
│  │          OR Manual (workflow_dispatch)                   │            │
│  └─────────────────┬───────────────────────────────────────┘            │
│                    │                                                      │
│                    ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Step 1: Checkout code from GitHub                      │            │
│  └─────────────────┬───────────────────────────────────────┘            │
│                    │                                                      │
│                    ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Step 2: Setup Node.js 18                               │            │
│  └─────────────────┬───────────────────────────────────────┘            │
│                    │                                                      │
│                    ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Step 3: Install dependencies (npm ci)                  │            │
│  └─────────────────┬───────────────────────────────────────┘            │
│                    │                                                      │
│                    ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Step 4: Run daily_build.ts                             │            │
│  │          • Select word                                   │            │
│  │          • Generate hints (OpenAI)                       │            │
│  │          • Create today.json                             │            │
│  └─────────────────┬───────────────────────────────────────┘            │
│                    │                                                      │
│                    ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Step 5: Commit updated files                           │            │
│  │          • today.json                                    │            │
│  │          • master_words.json (usage tracking)            │            │
│  └─────────────────┬───────────────────────────────────────┘            │
│                    │                                                      │
│                    ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Step 6: Build static site (npm run build)              │            │
│  └─────────────────┬───────────────────────────────────────┘            │
│                    │                                                      │
│                    ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  Step 7: Deploy to Vercel                               │            │
│  │          OR Sync to S3 + Invalidate CloudFront          │            │
│  └─────────────────┬───────────────────────────────────────┘            │
│                    │                                                      │
│                    ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐            │
│  │  ✅ Success: New challenge live!                        │            │
│  │  ❌ Failure: Send notification (email/Slack)            │            │
│  └─────────────────────────────────────────────────────────┘            │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                         📊 KEY METRICS                                    │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  TECHNICAL METRICS                                                        │
│  ├─ Build Success Rate:   > 99%                                          │
│  ├─ Page Load Time:       < 2 seconds                                    │
│  ├─ Bundle Size:          < 500KB (gzipped)                              │
│  ├─ Time to Interactive:  < 3 seconds                                    │
│  └─ Lighthouse Score:     > 90 (all categories)                          │
│                                                                           │
│  USER METRICS (via Google Analytics)                                     │
│  ├─ Daily Active Users (DAU)                                             │
│  ├─ Game Completion Rate                                                 │
│  ├─ Average Hints Used Per Game                                          │
│  ├─ Win Rate by Word Length                                              │
│  ├─ Share/Viral Coefficient                                              │
│  └─ Average Time to Complete                                             │
│                                                                           │
│  COST METRICS                                                             │
│  ├─ Hosting:        $0/month (Vercel free tier)                          │
│  ├─ Domain:         $1-2/month                                           │
│  ├─ OpenAI API:     $5-20/month (30 calls)                               │
│  └─ Total:          $6-22/month                                          │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                    📚 DOCUMENTATION INDEX                                 │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. README_CLUELUX.md (THIS FILE)                                        │
│     └─ Project overview & quick start guide                              │
│                                                                           │
│  2. CLUELUX_PROJECT_PLAN.md                                              │
│     └─ Complete HLD/LLD specification                                    │
│        ├─ Architecture design                                            │
│        ├─ Data schemas                                                   │
│        ├─ Animation specs                                                │
│        ├─ OpenAI prompts                                                 │
│        └─ Cost & metrics                                                 │
│                                                                           │
│  3. IMPLEMENTATION_STRATEGY.md                                           │
│     └─ Step-by-step implementation guide                                 │
│        ├─ Phase breakdowns                                               │
│        ├─ Code samples                                                   │
│        ├─ File structure                                                 │
│        └─ Testing strategy                                               │
│                                                                           │
│  4. QUICK_REFERENCE.md                                                   │
│     └─ Cheat sheet for quick lookup                                      │
│        ├─ Commands                                                       │
│        ├─ File locations                                                 │
│        ├─ Key concepts                                                   │
│        └─ Debugging tips                                                 │
│                                                                           │
│  5. PROJECT_ROADMAP.md (THIS FILE)                                       │
│     └─ Visual diagrams & timelines                                       │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


┌───────────────────────────────────────────────────────────────────────────┐
│                       🎯 NEXT ACTIONS                                     │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  IMMEDIATE (Today):                                                       │
│  ☐ Read CLUELUX_PROJECT_PLAN.md (45 min)                                │
│  ☐ Review IMPLEMENTATION_STRATEGY.md (30 min)                           │
│  ☐ Setup development environment                                         │
│  ☐ Install dependencies                                                  │
│                                                                           │
│  SHORT TERM (This Week):                                                  │
│  ☐ Phase 1: Extract word lists from WordleAI                            │
│  ☐ Phase 2: Build core game engine                                       │
│  ☐ Phase 3: Create build scripts                                         │
│  ☐ Test locally with sample data                                         │
│                                                                           │
│  MEDIUM TERM (Next Week):                                                 │
│  ☐ Phase 4: Update UI components                                         │
│  ☐ Phase 5: Setup GitHub Actions                                         │
│  ☐ Phase 6: Testing & optimization                                       │
│  ☐ Deploy to production                                                  │
│                                                                           │
│  LONG TERM (Post-Launch):                                                 │
│  ☐ Monitor analytics                                                     │
│  ☐ Collect user feedback                                                 │
│  ☐ Add P1 features (6-8 letter words)                                   │
│  ☐ Marketing & growth                                                    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘


╔═══════════════════════════════════════════════════════════════════════════╗
║                        🚀 LET'S BUILD CLUELUX!                           ║
║                                                                           ║
║  Ready to transform a basic Wordle clone into a sophisticated            ║
║  AI-powered daily challenge game that scales infinitely!                 ║
║                                                                           ║
║  Start here: cd "Wordle-like Game Mocks" && npm install                  ║
║  Then follow: IMPLEMENTATION_STRATEGY.md Phase 1                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```
