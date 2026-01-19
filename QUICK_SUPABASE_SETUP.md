# Quick Supabase Setup Guide

## Your Supabase Project Details
- **Project URL:** `https://wmxugfajiqhfddxdpopo.supabase.co`
- **Database Host:** `db.wmxugfajiqhfddxdpopo.supabase.co`

## Step-by-Step Setup

### 1. Get Your Database Password

1. Go to Supabase Dashboard
2. Click **Settings** (gear icon) → **Database**
3. Find **Database password** section
4. If you don't remember it, click **Reset database password**
5. Copy the password

### 2. Get Connection String

1. In **Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **URI** tab
4. Copy the connection string
5. It will look like:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
   
   **OR use the direct connection:**
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.wmxugfajiqhfddxdpopo.supabase.co:5432/postgres
   ```

### 3. Update Local .env File

Edit `server/.env` and add:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.wmxugfajiqhfddxdpopo.supabase.co:5432/postgres?sslmode=require
```

Replace `YOUR_PASSWORD` with your actual Supabase database password.

### 4. Run Database Setup

```powershell
cd "C:\Users\MalikAbubakarShafeeq\Desktop\hostel management system\server"
node database/setup-supabase.js
```

This will:
- ✅ Create all tables
- ✅ Set up multi-hostel schema
- ✅ Create admin user (username: `admin`, password: `admin123`)

### 5. Update Vercel Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add:
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.wmxugfajiqhfddxdpopo.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=production
```

**Important:** Replace `YOUR_PASSWORD` with your actual password.

### 6. Redeploy on Vercel

After adding environment variables, Vercel will automatically redeploy, or you can trigger a manual redeploy.

## Alternative: Use Supabase SQL Editor

If you prefer to run SQL manually:

1. Go to **SQL Editor** in Supabase
2. Click **New query**
3. Copy contents of `server/database/schema.sql` and run it
4. Then copy contents of `server/database/multi-hostel-schema.sql` and run it
5. Create admin user manually (see SUPABASE_SETUP.md for SQL)

## Test Connection

After setup, test your API:
- Local: `http://localhost:5000/api/health`
- Vercel: `https://your-app.vercel.app/api/health`

## Troubleshooting

### Connection Refused
- Check your password is correct
- Ensure connection string includes `?sslmode=require`
- Verify database host is correct

### Authentication Failed
- Reset your database password in Supabase
- Update connection string with new password

### Tables Not Found
- Run the setup script again
- Or manually run SQL in Supabase SQL Editor

