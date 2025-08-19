-- Create custom SQL functions for advanced matching logic

-- Function to calculate interest overlap between two families (returns 0..1)
CREATE OR REPLACE FUNCTION interest_overlap(family1_id UUID, family2_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    interests1 TEXT[];
    interests2 TEXT[];
    common_count INTEGER;
    total_unique INTEGER;
BEGIN
    -- Get interests for both families
    SELECT interests INTO interests1 FROM families WHERE id = family1_id;
    SELECT interests INTO interests2 FROM families WHERE id = family2_id;
    
    -- Handle null cases
    IF interests1 IS NULL OR interests2 IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Count common interests
    SELECT COUNT(*) INTO common_count
    FROM unnest(interests1) AS i1
    WHERE i1 = ANY(interests2);
    
    -- Count total unique interests
    SELECT COUNT(DISTINCT interest) INTO total_unique
    FROM (
        SELECT unnest(interests1) AS interest
        UNION
        SELECT unnest(interests2) AS interest
    ) AS all_interests;
    
    -- Return Jaccard similarity (intersection / union)
    IF total_unique = 0 THEN
        RETURN 0;
    ELSE
        RETURN common_count::DECIMAL / total_unique::DECIMAL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate age overlap between two families (returns 0..1)
CREATE OR REPLACE FUNCTION age_overlap(family1_id UUID, family2_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    children1 JSONB[];
    children2 JSONB[];
    ages1 INTEGER[];
    ages2 INTEGER[];
    overlap_score DECIMAL := 0;
    age1 INTEGER;
    age2 INTEGER;
    min_diff INTEGER;
    total_comparisons INTEGER := 0;
BEGIN
    -- Get children for both families
    SELECT children INTO children1 FROM families WHERE id = family1_id;
    SELECT children INTO children2 FROM families WHERE id = family2_id;
    
    -- Handle null cases
    IF children1 IS NULL OR children2 IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Extract ages from children arrays
    SELECT ARRAY(SELECT (child->>'age')::INTEGER FROM unnest(children1) AS child WHERE child->>'age' IS NOT NULL)
    INTO ages1;
    
    SELECT ARRAY(SELECT (child->>'age')::INTEGER FROM unnest(children2) AS child WHERE child->>'age' IS NOT NULL)
    INTO ages2;
    
    -- Calculate age compatibility score
    FOREACH age1 IN ARRAY ages1 LOOP
        FOREACH age2 IN ARRAY ages2 LOOP
            total_comparisons := total_comparisons + 1;
            min_diff := ABS(age1 - age2);
            
            -- Score based on age difference (closer ages = higher score)
            IF min_diff = 0 THEN
                overlap_score := overlap_score + 1.0;
            ELSIF min_diff <= 2 THEN
                overlap_score := overlap_score + 0.8;
            ELSIF min_diff <= 4 THEN
                overlap_score := overlap_score + 0.5;
            ELSIF min_diff <= 6 THEN
                overlap_score := overlap_score + 0.2;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Return average compatibility score
    IF total_comparisons = 0 THEN
        RETURN 0;
    ELSE
        RETURN overlap_score / total_comparisons;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add PostGIS extension if not exists
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geometry column to travel_plans if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'travel_plans' AND column_name = 'geo') THEN
        ALTER TABLE travel_plans ADD COLUMN geo GEOMETRY(POINT, 4326);
        
        -- Create spatial index
        CREATE INDEX IF NOT EXISTS idx_travel_plans_geo ON travel_plans USING GIST (geo);
    END IF;
END $$;

-- Add date range column for efficient overlap queries
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'travel_plans' AND column_name = 'date_range') THEN
        ALTER TABLE travel_plans ADD COLUMN date_range DATERANGE;
        
        -- Populate existing date ranges
        UPDATE travel_plans 
        SET date_range = daterange(start_date, end_date, '[]')
        WHERE start_date IS NOT NULL AND end_date IS NOT NULL;
        
        -- Create index for range queries
        CREATE INDEX IF NOT EXISTS idx_travel_plans_date_range ON travel_plans USING GIST (date_range);
    END IF;
END $$;

-- Function to update geo coordinates from destination text
CREATE OR REPLACE FUNCTION update_geo_from_destination()
RETURNS TRIGGER AS $$
BEGIN
    -- This is a simplified geocoding - in production you'd use a proper geocoding service
    -- For now, we'll set some example coordinates based on common destinations
    CASE 
        WHEN NEW.destination ILIKE '%istanbul%' THEN
            NEW.geo := ST_SetSRID(ST_MakePoint(28.9784, 41.0082), 4326);
        WHEN NEW.destination ILIKE '%bangkok%' THEN
            NEW.geo := ST_SetSRID(ST_MakePoint(100.5018, 13.7563), 4326);
        WHEN NEW.destination ILIKE '%barcelona%' THEN
            NEW.geo := ST_SetSRID(ST_MakePoint(2.1734, 41.3851), 4326);
        WHEN NEW.destination ILIKE '%belgium%' OR NEW.destination ILIKE '%leuven%' THEN
            NEW.geo := ST_SetSRID(ST_MakePoint(4.7005, 50.8798), 4326);
        ELSE
            -- Default to center of Europe for unknown destinations
            NEW.geo := ST_SetSRID(ST_MakePoint(10.0, 50.0), 4326);
    END CASE;
    
    -- Update date range
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
        NEW.date_range := daterange(NEW.start_date, NEW.end_date, '[]');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update geo coordinates
DROP TRIGGER IF EXISTS trigger_update_geo ON travel_plans;
CREATE TRIGGER trigger_update_geo
    BEFORE INSERT OR UPDATE ON travel_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_geo_from_destination();
