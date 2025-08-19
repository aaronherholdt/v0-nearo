-- Fix #2: Rename location_name to destination in travel_plans table
-- This resolves the column name drift that causes "record NEW has no field 'destination'" errors

-- Rename the column
ALTER TABLE travel_plans RENAME COLUMN location_name TO destination;

-- Update any indexes that reference the old column name
-- (Check if any exist and recreate them)
DROP INDEX IF EXISTS idx_travel_plans_location_name;
CREATE INDEX IF NOT EXISTS idx_travel_plans_destination ON travel_plans(destination);

-- Update any views or functions that might reference location_name
-- (The triggers and functions in our global places database already expect 'destination')

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'travel_plans' 
AND table_schema = 'public'
ORDER BY ordinal_position;
