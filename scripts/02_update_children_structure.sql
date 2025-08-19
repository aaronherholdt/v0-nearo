-- Update families table to store children with gender and age
ALTER TABLE families 
DROP COLUMN kids_ages,
ADD COLUMN children JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add a comment to document the JSON structure
COMMENT ON COLUMN families.children IS 'Array of children objects with gender and age: [{"gender": "boy", "age": 7}, {"gender": "girl", "age": 4}]';

-- Update any existing families (if any) to have empty children array
UPDATE families SET children = '[]'::jsonb WHERE children IS NULL;
