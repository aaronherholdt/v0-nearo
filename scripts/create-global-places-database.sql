-- Global Places Database for Worldwide Travel Recommendations
-- This creates a comprehensive database of attractions, restaurants, and activities worldwide

-- Create recommendation_cache table if it doesn't exist (from outbox events system)
-- Removed conflicting recommendation_cache table creation since it already exists from outbox events system

-- Create places table with global coverage
CREATE TABLE IF NOT EXISTS places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    category VARCHAR(50) NOT NULL, -- museum, park, restaurant, attraction, activity, shopping, entertainment
    subcategory VARCHAR(100), -- art_museum, theme_park, playground, etc.
    interests TEXT[] DEFAULT '{}', -- outdoor, history, art, science, food, culture, adventure, education
    min_age INTEGER DEFAULT 0,
    max_age INTEGER DEFAULT 100,
    rating DECIMAL(3,2) DEFAULT 4.0,
    price_level INTEGER DEFAULT 2, -- 1=free, 2=budget, 3=moderate, 4=expensive, 5=luxury
    family_friendly BOOLEAN DEFAULT true,
    wheelchair_accessible BOOLEAN DEFAULT false,
    website VARCHAR(500),
    phone VARCHAR(50),
    address TEXT,
    opening_hours JSONB,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_places_location ON places USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_places_city_country ON places (city, country);
CREATE INDEX IF NOT EXISTS idx_places_category ON places (category);
CREATE INDEX IF NOT EXISTS idx_places_interests ON places USING GIN (interests);
CREATE INDEX IF NOT EXISTS idx_places_age_range ON places (min_age, max_age);
CREATE INDEX IF NOT EXISTS idx_places_rating ON places (rating DESC);

-- Insert comprehensive global places data
INSERT INTO places (name, description, city, country, latitude, longitude, category, subcategory, interests, min_age, max_age, rating, price_level, family_friendly, address, tags) VALUES

-- BANGKOK, THAILAND
('Grand Palace', 'Historic royal palace complex with stunning Thai architecture and the Temple of the Emerald Buddha', 'Bangkok', 'Thailand', 13.7500, 100.4915, 'attraction', 'palace', '{"history","culture","art"}', 5, 100, 4.5, 3, true, 'Na Phra Lan Rd, Phra Borom Maha Ratchawang, Phra Nakhon', '{"historic","royal","temple","architecture"}'),
('Chatuchak Weekend Market', 'Massive weekend market with thousands of stalls selling everything from food to handicrafts', 'Bangkok', 'Thailand', 13.7998, 100.5501, 'shopping', 'market', '{"culture","food","shopping"}', 0, 100, 4.3, 2, true, '587/10 Kamphaeng Phet 2 Rd, Chatuchak', '{"market","shopping","food","local"}'),
('Lumpini Park', 'Large green space in the heart of Bangkok perfect for families with playgrounds and lakes', 'Bangkok', 'Thailand', 13.7307, 100.5418, 'park', 'city_park', '{"outdoor","nature","exercise"}', 0, 100, 4.2, 1, true, 'Lumphini, Pathum Wan District', '{"park","playground","lake","exercise"}'),
('SEA LIFE Bangkok Ocean World', 'Large aquarium with diverse marine life and interactive experiences for children', 'Bangkok', 'Thailand', 13.7460, 100.5392, 'attraction', 'aquarium', '{"science","marine","education"}', 2, 16, 4.1, 4, true, 'B1-B2 Floor, Siam Paragon, 991 Rama I Rd', '{"aquarium","marine","interactive","educational"}'),
('Jim Thompson House', 'Beautiful traditional Thai house museum showcasing silk and Southeast Asian art', 'Bangkok', 'Thailand', 13.7465, 100.5303, 'museum', 'house_museum', '{"history","art","culture"}', 8, 100, 4.4, 3, true, '6 Soi Kasemsan 2, Rama 1 Rd', '{"museum","silk","traditional","art"}'),

