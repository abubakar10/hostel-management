# Supabase Database Setup Guide

## Step 1: Get Database Connection String from Supabase

1. Go to your Supabase project dashboard
2. Click on **Settings** (gear icon) in the left sidebar
3. Go to **Database** section
4. Scroll down to **Connection string**
5. Select **URI** tab
6. Copy the connection string (it will look like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.wmxugfajiqhfddxdpopo.supabase.co:5432/postgres
   ```
   **Important:** Replace `[YOUR-PASSWORD]` with your actual database password

## Step 2: Get Your Database Password

If you don't know your password:
1. Go to **Settings** → **Database**
2. Look for **Database password** section
3. If you forgot it, you can reset it (this will require updating the connection string)

## Step 3: Update Vercel Environment Variables

In your Vercel project settings:

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

   **Option A: Use Connection String (Recommended)**
   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.wmxugfajiqhfddxdpopo.supabase.co:5432/postgres?sslmode=require
   ```

   **Option B: Use Individual Variables**
   ```
   DB_USER=postgres
   DB_HOST=db.wmxugfajiqhfddxdpopo.supabase.co
   DB_NAME=postgres
   DB_PASSWORD=YOUR_PASSWORD
   DB_PORT=5432
   ```

   Also add:
   ```
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   NODE_ENV=production
   ```

## Step 4: Run Database Schema on Supabase

You have two options:

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to **SQL Editor** in Supabase dashboard
2. Click **New query**
3. Copy and paste the contents of `server/database/schema.sql`
4. Click **Run** to execute
5. Then run `server/database/multi-hostel-schema.sql` in the same way

### Option B: Using psql Command Line

```bash
psql "postgresql://postgres:YOUR_PASSWORD@db.wmxugfajiqhfddxdpopo.supabase.co:5432/postgres?sslmode=require" -f server/database/schema.sql
```

## Step 5: Create Admin User

After running the schema, create the admin user:

1. Go to **SQL Editor** in Supabase
2. Run this query (replace password hash with bcrypt hash of 'admin123'):

```sql
-- First, hash the password 'admin123' using bcrypt
-- You can use: https://bcrypt-generator.com/
-- Or run this in Node.js to get the hash

INSERT INTO users (username, email, password, role, hostel_id) 
VALUES (
  'admin', 
  'admin@hostel.com', 
  '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 
  'super_admin', 
  NULL
);
```

Or use the seed script locally (it will connect to Supabase if DATABASE_URL is set).

## Step 6: Test Connection

After setting up, test your API:
- `https://your-vercel-app.vercel.app/api/health` - Should return OK
- `https://your-vercel-app.vercel.app/api/auth/login` - Test login

## Important Notes

1. **SSL Required:** Supabase requires SSL connections, which is already handled in the updated `database.js`
2. **Password Security:** Never commit your database password to Git
3. **Connection Pooling:** Supabase provides connection pooling - the connection string already handles this
4. **Row Level Security:** Supabase has RLS enabled by default, but since we're using direct PostgreSQL connection, it won't affect us

## Quick Connection String Format

Your Supabase connection string should be:
```
postgresql://postgres:[PASSWORD]@db.wmxugfajiqhfddxdpopo.supabase.co:5432/postgres?sslmode=require
```

Replace `[PASSWORD]` with your actual Supabase database password.

