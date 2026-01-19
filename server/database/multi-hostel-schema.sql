-- Multi-Hostel Management System Database Schema
-- Run this after the initial schema to upgrade to multi-hostel support

-- Hostels table
CREATE TABLE IF NOT EXISTS hostels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    total_rooms INTEGER DEFAULT 0,
    total_capacity INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add hostel_id to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';

-- Add hostel_id to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to staff table
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to fees table
ALTER TABLE fees ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to complaints table
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to maintenance_requests table
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to notifications table
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE SET NULL;

-- Add hostel_id to expenses table
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_hostel ON users(hostel_id);
CREATE INDEX IF NOT EXISTS idx_students_hostel ON students(hostel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_staff_hostel ON staff(hostel_id);
CREATE INDEX IF NOT EXISTS idx_fees_hostel ON fees(hostel_id);
CREATE INDEX IF NOT EXISTS idx_attendance_hostel ON attendance(hostel_id);
CREATE INDEX IF NOT EXISTS idx_complaints_hostel ON complaints(hostel_id);
CREATE INDEX IF NOT EXISTS idx_expenses_hostel ON expenses(hostel_id);

-- Update existing users to have super_admin role if they don't have a hostel_id
UPDATE users SET role = 'super_admin' WHERE hostel_id IS NULL AND role = 'admin';

-- Insert a default hostel (optional - for existing data)
-- INSERT INTO hostels (name, address, status) VALUES ('Default Hostel', 'Default Address', 'active') ON CONFLICT DO NOTHING;

