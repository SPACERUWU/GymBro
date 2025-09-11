# 🚀 GymBro Deployment Guide

## Quick Deploy Options

### Option 1: Vercel + Railway (Recommended)

#### Frontend (Vercel):
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import repository: `SPACERUWU/GmBro`
4. Root directory: `frontend`
5. Build command: `npm run build`
6. Output directory: `dist`
7. Environment variables:
   - `VITE_API_URL`: `https://your-railway-backend-url.railway.app/api`

#### Backend (Railway):
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project from GitHub repo
4. Add service from GitHub repo
5. Root directory: `backend`
6. Environment variables:
   - `PORT`: `3001`
   - `NODE_ENV`: `production`

### Option 2: Netlify + Render

#### Frontend (Netlify):
1. Go to [netlify.com](https://netlify.com)
2. Connect GitHub repo
3. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
4. Environment variables:
   - `VITE_API_URL`: `https://your-render-backend-url.onrender.com/api`

#### Backend (Render):
1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Settings:
   - Root directory: `backend`
   - Build command: `npm run build`
   - Start command: `npm start`
5. Environment variables:
   - `NODE_ENV`: `production`

### Option 3: Full Stack on Railway

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add two services:
   - **Frontend Service:**
     - Root directory: `frontend`
     - Build command: `npm run build`
     - Start command: `npm run preview`
   - **Backend Service:**
     - Root directory: `backend`
     - Start command: `npm start`

## Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=./gymbro.db
```

## Database Setup

The app uses SQLite which will be automatically created on first run. No additional database setup required!

## Features Included

✅ Push/Pull/Legs/Rest workout splits
✅ Workout logging and tracking
✅ Calendar with real-time updates
✅ Exercise management
✅ Statistics and progress tracking
✅ AI chat integration
✅ Responsive design

## Post-Deployment

1. Test all features work correctly
2. Check that calendar updates properly
3. Verify workout data persists
4. Test AI chat functionality (requires Gemini API key)

## Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables are set
3. Ensure both frontend and backend are deployed
4. Check CORS settings if API calls fail
