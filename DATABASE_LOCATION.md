# Database Location Information

## Current Database Configuration

Based on your `.env` file:

- **Database Type:** PostgreSQL
- **Database Name:** `hostel_management`
- **Host:** `localhost` (127.0.0.1)
- **Port:** `5432` (default PostgreSQL port)
- **User:** `postgres`
- **Password:** `malik915`

## Where is the Database Stored?

### Physical Location
PostgreSQL stores database files on your local machine. The default location is typically:

**Windows:**
```
C:\Program Files\PostgreSQL\[VERSION]\data
```

Common versions:
- `C:\Program Files\PostgreSQL\18\data`
- `C:\Program Files\PostgreSQL\16\data`
- `C:\Program Files\PostgreSQL\15\data`

### Finding Your Exact Data Directory

To find the exact location, you can:

1. **Using psql command:**
   ```powershell
   psql -U postgres -c "SHOW data_directory;"
   ```

2. **Using pgAdmin:**
   - Open pgAdmin
   - Right-click on your PostgreSQL server
   - Go to Properties → General
   - Check the "Data directory" field

3. **Check PostgreSQL service:**
   ```powershell
   Get-Service postgresql* | Select-Object Name, DisplayName
   ```

## Database Files Structure

Inside the data directory, your `hostel_management` database files are stored in:
```
[Data Directory]/base/[database_oid]/
```

Where `database_oid` is a unique identifier assigned by PostgreSQL.

## Accessing the Database

### Method 1: Using psql (Command Line)
```powershell
psql -U postgres -d hostel_management
# Then enter password: malik915
```

### Method 2: Using pgAdmin (GUI)
1. Open pgAdmin (usually installed with PostgreSQL)
2. Connect to server:
   - Host: localhost
   - Port: 5432
   - Username: postgres
   - Password: malik915
3. Navigate to: Servers → PostgreSQL → Databases → hostel_management

### Method 3: Using Database Tools
- **DBeaver** (Free, cross-platform)
- **DataGrip** (JetBrains, paid)
- **TablePlus** (Paid, macOS/Windows)
- **pgAdmin** (Free, included with PostgreSQL)

Connection details:
- Host: `localhost`
- Port: `5432`
- Database: `hostel_management`
- User: `postgres`
- Password: `malik915`

## Database Schema Files

The SQL schema files are located in your project:
```
hostel-management-system/
├── server/
│   ├── database/
│   │   ├── schema.sql          # Initial database schema
│   │   ├── multi-hostel-schema.sql  # Multi-hostel upgrade
│   │   └── check-and-create-tables.js  # Setup script
│   └── config/
│       └── database.js          # Database connection config
```

## Important Notes

1. **Backup Location:** Always backup your database before making changes
2. **Data Directory:** Don't manually edit files in the data directory
3. **Access:** The database is only accessible from `localhost` by default
4. **Remote Access:** To access from other machines, you need to configure `pg_hba.conf`

## Quick Commands

### Connect to database:
```powershell
psql -U postgres -d hostel_management
```

### List all databases:
```powershell
psql -U postgres -c "\l"
```

### List all tables in hostel_management:
```powershell
psql -U postgres -d hostel_management -c "\dt"
```

### Backup database:
```powershell
pg_dump -U postgres -d hostel_management > backup.sql
```

### Restore database:
```powershell
psql -U postgres -d hostel_management < backup.sql
```

