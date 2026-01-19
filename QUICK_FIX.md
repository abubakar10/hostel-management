# Quick Fix: PostgreSQL Password Authentication Error

## The Problem
The error "password authentication failed for user postgres" means your PostgreSQL password doesn't match what's in the `.env` file (or the file doesn't exist).

## Solution: Create/Update .env File

### Step 1: Create the .env file

Create a file named `.env` in the `server` folder with the following content:

```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=hostel_management
DB_PASSWORD=YOUR_POSTGRESQL_PASSWORD_HERE
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRE=7d
```

**Replace `YOUR_POSTGRESQL_PASSWORD_HERE` with your actual PostgreSQL password.**

### Step 2: Find Your PostgreSQL Password

If you don't know your PostgreSQL password:

#### Option A: Try Common Defaults
- `postgres` (most common default)
- `admin`
- `root`
- (empty/no password)

#### Option B: Reset PostgreSQL Password (Windows)

1. Open PowerShell as Administrator
2. Stop PostgreSQL:
   ```powershell
   net stop postgresql-x64-16
   ```
   (Replace `16` with your PostgreSQL version number)

3. Navigate to PostgreSQL data directory:
   ```powershell
   cd "C:\Program Files\PostgreSQL\16\data"
   ```
   (Adjust version number as needed)

4. Edit `pg_hba.conf`:
   - Open in Notepad (as Administrator)
   - Find line: `host all all 127.0.0.1/32 md5`
   - Change `md5` to `trust`
   - Save

5. Start PostgreSQL:
   ```powershell
   net start postgresql-x64-16
   ```

6. Connect without password:
   ```powershell
   psql -U postgres
   ```

7. Change password:
   ```sql
   ALTER USER postgres PASSWORD 'newpassword';
   \q
   ```

8. Revert `pg_hba.conf`:
   - Change `trust` back to `md5`
   - Restart PostgreSQL

### Step 3: Create the Database

After fixing the password, create the database:

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hostel_management;

# Exit
\q
```

### Step 4: Run Database Schema

```powershell
cd "C:\Users\MalikAbubakarShafeeq\Desktop\hostel management system\server"
psql -U postgres -d hostel_management -f database/schema.sql
```

### Step 5: Create Admin User

```powershell
node database/seed.js
```

### Step 6: Test the Connection

Restart your server:
```powershell
npm run dev
```

You should see:
```
✅ Database connected successfully
```

## Alternative: Use Different PostgreSQL User

If you have a different PostgreSQL user, update the `.env` file:

```env
DB_USER=your_username
DB_PASSWORD=your_password
```

## Still Having Issues?

1. **Check if PostgreSQL is running:**
   - Open Services (`services.msc`)
   - Look for PostgreSQL service
   - Make sure it's running

2. **Check PostgreSQL port:**
   - Default is 5432
   - Update `DB_PORT` in `.env` if different

3. **Test connection manually:**
   ```powershell
   psql -U postgres -h localhost
   ```
   If this works, use the same credentials in `.env`

