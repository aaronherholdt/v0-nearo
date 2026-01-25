-- Create nearby_families RPC function
-- Returns families within user's match radius or mutual travel radii

CREATE OR REPLACE FUNCTION public.nearby_families(
    _user UUID,
    _mutual BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(other_id UUID, distance_km NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_lat NUMERIC;
    user_lng NUMERIC;
    match_view_min_km NUMERIC := 0;
    match_view_max_km NUMERIC := 100;
    travel_min_km NUMERIC := 0;
    travel_max_km NUMERIC := 50;
BEGIN
    -- Get user's location and preferences
    SELECT
        p.location_lat,
        p.location_lng,
        COALESCE((p.match_prefs->'match_view'->>'min_km')::NUMERIC, 0),
        COALESCE((p.match_prefs->'match_view'->>'max_km')::NUMERIC, 100),
        COALESCE((p.match_prefs->'travel'->>'min_km')::NUMERIC, 0),
        COALESCE((p.match_prefs->'travel'->>'max_km')::NUMERIC, 50)
    INTO user_lat, user_lng, match_view_min_km, match_view_max_km, travel_min_km, travel_max_km
    FROM public.profiles p
    WHERE p.id = _user;

    -- If user has no location, return empty result
    IF user_lat IS NULL OR user_lng IS NULL THEN
        RETURN;
    END IF;

    IF _mutual THEN
        -- Mutual mode: find families where both users are within each other's travel radius
        RETURN QUERY
        SELECT
            p.id::UUID,
            ROUND(
                ST_Distance(
                    ST_Point(user_lng, user_lat)::geography,
                    ST_Point(p.location_lng, p.location_lat)::geography
                )::NUMERIC / 1000,
                2
            ) as distance_km
        FROM public.profiles p
        WHERE p.id != _user
            AND p.location_lat IS NOT NULL
            AND p.location_lng IS NOT NULL
            -- User is within this family's travel radius
            AND ST_DWithin(
                ST_Point(user_lng, user_lat)::geography,
                ST_Point(p.location_lng, p.location_lat)::geography,
                COALESCE((p.match_prefs->'travel'->>'max_km')::NUMERIC, 50) * 1000
            )
            -- This family is within user's travel radius
            AND ST_DWithin(
                ST_Point(user_lng, user_lat)::geography,
                ST_Point(p.location_lng, p.location_lat)::geography,
                travel_max_km * 1000
            )
            -- Respect user's minimum distances
            AND ST_Distance(
                ST_Point(user_lng, user_lat)::geography,
                ST_Point(p.location_lng, p.location_lat)::geography
            ) / 1000 >= GREATEST(travel_min_km, match_view_min_km)
            -- Respect user's maximum view distance
            AND ST_Distance(
                ST_Point(user_lng, user_lat)::geography,
                ST_Point(p.location_lng, p.location_lat)::geography
            ) / 1000 <= match_view_max_km
        ORDER BY distance_km;
    ELSE
        -- Non-mutual mode: find families within user's view radius only
        RETURN QUERY
        SELECT
            p.id::UUID,
            ROUND(
                ST_Distance(
                    ST_Point(user_lng, user_lat)::geography,
                    ST_Point(p.location_lng, p.location_lat)::geography
                )::NUMERIC / 1000,
                2
            ) as distance_km
        FROM public.profiles p
        WHERE p.id != _user
            AND p.location_lat IS NOT NULL
            AND p.location_lng IS NOT NULL
            -- Within user's view radius
            AND ST_DWithin(
                ST_Point(user_lng, user_lat)::geography,
                ST_Point(p.location_lng, p.location_lat)::geography,
                match_view_max_km * 1000
            )
            -- Respect minimum view distance
            AND ST_Distance(
                ST_Point(user_lng, user_lat)::geography,
                ST_Point(p.location_lng, p.location_lat)::geography
            ) / 1000 >= match_view_min_km
        ORDER BY distance_km;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.nearby_families(UUID, BOOLEAN) TO authenticated;