-- ISTANBUL, TURKEY
('Hagia Sophia', 'Iconic Byzantine cathedral turned mosque, architectural marvel spanning centuries', 'Istanbul', 'Turkey', 41.0086, 28.9802, 'attraction', 'historic_site', '{"history","architecture","culture"}', 6, 100, 4.6, 2, true, 'Sultan Ahmet, Ayasofya Meydanı No:1, Fatih', '{"historic","byzantine","mosque","architecture"}'),
('Blue Mosque', 'Stunning 17th-century mosque famous for its blue tiles and six minarets', 'Istanbul', 'Turkey', 41.0054, 28.9768, 'attraction', 'mosque', '{"history","architecture","culture"}', 5, 100, 4.5, 1, true, 'Sultan Ahmet, At Meydanı No:7, Fatih', '{"mosque","historic","architecture","tiles"}'),
('Topkapi Palace', 'Former Ottoman palace with beautiful gardens, treasury, and Bosphorus views', 'Istanbul', 'Turkey', 41.0115, 28.9833, 'attraction', 'palace', '{"history","culture","art"}', 8, 100, 4.4, 3, true, 'Cankurtaran, 34122 Fatih', '{"palace","ottoman","treasury","gardens"}'),
('Grand Bazaar', 'Historic covered market with thousands of shops selling carpets, jewelry, and souvenirs', 'Istanbul', 'Turkey', 41.0106, 28.9681, 'shopping', 'bazaar', '{"culture","shopping","history"}', 5, 100, 4.2, 2, true, 'Beyazıt, 34126 Fatih', '{"bazaar","shopping","historic","souvenirs"}'),
('Galata Tower', 'Medieval tower offering panoramic views of Istanbul and the Bosphorus', 'Istanbul', 'Turkey', 41.0256, 28.9744, 'attraction', 'tower', '{"history","views","architecture"}', 6, 100, 4.3, 3, true, 'Bereketzade, Galata Kulesi Sk., Beyoğlu', '{"tower","views","medieval","panoramic"}'),

-- LEUVEN, BELGIUM
('Town Hall', 'Gothic masterpiece and one of the most beautiful town halls in Belgium', 'Leuven', 'Belgium', 50.8798, 4.7005, 'attraction', 'historic_building', '{"history","architecture","culture"}', 5, 100, 4.4, 2, true, 'Grote Markt 9, 3000 Leuven', '{"gothic","town_hall","historic","architecture"}'),
('University Library', 'Beautiful library with impressive tower and historical significance', 'Leuven', 'Belgium', 50.8786, 4.7014, 'attraction', 'library', '{"history","education","architecture"}', 8, 100, 4.2, 1, true, 'Mgr. Ladeuzeplein 21, 3000 Leuven', '{"library","university","historic","tower"}'),
('Kruidtuin Botanical Garden', 'Peaceful botanical garden perfect for families with children', 'Leuven', 'Belgium', 50.8842, 4.6842, 'park', 'botanical_garden', '{"nature","education","outdoor"}', 0, 100, 4.1, 1, true, 'Kapucijnenvoer 30, 3000 Leuven', '{"botanical","garden","peaceful","educational"}'),
('M-Museum Leuven', 'Contemporary art museum with family-friendly exhibitions and workshops', 'Leuven', 'Belgium', 50.8775, 4.7028, 'museum', 'art_museum', '{"art","culture","education"}', 6, 100, 4.0, 3, true, 'Leopold Vanderkelenstraat 28, 3000 Leuven', '{"art","museum","contemporary","workshops"}'),
('Stella Artois Brewery', 'Historic brewery offering tours and tastings (family areas available)', 'Leuven', 'Belgium', 50.8756, 4.6889, 'attraction', 'brewery', '{"history","culture","food"}', 12, 100, 4.2, 3, false, 'Artois-plein 1, 3000 Leuven', '{"brewery","historic","tours","beer"}'),

