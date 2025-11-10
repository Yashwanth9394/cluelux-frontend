# 🧩 ClueLux - AI-Powered Word Guessing Game

## 🎯 Project Vision
Transform a basic Wordle clone into **ClueLux** - a sophisticated daily word challenge game with AI-generated progressive hints. Fully static, zero backend, infinite scale.

---

## 📁 Project Structure

```
Wordle-like Game Mocks/  (Main Project - Clean UI)
├── src/
│   ├── components/       ✅ Good UI foundation
│   ├── utils/           ✅ Basic word validation
│   └── App.tsx          ✅ Core game structure
├── package.json         ✅ Modern dependencies
└── vite.config.ts       ✅ Fast build system

WordleAI/  (Reference Project - Logic Source)
├── src/
│   ├── constants/
│   │   ├── validGuesses_5.ts   📊 ~12,968 words
│   │   ├── validGuesses_6.ts   📊 ~22,160 words
│   │   ├── validGuesses_7.ts   📊 ~32,913 words
│   │   └── validGuesses_8.ts   📊 ~40,719 words
│   └── components/
│       └── grid/CompletedRow.tsx  💡 Hint system reference
└── firebase.js          🔥 OpenAI integration pattern
```

---

## 🎮 What We're Building

### Core Features
- ✅ **Daily Word Challenge**: New word every day at midnight
- ✅ **Multi-Length Support**: 5, 6, 7, and 8-letter words
- ✅ **Progressive AI Hints**: 5 hints that unlock after wrong guesses
- ✅ **100% Static**: No backend, runs entirely in browser
- ✅ **Smart Word Lists**: 100K+ valid words for validation
- ✅ **Persistent Stats**: Track wins, streaks, and performance
- ✅ **Beautiful Animations**: Tile flips, hint reveals, celebrations

### The Magic: Build-Time Generation
```
┌─────────────────────────────────────────┐
│  Midnight (Daily)                       │
│  GitHub Actions Trigger                 │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  1. Select unused word from master list │
│  2. Call OpenAI API for 5 hints         │
│  3. Bundle valid words for that length  │
│  4. Write src/data/today.json           │
│  5. Build static site with Vite         │
│  6. Deploy to Vercel/CloudFront         │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  Users visit site                       │
│  Load today.json (already embedded)     │
│  Play game 100% offline                 │
│  Zero API calls at runtime              │
└─────────────────────────────────────────┘
```

---

## 📚 Documentation

### 📖 [Full Project Plan](./CLUELUX_PROJECT_PLAN.md)
Comprehensive high-level and low-level design, including:
- Architecture overview
- Data schemas
- Animation specs
- OpenAI prompt engineering
- Cost estimates
- Success metrics

### 🛠️ [Implementation Strategy](./IMPLEMENTATION_STRATEGY.md)
Step-by-step implementation guide with:
- Phase-by-phase breakdown
- Complete code samples
- File structure
- Development order
- Testing strategy

---

## 🚀 Quick Start Guide

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
OpenAI API key
```

### Setup (After Implementation)
```bash
# 1. Clone and install
cd "Wordle-like Game Mocks"
npm install

# 2. Setup environment
cp .env.example .env
# Add your OPENAI_API_KEY

# 3. Extract word lists from WordleAI
npm run extract-words

# 4. Create master word list
npm run create-master

# 5. Generate first daily challenge
npm run daily-build

# 6. Run development server
npm run dev

