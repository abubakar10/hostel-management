# Email Uniqueness Across Platform

## Overview

The Hostel Management System enforces **email uniqueness across all account types** on the platform. This means:

- ✅ No two accounts (student, admin/staff, or staff member) can have the same email address
- ✅ Email addresses are case-insensitive (e.g., `John@Example.com` = `john@example.com`)
- ✅ Validation occurs at the application level for all create/update operations

## Why This Matters

1. **Security**: Prevents account confusion and potential security issues
2. **Data Integrity**: Ensures each email maps to exactly one account
3. **User Experience**: Prevents login confusion and password reset issues
4. **Forgot Password**: The auto-detection feature works correctly when emails are unique

## Implementation

### Application-Level Validation

The system uses a centralized email validation utility (`server/utils/emailValidation.js`) that:

1. Checks all relevant tables (`users`, `students`, `staff`)
2. Performs case-insensitive email comparison
3. Excludes the current record when updating (allows keeping the same email)
4. Returns clear error messages indicating which table already has the email

### Protected Routes

Email uniqueness is enforced in:

- ✅ **Student Creation** (`POST /api/students`)
- ✅ **Student Update** (`PUT /api/students/:id`)
- ✅ **User Registration** (`POST /api/auth/register`)
- ✅ **User Creation** (`POST /api/users`) - Super admin only
- ✅ **User Update** (`PUT /api/users/:id`) - Super admin only

### Error Messages

When a duplicate email is detected, users will see clear messages:

- `"This email is already registered as an admin/staff account"`
- `"This email is already registered as a student account"`
- `"This email is already registered as a staff member"`

## Database Schema

While the database has `UNIQUE` constraints on email columns within each table:

```sql
-- Users table
email VARCHAR(255) UNIQUE NOT NULL

-- Students table
email VARCHAR(255) UNIQUE NOT NULL

-- Staff table
email VARCHAR(255) UNIQUE NOT NULL
```

**Note**: PostgreSQL doesn't support cross-table unique constraints directly. The application-level validation ensures uniqueness across all tables.

## Checking for Duplicates

To check for existing duplicate emails in your database:

```bash
cd hostel-management/server
node database/check-duplicate-emails.js
```

This script will:
- Scan all tables for emails
- Report any emails that exist in multiple tables
- Provide a summary of email distribution

## Resolving Duplicates

If duplicates are found:

1. **Identify the correct account**: Determine which account should keep the email
2. **Update the other account(s)**: Change the email to a unique value
3. **Verify**: Run the check script again to confirm duplicates are resolved

### Example Resolution

If `john@example.com` exists in both `users` and `students`:

1. Decide which account is correct (e.g., student account)
2. Update the user account to use a different email (e.g., `john.admin@example.com`)
3. Or update the student account if the user account is correct

## Best Practices

1. **Always validate before creating**: The system does this automatically
2. **Use unique emails**: Each person should have a unique email address
3. **Check before bulk imports**: Run the duplicate check script before importing data
4. **Monitor regularly**: Periodically check for duplicates, especially after data migrations

## Technical Details

### Email Normalization

Emails are normalized before comparison:
- Converted to lowercase
- Trimmed of whitespace
- Validated for format (basic regex check)

### Performance

The validation queries are optimized:
- Uses indexed email columns
- Excludes current record when updating
- Single query per table check

### Case Sensitivity

Email comparison is **case-insensitive**:
- `John@Example.com` = `john@example.com` = `JOHN@EXAMPLE.COM`

## Troubleshooting

### "Email already exists" but I don't see it

1. Check if the email exists in a different table (student vs admin)
2. Check for case differences (try lowercase)
3. Check for whitespace (try trimming)
4. Run the duplicate check script

### Need to allow duplicate emails

**Not recommended**, but if absolutely necessary:
1. Modify `server/utils/emailValidation.js`
2. Update the validation logic
3. **Warning**: This may break forgot password functionality

## Related Features

- **Forgot Password**: Relies on email uniqueness for auto-detection
- **Login System**: Uses email/username for authentication
- **Password Reset**: Email-based token delivery

---

**Last Updated**: Implementation ensures email uniqueness across all account types for better security and data integrity.

