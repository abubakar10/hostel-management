-- Row Level Security (RLS) Setup for Hostel Management System
-- Run this AFTER running SUPABASE_SQL_SETUP.sql
-- 
-- IMPORTANT: Since we use our own Express backend with JWT authentication
-- (not Supabase REST API), we'll disable public API access for security.

-- ============================================
-- OPTION 1: Disable Public API Access (RECOMMENDED)
-- This is the simplest and most secure approach
-- ============================================

-- Revoke all public access to prevent Supabase REST API usage
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- Ensure postgres user (used by your backend) has full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- ============================================
-- OPTION 2: Enable RLS with Deny-All Policies
-- Use this if you want RLS enabled for defense-in-depth
-- ============================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Create deny-all policies for public/anonymous users
-- (Your Express backend uses postgres user, which bypasses RLS)
CREATE POLICY "Deny all public access to users" ON users
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to room_types" ON room_types
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to hostels" ON hostels
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to students" ON students
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to rooms" ON rooms
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to staff" ON staff
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to fees" ON fees
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to attendance" ON attendance
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to complaints" ON complaints
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to maintenance_requests" ON maintenance_requests
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to notifications" ON notifications
    FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Deny all public access to expenses" ON expenses
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- ============================================
-- Notes:
-- ============================================
-- 1. Your Express backend connects using the postgres user via DATABASE_URL
--    This user has full access and bypasses RLS policies.
-- 2. Public/anonymous access via Supabase REST API is blocked.
-- 3. Your Express backend handles authentication via JWT tokens.
-- 4. The backend filters data by hostel_id in application logic.
-- 5. This provides defense-in-depth security.
--
-- IMPORTANT: After running this script:
-- - The Security Advisor warnings should be resolved
-- - Your Express backend will continue to work normally
-- - Public access via Supabase REST API will be blocked
--
-- If you want to use ONLY Option 1 (disable public API), comment out
-- the "OPTION 2" section above. If you want both, keep both sections.
-- ============================================

