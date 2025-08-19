-- Create the main PostGIS matching function used by the event processor
CREATE OR REPLACE FUNCTION find_trip_matches(target_trip_id UUID, max_distance_km INTEGER DEFAULT 50)
RETURNS TABLE (
    other_family_id UUID,
    other_trip_id UUID,
    score DECIMAL,
    family_name TEXT,
    destination TEXT,
    start_date DATE,
    end_date DATE,
    distance_km DECIMAL,
    children_count INTEGER,
    children_ages INTEGER[],
    homeschool_style TEXT,
    shared_interests TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH target_trip AS (
        SELECT t.id, t.family_id, t.date_range, t.geo, t.destination as target_dest
        FROM travel_plans t 
        WHERE t.id = target_trip_id
    )
    SELECT 
        f.id as other_family_id,
        t2.id as other_trip_id,
        (
            0.5 * (1 - LEAST(ST_Distance(tt.geo, t2.geo) / (max_distance_km * 1000.0), 1.0)) +
            0.3 * COALESCE(interest_overlap(f.id, tt.family_id), 0) +
            0.2 * COALESCE(age_overlap(f.id, tt.family_id), 0)
        )::DECIMAL as score,
        f.family_name,
        t2.destination,
        t2.start_date,
        t2.end_date,
        (ST_Distance(tt.geo, t2.geo) / 1000.0)::DECIMAL as distance_km,
        COALESCE(array_length(f.children, 1), 0) as children_count,
        COALESCE(
            ARRAY(SELECT (child->>'age')::INTEGER 
                  FROM jsonb_array_elements(f.children) AS child 
                  WHERE child->>'age' IS NOT NULL), 
            ARRAY[]::INTEGER[]
        ) as children_ages,
        f.homeschool_style,
        COALESCE(f.interests, ARRAY[]::TEXT[]) as shared_interests
    FROM target_trip tt
    JOIN travel_plans t2 ON (
        t2.family_id != tt.family_id 
        AND t2.is_active = true
        AND t2.date_range && tt.date_range  -- Date overlap using range operator
        AND ST_DWithin(tt.geo, t2.geo, max_distance_km * 1000)  -- Distance filter in meters
    )
    JOIN families f ON f.id = t2.family_id
    ORDER BY score DESC
    LIMIT 50;
END;
$$ LANGUAGE plpgsql;