-- CHRISTCHURCH, NEW ZEALAND
('Christchurch Botanic Gardens', 'Beautiful gardens with diverse plant collections and family-friendly paths', 'Christchurch', 'New Zealand', -43.5309, 172.6206, 'park', 'botanical_garden', '{"nature","outdoor","education"}', 0, 100, 4.5, 1, true, 'Rolleston Ave, Christchurch Central City', '{"botanical","gardens","peaceful","family"}'),
('International Antarctic Centre', 'Interactive museum and experience center about Antarctica with penguin encounters', 'Christchurch', 'New Zealand', -43.4890, 172.5519, 'museum', 'science_museum', '{"science","education","adventure"}', 4, 100, 4.3, 4, true, '38 Orchard Rd, Christchurch Airport', '{"antarctic","penguins","interactive","science"}'),
('Christchurch Gondola', 'Scenic cable car ride offering panoramic views of the city and Canterbury Plains', 'Christchurch', 'New Zealand', -43.5669, 172.6456, 'attraction', 'scenic_ride', '{"views","adventure","outdoor"}', 3, 100, 4.4, 4, true, '10 Bridle Path Rd, Heathcote Valley', '{"gondola","views","scenic","adventure"}'),
('Willowbank Wildlife Reserve', 'Wildlife park featuring native New Zealand animals and Maori cultural experiences', 'Christchurch', 'New Zealand', -43.4833, 172.5167, 'attraction', 'wildlife_park', '{"nature","wildlife","culture"}', 2, 100, 4.2, 3, true, '60 Hussey Rd, Northwood', '{"wildlife","native","maori","animals"}'),
('Quake City', 'Museum dedicated to the Canterbury earthquakes with interactive exhibits', 'Christchurch', 'New Zealand', -43.5321, 172.6362, 'museum', 'history_museum', '{"history","science","education"}', 8, 100, 4.1, 2, true, '299 Durham St North, Christchurch Central', '{"earthquake","history","interactive","educational"}'),

-- LONDON, UNITED KINGDOM
('British Museum', 'World-famous museum with artifacts from around the globe including Egyptian mummies', 'London', 'United Kingdom', 51.5194, -0.1270, 'museum', 'history_museum', '{"history","culture","education"}', 5, 100, 4.6, 1, true, 'Great Russell St, Bloomsbury', '{"museum","artifacts","history","free"}'),
('Tower of London', 'Historic castle housing the Crown Jewels with fascinating royal history', 'London', 'United Kingdom', 51.5081, -0.0759, 'attraction', 'castle', '{"history","culture","royal"}', 6, 100, 4.4, 4, true, 'St Katharine''s & Wapping, London', '{"castle","crown_jewels","royal","historic"}'),
('Hyde Park', 'Large royal park with playgrounds, lakes, and the famous Speakers'' Corner', 'London', 'United Kingdom', 51.5074, -0.1657, 'park', 'royal_park', '{"outdoor","nature","exercise"}', 0, 100, 4.3, 1, true, 'Hyde Park, London', '{"park","playground","lake","royal"}'),
('London Eye', 'Giant observation wheel offering spectacular views over London', 'London', 'United Kingdom', 51.5033, -0.1196, 'attraction', 'observation_wheel', '{"views","adventure","iconic"}', 4, 100, 4.2, 5, true, 'Riverside Building, County Hall, Westminster Bridge Rd', '{"ferris_wheel","views","iconic","thames"}'),
('Natural History Museum', 'Magnificent museum with dinosaur exhibits, minerals, and interactive galleries', 'London', 'United Kingdom', 51.4966, -0.1764, 'museum', 'natural_history', '{"science","education","nature"}', 3, 100, 4.5, 1, true, 'Exhibition Rd, South Kensington', '{"dinosaurs","natural_history","interactive","free"}'),

