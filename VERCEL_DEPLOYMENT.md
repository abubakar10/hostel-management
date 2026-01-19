# Vercel Backend Deployment Guide

## Configuration Files Created

1. **`server/vercel.json`** - Vercel configuration for serverless functions
2. **`server/api/index.js`** - Serverless function entry point
3. **Updated `server/index.js`** - Export app for Vercel
4. **Updated `server/package.json`** - Added vercel-build script

## Vercel Deployment Steps

### 1. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
cd server
npm install -g vercel
vercel
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. **Important:** Set the **Root Directory** to `server`
5. Configure:
   - Framework Preset: Other
   - Root Directory: `server`
   - Build Command: (leave empty or `npm run vercel-build`)
   - Output Directory: (leave empty)
   - Install Command: `npm install`

### 2. Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
DB_USER=postgres
DB_HOST=your-database-host
DB_NAME=hostel_management
DB_PASSWORD=your-database-password
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=production
```

**Important:** For Vercel, you'll need a hosted PostgreSQL database:
- **Neon** (recommended) - Free PostgreSQL: https://neon.tech
- **Supabase** - Free PostgreSQL: https://supabase.com
- **Railway** - PostgreSQL hosting: https://railway.app
- **Render** - PostgreSQL hosting: https://render.com

### 3. Database Setup

After getting a hosted PostgreSQL database:

1. **Update environment variables** in Vercel with your database credentials
2. **Run the schema** on your hosted database:
   ```sql
   -- Connect to your hosted database and run:
   -- server/database/schema.sql
   -- server/database/multi-hostel-schema.sql
   ```
3. **Create admin user:**
   ```sql
   -- Run server/database/seed.js or manually create admin
   ```

### 4. Update Frontend API URL

After backend is deployed, update frontend to use the Vercel backend URL:

**Option A: Environment Variable**
Create `client/.env.production`:
```
VITE_API_URL=https://your-backend.vercel.app
```

**Option B: Update axios base URL**
In `client/src/context/AuthContext.jsx` or create an API config file.

## Vercel Configuration Details

### vercel.json
- Routes all requests to `/api/index.js`
- Uses `@vercel/node` runtime
- Sets production environment

### api/index.js
- Serverless function entry point
- Imports and exports the Express app

### index.js Changes
- Exports the app for Vercel
- Only starts HTTP server if not in Vercel environment
- Initializes database connection for Vercel

## Troubleshooting

### "Cannot GET /" Error

This usually means:
1. **Root directory not set correctly** - Must be `server` in Vercel settings
2. **Routes not configured** - Check `vercel.json` routes
3. **Entry point wrong** - Should be `api/index.js`

### Database Connection Errors

1. **Check environment variables** are set in Vercel
2. **Verify database allows connections** from Vercel IPs
3. **Check database host** - Use full connection string if needed
4. **SSL connection** - Some databases require SSL, update connection string

### Function Timeout

Vercel has execution time limits:
- Hobby: 10 seconds
- Pro: 60 seconds

If operations take longer, consider:
- Optimizing database queries
- Using background jobs
- Upgrading Vercel plan

## Recommended Database Setup

### Using Neon (Free PostgreSQL)

1. Sign up at https://neon.tech
2. Create a new project
3. Copy connection string
4. Update Vercel environment variables:
   ```
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   ```
5. Update `server/config/database.js` to use `DATABASE_URL` if provided

## Testing Deployment

After deployment, test endpoints:
- `https://your-backend.vercel.app/api/health`
- `https://your-backend.vercel.app/api/auth/login`

## Next Steps

1. Deploy backend to Vercel
2. Set up hosted PostgreSQL database
3. Configure environment variables
4. Run database migrations
5. Update frontend API URL
6. Test full application