# 7. Build for production
npm run build
```

---

## 🏗️ Implementation Phases

### ✅ Phase 1: Data Setup (Days 1-2)
- Extract word lists from WordleAI
- Create master_words.json with metadata
- Setup TypeScript types
- Create data directory structure

### ✅ Phase 2: Core Engine (Days 2-3)
- Build game engine (validation, evaluation)
- Implement hint manager (progressive unlock)
- Setup localStorage persistence
- Create keyboard state tracking

### ✅ Phase 3: Build Scripts (Days 3-5)
- OpenAI hint generator
- Word selector with rotation
- Data bundler (today.json)
- Main build orchestrator

### ✅ Phase 4: UI Enhancement (Days 5-7)
- Multi-length word support
- Hint display component
- Enhanced animations
- Responsive design

### ✅ Phase 5: Automation (Days 7-8)
- GitHub Actions workflow
- Daily cron job
- Auto-deployment
- Error notifications

### ✅ Phase 6: Testing & Launch (Days 8-10)
- Unit tests
- Integration tests
- Performance optimization
- Analytics setup
- Production deployment

---

## 💡 Key Technical Decisions

### Why Static?
- **Cost**: $0 hosting (Vercel free tier)
- **Speed**: Sub-second load times
- **Scale**: Handles millions of users
- **Reliability**: No server = no downtime
- **Simple**: Just push code, auto-deploys

### Why Daily Rebuild?
- **Fresh Content**: New challenge every day
- **AI Quality**: Time to generate perfect hints
- **Data Integrity**: Controlled word rotation
- **No CORS**: No runtime API calls
- **Security**: API keys never exposed

### Why Multi-Length?
- **Variety**: Keeps game interesting
- **Difficulty**: Natural progression (5→8 letters)
- **Replayability**: 4x more content
- **Market Fit**: Appeals to broader audience

---

## 📊 Data Architecture

### Master Words
- 500-1000 curated answer words
- Categorized (animals, objects, actions, etc.)
- Difficulty rated (easy, medium, hard)
- Usage tracking (avoid repeats)
- UUID-based identification

### Valid Words
- 108,000+ valid guesses across all lengths
- Sourced from WordleAI's comprehensive lists
- Pre-validated and deduplicated
- Optimized for fast lookup (Set)

### Daily Challenge
- Pre-generated each midnight
- Includes answer + 5 AI hints
- Bundles valid words for that length
- Embedded directly in static build

---

## 🎨 User Experience

### Game Flow
1. **Load**: Site loads instantly with today's challenge
2. **Play**: User guesses words, gets feedback
3. **Hints**: Unlock progressively after wrong guesses
4. **Win/Lose**: Celebration animation or reveal
5. **Stats**: View performance metrics
6. **Share**: Copy results to clipboard

### Hint Progression
| Word Length | Max Attempts | Hint Schedule |
|-------------|--------------|---------------|
| 5 letters   | 6 attempts   | 1,2,3,4,5     |
| 6 letters   | 7 attempts   | 1,2,3,4,5     |
| 7 letters   | 8 attempts   | 1,2,3,4,6     |
| 8 letters   | 9 attempts   | 1,2,4,6,8     |

### Hint Quality (AI-Generated)
```
Hint 1: 🌿 Broad thematic clue
Hint 2: 🎯 Contextual usage
Hint 3: 💭 Conceptual association
Hint 4: 🔊 Structural clue (rhyme, category)
Hint 5: 🔤 Letter-based hint (first/last)
```

---

## 📈 Success Metrics

### Technical KPIs
- ✅ Daily build success rate > 99%
- ✅ Page load time < 2 seconds
- ✅ Bundle size < 500KB gzipped
- ✅ Lighthouse score > 90

### User KPIs (via Analytics)
- Daily Active Users (DAU)
- Game completion rate
- Average hints used per game
- Win rate by word length
- Share/viral coefficient

---

## 💰 Operating Costs

### Monthly Budget
| Service | Cost |
|---------|------|
| Vercel Hosting | $0 (free tier) |
| Domain (cluelux.com) | $1-2/mo |
| OpenAI API | $5-20/mo (30 calls) |
| Analytics | $0 (GA4 free) |
| **Total** | **$6-22/month** |

### Scalability
- Handles 1M users/day on free tier
- Zero additional cost per user
- Static CDN = infinite scale
- No database costs

---

## 🔧 Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** for blazing fast builds
- **Radix UI** for accessible components
- **Tailwind CSS** for styling
- **Framer Motion** for animations

### Build System
- **Node.js** scripts
- **OpenAI GPT-4** for hint generation
- **Zod** for schema validation
- **date-fns** for date handling

### Deployment
- **GitHub Actions** for automation
- **Vercel** for hosting (or AWS S3+CloudFront)
- **Google Analytics** for tracking

---

## 🎯 MVP Scope

### Must Have (Launch)
- [x] 5-letter word support
- [ ] Daily word rotation
- [ ] 5 progressive hints
- [ ] Win/loss tracking
- [ ] Share functionality
- [ ] Responsive design
- [ ] Keyboard support

### Nice to Have (v1.1)
- [ ] 6, 7, 8-letter support
- [ ] Statistics dashboard
- [ ] Streak tracking
- [ ] Dark mode
- [ ] Sound effects

### Future Features (v2.0+)
- [ ] Hard mode (must use hints)
- [ ] Multiple categories
- [ ] Social leaderboard
- [ ] Mobile app wrapper
- [ ] Multilingual support

---

## 🚦 Current Status

### ✅ Completed
- Project analysis and documentation
- Architecture design
- Implementation strategy
- Data extraction plan

### 🔄 In Progress
- Setting up data structure
- Creating core game engine

### ⏳ Todo
- Build automation scripts
- UI component updates
- Testing and deployment

---

## 📞 Next Steps

1. **Read**: [CLUELUX_PROJECT_PLAN.md](./CLUELUX_PROJECT_PLAN.md)
2. **Review**: [IMPLEMENTATION_STRATEGY.md](./IMPLEMENTATION_STRATEGY.md)
3. **Start**: Phase 1 - Data Setup
4. **Build**: Follow implementation phases
5. **Deploy**: GitHub Actions + Vercel
6. **Launch**: Share on Product Hunt

---

## 🤝 Contributing

This is a personal project, but suggestions welcome! Key areas:
- Word list curation
- Hint quality improvement
- UI/UX enhancements
- Performance optimization

---

## 📄 License

MIT License - Feel free to fork and customize!

---

## 🎉 Let's Build ClueLux!

**Next Command:**
```bash
# Start with data extraction
npm run extract-words
```

**Questions?** Check the detailed docs linked above.

**Ready to code?** Let's transform Wordle-like Game Mocks into ClueLux! 🚀
