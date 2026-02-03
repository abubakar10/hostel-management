-- Add resident_type column to students table
-- This allows tracking different types of residents: students, job-based workers, and short-term residents

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS resident_type VARCHAR(20) DEFAULT 'student';

-- Update existing records to have 'student' as default (if not already set)
UPDATE students 
SET resident_type = 'student' 
WHERE resident_type IS NULL;

-- Add a check constraint to ensure valid resident types
ALTER TABLE students 
DROP CONSTRAINT IF EXISTS students_resident_type_check;

ALTER TABLE students 
ADD CONSTRAINT students_resident_type_check 
CHECK (resident_type IN ('student', 'job_based', 'short_term'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_students_resident_type ON students(resident_type);
