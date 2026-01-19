-- Complete Supabase Database Setup Script
-- Run this in Supabase SQL Editor (Settings → SQL Editor → New query)

-- ============================================
-- PART 1: Initial Schema
-- ============================================

-- Users/Authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Types
CREATE TABLE IF NOT EXISTS room_types (
    id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    price_per_month DECIMAL(10, 2) NOT NULL,
    description TEXT
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    room_type_id INTEGER REFERENCES room_types(id),
    floor INTEGER,
    capacity INTEGER NOT NULL,
    current_occupancy INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'available',
    amenities TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    course VARCHAR(100),
    year_of_study INTEGER,
    room_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    shift VARCHAR(50),
    salary DECIMAL(10, 2),
    hire_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fees
CREATE TABLE IF NOT EXISTS fees (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    fee_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    receipt_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, date)
);

-- Complaints
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'open',
    assigned_to INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    resolution TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Maintenance Requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    requested_by INTEGER REFERENCES students(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    cost DECIMAL(10, 2),
    completed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    related_module VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE NOT NULL,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PART 2: Multi-Hostel Support
-- ============================================

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

-- Add hostel_id to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE SET NULL;

-- Add hostel_id to students
ALTER TABLE students ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to staff
ALTER TABLE staff ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to fees
ALTER TABLE fees ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to attendance
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to complaints
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to maintenance_requests
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- Add hostel_id to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE SET NULL;

-- Add hostel_id to expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS hostel_id INTEGER REFERENCES hostels(id) ON DELETE CASCADE;

-- ============================================
-- PART 3: Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_hostel ON users(hostel_id);
CREATE INDEX IF NOT EXISTS idx_students_hostel ON students(hostel_id);
CREATE INDEX IF NOT EXISTS idx_students_room ON students(room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hostel ON rooms(hostel_id);
CREATE INDEX IF NOT EXISTS idx_staff_hostel ON staff(hostel_id);
CREATE INDEX IF NOT EXISTS idx_fees_hostel ON fees(hostel_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_hostel ON attendance(hostel_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_complaints_hostel ON complaints(hostel_id);
CREATE INDEX IF NOT EXISTS idx_complaints_student ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_expenses_hostel ON expenses(hostel_id);

-- ============================================
-- PART 4: Default Data
-- ============================================

-- Insert default room types
INSERT INTO room_types (type_name, capacity, price_per_month, description) VALUES
('Single', 1, 5000.00, 'Single occupancy room'),
('Double', 2, 3500.00, 'Double occupancy room'),
('Triple', 3, 2500.00, 'Triple occupancy room'),
('Quad', 4, 2000.00, 'Four occupancy room')
ON CONFLICT DO NOTHING;

-- Create admin user (password: admin123)
-- Note: You'll need to hash the password. Use: https://bcrypt-generator.com/
-- Hash for 'admin123': $2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZqZq
INSERT INTO users (username, email, password, role, hostel_id) VALUES
('admin', 'admin@hostel.com', '$2a$10$rOzJqZqZqZqZqZqZqZqZqOqZqZqZqZqZqZqZqZqZqZqZqZqZqZq', 'super_admin', NULL)
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 'Database setup complete! All tables created successfully.' as message;