-- PARIS, FRANCE
('Eiffel Tower', 'Iconic iron tower and symbol of Paris with observation decks and restaurants', 'Paris', 'France', 48.8584, 2.2945, 'attraction', 'tower', '{"iconic","views","architecture"}', 3, 100, 4.5, 4, true, 'Champ de Mars, 5 Avenue Anatole France', '{"tower","iconic","views","symbol"}'),
('Louvre Museum', 'World''s largest art museum housing the Mona Lisa and countless masterpieces', 'Paris', 'France', 48.8606, 2.3376, 'museum', 'art_museum', '{"art","culture","history"}', 8, 100, 4.4, 4, true, 'Rue de Rivoli, 75001 Paris', '{"art","museum","mona_lisa","masterpieces"}'),
('Luxembourg Gardens', 'Beautiful palace gardens with playgrounds, puppet shows, and model boats', 'Paris', 'France', 48.8462, 2.3371, 'park', 'palace_garden', '{"outdoor","nature","family"}', 0, 100, 4.4, 1, true, '75006 Paris', '{"gardens","playground","puppet_shows","boats"}'),
('Disneyland Paris', 'Magical theme park with Disney characters, rides, and entertainment', 'Paris', 'France', 48.8674, 2.7834, 'attraction', 'theme_park', '{"entertainment","adventure","family"}', 2, 100, 4.2, 5, true, 'Boulevard de Parc, 77700 Coupvray', '{"disney","theme_park","rides","characters"}'),
('Notre-Dame Cathedral', 'Gothic masterpiece cathedral with stunning architecture and historical significance', 'Paris', 'France', 48.8530, 2.3499, 'attraction', 'cathedral', '{"history","architecture","culture"}', 6, 100, 4.3, 2, true, '6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris', '{"cathedral","gothic","historic","architecture"}'),

-- TOKYO, JAPAN
('Tokyo Disneyland', 'Magical theme park with classic Disney attractions and Japanese hospitality', 'Tokyo', 'Japan', 35.6329, 139.8804, 'attraction', 'theme_park', '{"entertainment","adventure","family"}', 2, 100, 4.3, 5, true, '1-1 Maihama, Urayasu, Chiba', '{"disney","theme_park","rides","japanese"}'),
('Senso-ji Temple', 'Ancient Buddhist temple in Asakusa with traditional architecture and shopping street', 'Tokyo', 'Japan', 35.7148, 139.7967, 'attraction', 'temple', '{"history","culture","spiritual"}', 5, 100, 4.4, 1, true, '2-3-1 Asakusa, Taito City', '{"temple","buddhist","traditional","shopping"}'),
('Ueno Park', 'Large park with museums, zoo, and beautiful cherry blossoms in spring', 'Tokyo', 'Japan', 35.7141, 139.7744, 'park', 'city_park', '{"nature","culture","outdoor"}', 0, 100, 4.3, 1, true, 'Uenokoen, Taito City', '{"park","zoo","museums","cherry_blossoms"}'),
('Tokyo National Museum', 'Premier museum showcasing Japanese art, archaeology, and cultural treasures', 'Tokyo', 'Japan', 35.7188, 139.7766, 'museum', 'national_museum', '{"art","culture","history"}', 8, 100, 4.2, 3, true, '13-9 Uenokoen, Taito City', '{"museum","japanese_art","cultural","treasures"}'),
('Meiji Shrine', 'Peaceful Shinto shrine surrounded by forest in the heart of Tokyo', 'Tokyo', 'Japan', 35.6762, 139.6993, 'attraction', 'shrine', '{"spiritual","nature","culture"}', 3, 100, 4.4, 1, true, '1-1 Kamizono-cho, Shibuya City', '{"shrine","shinto","peaceful","forest"}'),

-- NEW YORK CITY, USA
('Central Park', 'Iconic urban park with playgrounds, lakes, and endless family activities', 'New York City', 'USA', 40.7829, -73.9654, 'park', 'urban_park', '{"outdoor","nature","exercise"}', 0, 100, 4.5, 1, true, 'New York, NY 10024', '{"park","playground","lake","iconic"}'),
('Statue of Liberty', 'Symbol of freedom and democracy with ferry rides and museum', 'New York City', 'USA', 40.6892, -74.0445, 'attraction', 'monument', '{"history","iconic","patriotic"}', 6, 100, 4.3, 3, true, 'Liberty Island, New York, NY 10004', '{"statue","liberty","ferry","symbol"}'),
('American Museum of Natural History', 'World-renowned museum with dinosaurs, planetarium, and interactive exhibits', 'New York City', 'USA', 40.7813, -73.9740, 'museum', 'natural_history', '{"science","education","dinosaurs"}', 4, 100, 4.4, 3, true, '200 Central Park West, New York, NY 10024', '{"dinosaurs","planetarium","natural_history","interactive"}'),
('Times Square', 'Bustling commercial intersection with bright lights and street performers', 'New York City', 'USA', 40.7580, -73.9855, 'attraction', 'landmark', '{"entertainment","urban","iconic"}', 8, 100, 3.9, 2, true, 'Times Square, New York, NY 10036', '{"times_square","lights","performers","bustling"}'),
('Brooklyn Bridge', 'Historic suspension bridge with pedestrian walkway and stunning city views', 'New York City', 'USA', 40.7061, -73.9969, 'attraction', 'bridge', '{"history","views","architecture"}', 5, 100, 4.4, 1, true, 'New York, NY 10038', '{"bridge","historic","views","walkway"}');

