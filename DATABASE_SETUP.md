# Database Setup Guide

## PostgreSQL Database Configuration

The error you're seeing indicates that PostgreSQL password authentication is failing. Here's how to resolve it:

### Option 1: Update the .env file with your PostgreSQL password

1. **Find your PostgreSQL password:**
   - If you installed PostgreSQL with a custom password, use that password
   - If you forgot your password, you may need to reset it

2. **Update `server/.env` file:**
   ```env
   DB_PASSWORD=your_actual_postgresql_password
   ```

### Option 2: Reset PostgreSQL password (if you forgot it)

#### For Windows:

1. **Open Command Prompt as Administrator**

2. **Stop PostgreSQL service:**
   ```powershell
   net stop postgresql-x64-XX  # Replace XX with your version number
   ```

3. **Edit pg_hba.conf file:**
   - Location: `C:\Program Files\PostgreSQL\XX\data\pg_hba.conf`
   - Find the line: `host all all 127.0.0.1/32 md5`
   - Change `md5` to `trust`
   - Save the file

4. **Start PostgreSQL service:**
   ```powershell
   net start postgresql-x64-XX
   ```

5. **Connect to PostgreSQL:**
   ```powershell
   psql -U postgres
   ```

6. **Change password:**
   ```sql
   ALTER USER postgres PASSWORD 'your_new_password';
   ```

7. **Revert pg_hba.conf:**
   - Change `trust` back to `md5`
   - Restart PostgreSQL service

### Option 3: Create the database

After fixing the password, create the database:

1. **Connect to PostgreSQL:**
   ```powershell
   psql -U postgres
   ```

2. **Create the database:**
   ```sql
   CREATE DATABASE hostel_management;
   \q
   ```

3. **Run the schema:**
   ```powershell
   psql -U postgres -d hostel_management -f server/database/schema.sql
   ```

4. **Create admin user:**
   ```powershell
   cd server
   node database/seed.js
   ```

### Quick Test Connection

You can test your PostgreSQL connection with:

```powershell
psql -U postgres -h localhost
```

If this works, your password is correct. Update the `.env` file with the same password.

### Common Issues:

1. **PostgreSQL not running:**
   - Check services: `services.msc`
   - Look for PostgreSQL service and start it

2. **Wrong port:**
   - Default is 5432
   - Check your PostgreSQL installation port

3. **Database doesn't exist:**
   - Create it using the SQL command above

4. **User doesn't exist:**
   - Default user is `postgres`
   - If you have a different user, update `DB_USER` in `.env`

