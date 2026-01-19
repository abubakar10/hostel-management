# Netlify Deployment Guide

## Configuration Files Created

1. **`netlify.toml`** (root) - Main Netlify configuration
2. **`client/netlify.toml`** - Client-specific configuration
3. **`.nvmrc`** - Node version specification (Node 20)
4. **`client/.nvmrc`** - Client Node version specification

## Netlify Build Settings

### In Netlify Dashboard:

1. **Base directory:** `client`
2. **Build command:** `npm install --legacy-peer-deps && npm run build`
3. **Publish directory:** `client/dist`
4. **Node version:** `20` (set via .nvmrc)

### Environment Variables (if needed):

Add these in Netlify Dashboard → Site settings → Environment variables:

- `NODE_VERSION=20`
- `NPM_FLAGS=--legacy-peer-deps`

## Important Notes

1. **Backend API:** The frontend expects the backend API at `/api`. For production:
   - Deploy backend separately (Heroku, Railway, Render, etc.)
   - Update API base URL in frontend to point to backend URL
   - Or use Netlify Functions for API endpoints

2. **Database:** The backend requires PostgreSQL. You'll need to:
   - Deploy backend separately with database connection
   - Or use serverless functions with database connection

3. **Build Issues:** If you still get dependency errors:
   - Check Netlify build logs for specific package errors
   - Ensure `package-lock.json` is committed
   - Try clearing Netlify build cache

## Deployment Steps

1. **Push code to GitHub** (already done)
2. **Connect to Netlify:**
   - Go to Netlify Dashboard
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub repository
   - Select repository: `abubakar10/hostel-management`

3. **Configure Build Settings:**
   - Base directory: `client`
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Publish directory: `client/dist`

4. **Set Environment Variables** (if needed):
   - `NODE_VERSION=20`
   - `NPM_FLAGS=--legacy-peer-deps`

5. **Deploy:**
   - Click "Deploy site"
   - Wait for build to complete

## Troubleshooting

### If build fails with dependency errors:

1. Check Netlify build logs for specific error
2. Ensure all `package-lock.json` files are committed
3. Try updating Node version in `.nvmrc` if needed
4. Clear Netlify build cache and retry

### If API calls fail:

The frontend is configured to proxy `/api` to `localhost:5000` in development.
For production, you need to:
- Deploy backend separately
- Update API base URL in `client/src/context/AuthContext.jsx` or use environment variables

### Recommended Backend Deployment Options:

1. **Railway** - Easy PostgreSQL + Node.js deployment
2. **Render** - Free tier available, PostgreSQL support
3. **Heroku** - Classic option, requires credit card
4. **DigitalOcean App Platform** - Simple deployment

## Next Steps After Frontend Deployment:

1. Deploy backend to a hosting service
2. Update frontend API base URL to backend URL
3. Set up environment variables for API URL
4. Test the full application