-- Create function to get place recommendations for any destination
CREATE OR REPLACE FUNCTION get_global_place_recommendations(
    destination_city TEXT,
    destination_country TEXT DEFAULT NULL,
    family_interests TEXT[] DEFAULT '{}',
    children_ages INTEGER[] DEFAULT '{}',
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    place_id UUID,
    place_name VARCHAR(200),
    description TEXT,
    category VARCHAR(50),
    subcategory VARCHAR(100),
    rating DECIMAL(3,2),
    price_level INTEGER,
    address TEXT,
    interests TEXT[],
    tags TEXT[],
    match_score DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.subcategory,
        p.rating,
        p.price_level,
        p.address,
        p.interests,
        p.tags,
        (
            -- Base score from rating
            (p.rating / 5.0) * 40 +
            
            -- Interest overlap bonus (up to 40 points)
            CASE 
                WHEN array_length(family_interests, 1) > 0 THEN
                    (array_length(array(SELECT unnest(p.interests) INTERSECT SELECT unnest(family_interests)), 1)::DECIMAL / 
                     GREATEST(array_length(p.interests, 1), 1)) * 40
                ELSE 20
            END +
            
            -- Age appropriateness bonus (up to 20 points)
            CASE 
                WHEN array_length(children_ages, 1) > 0 THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM unnest(children_ages) AS age 
                            WHERE age BETWEEN p.min_age AND p.max_age
                        ) THEN 20
                        ELSE 5
                    END
                ELSE 15
            END
        )::DECIMAL(5,2) AS match_score
    FROM places p
    WHERE 
        LOWER(p.city) = LOWER(destination_city)
        AND (destination_country IS NULL OR LOWER(p.country) = LOWER(destination_country))
        AND p.family_friendly = true
    ORDER BY match_score DESC, p.rating DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate fallback recommendations for destinations not in database
CREATE OR REPLACE FUNCTION generate_fallback_recommendations(
    destination_city TEXT,
    destination_country TEXT DEFAULT NULL,
    family_interests TEXT[] DEFAULT '{}',
    children_ages INTEGER[] DEFAULT '{}'
)
RETURNS TABLE (
    place_name VARCHAR(200),
    description TEXT,
    category VARCHAR(50),
    match_score DECIMAL(5,2)
) AS $$
DECLARE
    base_recommendations TEXT[] := ARRAY[
        'City Center/Downtown Area',
        'Main Public Park',
        'Local History Museum',
        'Central Market/Shopping District',
        'Waterfront/Scenic Viewpoint',
        'Children''s Playground',
        'Local Cultural Center',
        'Public Library',
        'Walking/Hiking Trails',
        'Local Restaurants District'
    ];
    rec TEXT;
    score DECIMAL(5,2);
