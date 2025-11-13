# Frontend-Backend Integration Guide

## Overview

The ClueLux frontend now fetches daily words and hints from the AWS backend API instead of using local JSON files.

## Architecture

```
Frontend (React + Vite)
    ↓ HTTP GET Request
API Gateway (/daily-word)
    ↓ Triggers
Lambda Function (getDailyWord)
    ↓ Queries
DynamoDB (ClueLuxWords table)
```

## Setup Instructions

### 1. Deploy the Backend

First, ensure the backend is deployed to AWS:

```bash
cd cluelux-backend

# Install dependencies (if not already done)
npm install

# Deploy the CDK stack
npm run cdk:deploy

# Note the API URL from the output:
# Outputs:
# ClueLuxStack.ApiUrl = https://abc123def.execute-api.us-east-1.amazonaws.com/prod/
# ClueLuxStack.DailyWordEndpoint = https://abc123def.execute-api.us-east-1.amazonaws.com/prod/daily-word
```

### 2. Configure Frontend

Update the frontend environment variables:

```bash
cd "Wordle-like Game Mocks"

# Copy the example env file
cp .env.example .env

# Edit .env and set your API URL
# VITE_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
```

### 3. Run Frontend

```bash
npm run dev
```

## API Service

The frontend uses a new API service located at `src/services/api.ts`:

### Key Functions:

**`fetchDailyWord()`**
- Fetches today's word from the backend API
- Returns: `{ date, word, hints, fact }`
- Falls back to error message if API unavailable

**`formatDailyWordForGame()`**
- Transforms API response into game format
- Calculates game number based on date
- Adds metadata for UI

## Changes Made

### Files Modified:

1. **`src/App.tsx`**
   - Added `useState` for `challenge` and `isLoading`
   - Added `useEffect` to fetch daily word on mount
   - Updated game initialization to wait for API response
   - Falls back to local `today.json` if API fails

2. **`src/services/api.ts`** (NEW)
   - API service for backend communication
   - Type-safe fetch functions
   - Error handling and fallbacks

3. **`.env.example`** (NEW)
   - Environment variable template
   - Instructions for configuration

## API Response Format

The backend returns:

```json
{
  "date": "2025-11-13",
  "word": "LIBRARY",
  "hints": [
    "A public institution dedicated to knowledge and learning 📚",
    "Students visit here to research papers and borrow materials",
    "Belle from Beauty and the Beast dreamed of having her own",
    "A building or room containing collections of books and resources",
    "Sounds like 'lie-brary' when mispronounced by young children"
  ],
  "fact": "The Library of Alexandria was one of the largest and most significant libraries of the ancient world."
}
```

## Testing

### Test Backend API Directly:

```bash
# Get today's word
curl https://your-api-id.execute-api.region.amazonaws.com/prod/daily-word
```

### Test Frontend with Local Backend:

If you want to run the backend locally for testing:

```bash
# In backend directory
sam local start-api --port 3000

# In frontend directory  
# Set VITE_API_URL=http://localhost:3000 in .env
npm run dev
```

## Fallback Behavior

If the API is unavailable:
1. Frontend shows toast notification: "Using offline word"
2. Falls back to local `src/data/today.json`
3. Game continues to function normally
4. User can play without internet connection

## Environment Variables

**Development:**
```env
VITE_API_URL=http://localhost:3000
```

**Production:**
```env
VITE_API_URL=https://your-api-id.execute-api.region.amazonaws.com/prod
```

## Troubleshooting

### Issue: "Could not connect to server"

**Causes:**
- Backend not deployed
- Wrong API URL in `.env`
- CORS issues
- Network connectivity

**Solutions:**
1. Check backend deployment status
2. Verify API URL is correct
3. Check browser console for errors
4. Verify DynamoDB has data for today's date

### Issue: "Invalid response format from API"

**Causes:**
- Backend returning wrong data structure
- Missing required fields

**Solutions:**
1. Check Lambda function logs in CloudWatch
2. Verify DynamoDB item structure
3. Test API endpoint directly with curl

### Issue: No word in DynamoDB for today

**Solutions:**
```bash
cd cluelux-backend

# Generate and upload words
CLAUDE_API_KEY=your_key NUM_WORDS=30 npm run generate:words
```

## Data Flow

1. **Page Load:**
   - `App.tsx` renders with loading state
   - `fetchDailyWord()` called
   - API request sent to `/daily-word`

2. **Backend Processing:**
   - Lambda gets today's date
   - Queries DynamoDB for matching date
   - Returns word + hints

3. **Frontend Updates:**
   - `formatDailyWordForGame()` transforms data
   - `setChallenge()` updates game state
   - Game initializes with new word
   - Loading state removed

4. **Error Handling:**
   - API fails → Toast notification
   - Fallback to local JSON
   - Game continues normally

## Next Steps

1. **Deploy Backend:**
   ```bash
   cd cluelux-backend
   npm run cdk:deploy
   ```

2. **Update Frontend Config:**
   ```bash
   cd "Wordle-like Game Mocks"
   echo "VITE_API_URL=<your-api-url>" > .env
   ```

3. **Test Integration:**
   ```bash
   npm run dev
   ```

4. **Verify:**
   - Open browser DevTools
   - Check Network tab for API call
   - Verify word loads from backend
   - Check Console for any errors

## Security Notes

- API has CORS enabled for all origins (update in production)
- No authentication required (add if needed)
- Rate limiting recommended for production
- Consider adding API key authentication

## Performance

- API response time: ~100-300ms
- Cached in browser for session
- LocalStorage persists game state
- Offline fallback ensures availability

## Monitoring

Monitor in AWS CloudWatch:
- Lambda invocations
- API Gateway requests
- DynamoDB queries
- Error rates

---

For backend details, see `cluelux-backend/README.md`
For word generation, see `cluelux-backend/WORD_GENERATION.md`
