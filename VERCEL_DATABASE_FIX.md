# Fix: Database Connection Error on Vercel

## Problem
Getting `getaddrinfo ENOTFOUND db.wmxugfajiqhfddxdpopo.supabase.co` error when trying to connect from Vercel.

## Solution Options

### Option 1: Use Supabase Connection Pooler (Recommended for Vercel)

For serverless functions like Vercel, use Supabase's **connection pooler** instead of direct connection:

**Update your Vercel `DATABASE_URL` to:**

```
postgresql://postgres.wmxugfajiqhfddxdpopo:VEHnhNqble194hH0@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**Key differences:**
- Port: `6543` (pooler) instead of `5432` (direct)
- Host: `aws-0-us-east-1.pooler.supabase.com` (pooler) instead of `db.wmxugfajiqhfddxdpopo.supabase.co` (direct)
- User: `postgres.wmxugfajiqhfddxdpopo` (with project ref) instead of just `postgres`

### Option 2: Get Your Pooler URL from Supabase Dashboard

1. Go to Supabase Dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string**
5. Select **Connection pooling** tab
6. Copy the **Transaction** mode connection string
7. Update `DATABASE_URL` in Vercel with this value

### Option 3: Check Supabase Project Settings

1. Make sure your Supabase project is **active** (not paused)
2. Check if there are any IP restrictions
3. Verify the password is correct

## Steps to Fix

1. **Get the pooler connection string from Supabase Dashboard**
2. **Update Vercel Environment Variable:**
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Update `DATABASE_URL` with the pooler connection string
   - Make sure to remove any trailing spaces
3. **Redeploy Vercel:**
   - Go to Deployments
   - Click the three dots on latest deployment
   - Select "Redeploy"
4. **Test again**

## Why Pooler?

- **Direct connection (5432)**: Limited concurrent connections, can timeout in serverless
- **Pooler (6543)**: Handles many concurrent connections, optimized for serverless functions

The pooler is specifically designed for serverless environments like Vercel where functions start and stop frequently.