BEGIN
    FOREACH rec IN ARRAY base_recommendations
    LOOP
        -- Generate a base score with some variation
        score := 65.0 + (random() * 20);
        
        -- Adjust score based on interests and age
        IF array_length(family_interests, 1) > 0 THEN
            IF 'outdoor' = ANY(family_interests) AND rec LIKE '%Park%' THEN
                score := score + 15;
            ELSIF 'history' = ANY(family_interests) AND rec LIKE '%Museum%' THEN
                score := score + 15;
            ELSIF 'culture' = ANY(family_interests) AND rec LIKE '%Cultural%' THEN
                score := score + 15;
            END IF;
        END IF;
        
        RETURN QUERY SELECT 
            rec::VARCHAR(200),
            ('Explore the ' || rec || ' in ' || destination_city || 
             CASE WHEN destination_country IS NOT NULL THEN ', ' || destination_country ELSE '' END ||
             '. A great place for families to visit and experience local culture.')::TEXT,
            'attraction'::VARCHAR(50),
            score;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update recommendation cache trigger to use global places
CREATE OR REPLACE FUNCTION update_place_recommendations_cache()
RETURNS TRIGGER AS $$
DECLARE
    family_rec RECORD;
    place_rec RECORD;
    fallback_rec RECORD;
    place_count INTEGER := 0;
BEGIN
    -- Get family details for the travel plan
    SELECT f.interests, f.children INTO family_rec
    FROM families f 
    WHERE f.id = COALESCE(NEW.family_id, OLD.family_id);
    
    -- Delete existing place recs for this destination
    DELETE FROM recommendation_cache 
    WHERE family_id = COALESCE(NEW.family_id, OLD.family_id)
      AND recommendation_type = 'place'
      AND (reasons->>'destination') = COALESCE(NEW.destination, OLD.destination);
    
    -- Only generate recommendations for active travel plans
    IF NEW.is_active = true THEN
        -- Try to get recommendations from our places database
        FOR place_rec IN 
            SELECT * FROM get_global_place_recommendations(
                NEW.destination,
                NULL, -- We'll improve country detection later
                family_rec.interests,
                ARRAY(SELECT (value->>'age')::INTEGER FROM jsonb_array_elements(family_rec.children))
            )
        LOOP
            -- Insert (DB-backed places)
            INSERT INTO recommendation_cache (
              family_id, recommendation_type, target_id, score, reasons, valid_until
            ) VALUES (
              NEW.family_id, 'place', place_rec.place_id, place_rec.match_score,
              jsonb_build_object(
                'name', place_rec.place_name,
                'description', place_rec.description,
                'category', place_rec.category,
                'rating', place_rec.rating,
                'price_level', place_rec.price_level,
                'address', place_rec.address,
                'destination', NEW.destination,
                'interests', place_rec.interests,
                'tags', place_rec.tags
              ),
              NOW() + INTERVAL '24 hours'
            );
            place_count := place_count + 1;
        END LOOP;
        
        -- If no places found in database, generate fallback recommendations
        IF place_count = 0 THEN
            FOR fallback_rec IN 
                SELECT * FROM generate_fallback_recommendations(
                    NEW.destination,
                    NULL,
                    family_rec.interests,
                    ARRAY(SELECT (value->>'age')::INTEGER FROM jsonb_array_elements(family_rec.children))
                )
            LOOP
                -- Insert (fallback)
                INSERT INTO recommendation_cache (
                  family_id, recommendation_type, target_id, score, reasons, valid_until
                ) VALUES (
                  NEW.family_id, 'place', gen_random_uuid(), fallback_rec.match_score,
                  jsonb_build_object(
                    'name', fallback_rec.place_name,
                    'description', fallback_rec.description,
                    'category', fallback_rec.category,
                    'destination', NEW.destination,
                    'fallback', true
                  ),
                  NOW() + INTERVAL '24 hours'
                );
            END LOOP;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update place recommendations when travel plans change
DROP TRIGGER IF EXISTS trigger_update_place_recommendations ON travel_plans;
CREATE TRIGGER trigger_update_place_recommendations
  AFTER INSERT OR UPDATE OR DELETE ON travel_plans
  FOR EACH ROW EXECUTE FUNCTION update_place_recommendations_cache();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_family_type_existing ON recommendation_cache (family_id, recommendation_type);
-- Updated GIN index to use existing 'reasons' column instead of non-existent 'data' column
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_reasons ON recommendation_cache USING GIN (reasons);
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_score_existing ON recommendation_cache (score DESC);
