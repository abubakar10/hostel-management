# Deployment Guide: Connecting Frontend (Netlify) to Backend (Vercel)

## Overview
This guide explains how to connect your frontend hosted on Netlify to your backend hosted on Vercel.

## Step 1: Get Your Vercel Backend URL

1. Go to your Vercel dashboard
2. Select your backend project
3. Copy the deployment URL (e.g., `https://hostel-management-backend.vercel.app`)

## Step 2: Configure Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your frontend project
3. Go to **Site settings** → **Environment variables**
4. Add a new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: Your Vercel backend URL (e.g., `https://hostel-management-backend.vercel.app`)
5. Click **Save**

## Step 3: Configure Vercel Environment Variables

1. Go to your Vercel dashboard
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

   ```
   DATABASE_URL=postgresql://postgres:VEHnhNqble194hH0@db.wmxugfajiqhfddxdpopo.supabase.co:5432/postgres?sslmode=require
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRE=7d
   NODE_ENV=production
   FRONTEND_URL=https://your-netlify-site.netlify.app
   ```

5. Click **Save** for each variable

## Step 4: Update Frontend Code

The frontend has been updated to use the `VITE_API_URL` environment variable. All API calls will automatically use:
- **Development**: `http://localhost:5000` (via Vite proxy)
- **Production**: Your Vercel URL (from `VITE_API_URL`)

## Step 5: Rebuild and Redeploy

### Netlify:
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

### Vercel:
1. Push any changes to your repository
2. Vercel will automatically redeploy

## Step 6: Test the Connection

1. Open your Netlify site
2. Try to login with your admin credentials
3. Check the browser console (F12) for any CORS errors
4. If you see CORS errors, verify:
   - Your Netlify URL is added to Vercel's `FRONTEND_URL` environment variable
   - The CORS configuration in `server/index.js` includes your domain

## Troubleshooting

### CORS Errors
If you see CORS errors:
1. Check that your Netlify URL is in the `FRONTEND_URL` environment variable on Vercel
2. Verify the CORS configuration in `server/index.js` allows your domain
3. Make sure you've redeployed both frontend and backend after adding environment variables

### 404 Errors on API Calls
1. Verify `VITE_API_URL` is set correctly in Netlify
2. Check that your Vercel backend URL is correct
3. Test the backend URL directly: `https://your-backend.vercel.app/api/health`

### Database Connection Issues
1. Verify `DATABASE_URL` is set in Vercel
2. Make sure you've run the SQL setup script in Supabase
3. Check Supabase connection settings

## Quick Checklist

- [ ] Vercel backend URL copied
- [ ] `VITE_API_URL` set in Netlify
- [ ] `DATABASE_URL` set in Vercel
- [ ] `JWT_SECRET` set in Vercel
- [ ] `FRONTEND_URL` set in Vercel (your Netlify URL)
- [ ] Both sites redeployed
- [ ] Tested login functionality
- [ ] Verified data loads correctly

## Default Admin Credentials

After running the database setup:
- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change these credentials after first login!

