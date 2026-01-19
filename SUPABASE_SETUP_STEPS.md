# Step-by-Step: Setup Supabase Database

## ✅ Quick Setup (5 minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: **abubakar10's Project**
3. In the left sidebar, click **SQL Editor** (or go to: https://supabase.com/dashboard/project/wmxugfajiqhfddxdpopo/sql/new)

### Step 2: Run the SQL Script

1. Click **"New query"** button (top right)
2. Open the file `SUPABASE_SQL_SETUP.sql` from your project
3. **Copy the ENTIRE contents** of the file
4. **Paste it into the SQL Editor** in Supabase
5. Click **"Run"** button (or press `Ctrl+Enter`)

### Step 3: Verify Tables Were Created

1. Go to **Table Editor** in the left sidebar
2. You should now see these tables:
   - ✅ users
   - ✅ hostels
   - ✅ students
   - ✅ rooms
   - ✅ room_types
   - ✅ staff
   - ✅ fees
   - ✅ attendance
   - ✅ complaints
   - ✅ notifications
   - ✅ expenses
   - ✅ maintenance_requests

### Step 4: Verify Admin User

1. In **Table Editor**, click on the **users** table
2. You should see one user:
   - Username: `admin`
   - Email: `admin@hostel.com`
   - Role: `super_admin`

### Step 5: Get Connection Pooler URL (For Vercel)

1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Click **"Connection pooling"** tab
4. Select **"Transaction"** mode
5. Copy the connection string
6. It should look like:
   ```
   postgresql://postgres.wmxugfajiqhfddxdpopo:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
7. Replace `[YOUR-PASSWORD]` with: `VEHnhNqble194hH0`
8. Add `?sslmode=require` at the end
9. **Final URL:**
   ```
   postgresql://postgres.wmxugfajiqhfddxdpopo:VEHnhNqble194hH0@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

### Step 6: Update Vercel Environment Variable

1. Go to Vercel Dashboard → Your Backend Project
2. **Settings** → **Environment Variables**
3. Find `DATABASE_URL`
4. **Replace** it with the pooler connection string from Step 5
5. Click **Save**

### Step 7: Redeploy Vercel

1. Go to **Deployments** tab
2. Click the **three dots (⋯)** on latest deployment
3. Select **"Redeploy"**
4. Wait for deployment to complete

### Step 8: Test Login

1. Go to your Netlify site: `https://hostellmanagement.netlify.app`
2. Try to login with:
   - **Username:** `admin`
   - **Password:** `admin123`

## 🎉 Success!

If everything worked:
- ✅ Tables created in Supabase
- ✅ Admin user created
- ✅ Database connected from Vercel
- ✅ Login works!

## ❌ Troubleshooting

**If SQL script fails:**
- Make sure you copied the ENTIRE file
- Check for any error messages in Supabase SQL Editor
- Try running it in smaller chunks (Part 1, then Part 2, etc.)

**If still getting connection errors:**
- Verify `DATABASE_URL` in Vercel uses the **pooler** (port 6543)
- Make sure password is correct: `VEHnhNqble194hH0`
- Check Vercel deployment logs for errors

**If login doesn't work:**
- Verify admin user exists in `users` table
- Check password hash is correct
- Try clearing browser cache and cookies

