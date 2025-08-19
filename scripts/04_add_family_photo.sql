-- Add family photo URL column to families table
ALTER TABLE families ADD COLUMN family_photo_url TEXT;

-- Add comment for the new column
COMMENT ON COLUMN families.family_photo_url IS 'URL to the family photo stored in Supabase Storage';
