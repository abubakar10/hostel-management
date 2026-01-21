-- Migration: Fix room_number constraint to be unique per hostel
-- This allows the same room number in different hostels

-- Step 1: Drop the existing unique constraint on room_number
-- First, find and drop the constraint
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'rooms'::regclass
    AND contype = 'u'
    AND array_length(conkey, 1) = 1
    AND conkey[1] = (
        SELECT attnum 
        FROM pg_attribute 
        WHERE attrelid = 'rooms'::regclass 
        AND attname = 'room_number'
    );
    
    -- Drop the constraint if it exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE rooms DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END IF;
END $$;

-- Step 2: Add composite unique constraint on (hostel_id, room_number)
-- This ensures room numbers are unique per hostel, not globally
ALTER TABLE rooms 
ADD CONSTRAINT rooms_hostel_room_number_unique 
UNIQUE (hostel_id, room_number);

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_hostel_room_number 
ON rooms(hostel_id, room_number);

-- Success message
SELECT 'Room number constraint fixed! Room numbers are now unique per hostel.' as message;

