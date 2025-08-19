-- Add individual parent names and update children structure to include names
ALTER TABLE families 
ADD COLUMN father_name TEXT,
ADD COLUMN mother_name TEXT;

-- Update existing families to split parent_names if they exist
UPDATE families 
SET father_name = SPLIT_PART(parent_names, ' & ', 1),
    mother_name = SPLIT_PART(parent_names, ' & ', 2)
WHERE parent_names IS NOT NULL AND parent_names LIKE '% & %';

-- For single parent names, put in father_name field
UPDATE families 
SET father_name = parent_names
WHERE parent_names IS NOT NULL AND parent_names NOT LIKE '% & %';
