# Multi-Hostel System Setup Guide

## Overview
The system has been upgraded to support multiple hostels with a super admin role that can manage all hostels.

## Database Upgrade

### Step 1: Run the upgrade script
```powershell
cd "C:\Users\MalikAbubakarShafeeq\Desktop\hostel management system\server"
node database/upgrade-to-multi-hostel.js
```

### Step 2: Update existing admin to super_admin
Connect to PostgreSQL and run:
```sql
UPDATE users SET role = 'super_admin', hostel_id = NULL WHERE username = 'admin';
```

### Step 3: Create your first hostel
You can create hostels through the UI after logging in as super admin, or via SQL:
```sql
INSERT INTO hostels (name, address, status) 
VALUES ('Main Hostel', '123 Main Street', 'active');
```

## User Roles

### Super Admin
- Can see and manage ALL hostels
- Can create/edit/delete hostels
- Can access any hostel's data
- No hostel_id assigned (NULL)

### Regular Admin
- Assigned to ONE hostel (hostel_id)
- Can only access their assigned hostel's data
- Cannot see other hostels

## Creating Users

### Super Admin User
```sql
INSERT INTO users (username, email, password, role, hostel_id) 
VALUES ('superadmin', 'super@admin.com', '$2a$10$...', 'super_admin', NULL);
```

### Regular Admin User
```sql
INSERT INTO users (username, email, password, role, hostel_id) 
VALUES ('admin1', 'admin1@hostel.com', '$2a$10$...', 'admin', 1);
```
(Replace 1 with the actual hostel_id)

## API Changes

All API endpoints now filter by `hostel_id`:
- Super admin can access any hostel by passing `hostel_id` query parameter
- Regular admins are automatically restricted to their assigned hostel

## Frontend Changes

- New "Hostels" page for super admin
- Hostel selection/switching (if needed)
- All data automatically filtered by user's hostel

## Migration Notes

### Existing Data
If you have existing data, you need to:
1. Create a default hostel
2. Assign all existing records to that hostel:
   ```sql
   UPDATE students SET hostel_id = 1;
   UPDATE rooms SET hostel_id = 1;
   UPDATE staff SET hostel_id = 1;
   -- etc. for all tables
   ```

## Testing

1. Login as super admin
2. Go to "Hostels" page
3. Create a new hostel
4. Create a regular admin user for that hostel
5. Login as regular admin - should only see their hostel's data

