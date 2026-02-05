-- Add optional photo column to students and staff tables
-- Photo is stored as base64 (optional, for profile images)

ALTER TABLE students ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo TEXT;
