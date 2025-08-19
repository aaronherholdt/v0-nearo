-- Create outbox table for domain events
CREATE TABLE IF NOT EXISTS outbox_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE NULL,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT NULL
);

-- Index for efficient processing
CREATE INDEX IF NOT EXISTS idx_outbox_events_unprocessed 
ON outbox_events (created_at) 
WHERE processed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_outbox_events_aggregate 
ON outbox_events (aggregate_type, aggregate_id);

-- Create event processing status table
CREATE TABLE IF NOT EXISTS event_processing_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES outbox_events(id),
  processor_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  error_details JSONB NULL
);

-- Create recommendations cache table for fast lookups
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL, -- 'family_matches', 'place_recommendations'
  target_id UUID NOT NULL, -- ID of recommended family or place
  score DECIMAL(5,2) NOT NULL,
  reasons JSONB NOT NULL, -- Array of match reasons
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast recommendation lookups
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_family_type 
ON recommendation_cache (family_id, recommendation_type, score DESC);

-- Removed WHERE clause with NOW() function to fix immutable function error
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_valid 
ON recommendation_cache (valid_until);

-- Function to publish domain events
CREATE OR REPLACE FUNCTION publish_domain_event(
  p_event_type VARCHAR(100),
  p_aggregate_id UUID,
  p_aggregate_type VARCHAR(50),
  p_event_data JSONB
) RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  INSERT INTO outbox_events (event_type, aggregate_id, aggregate_type, event_data)
  VALUES (p_event_type, p_aggregate_id, p_aggregate_type, p_event_data)
  RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to invalidate recommendation cache
CREATE OR REPLACE FUNCTION invalidate_recommendation_cache(
  p_family_id UUID DEFAULT NULL,
  p_recommendation_type VARCHAR(50) DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  IF p_family_id IS NOT NULL AND p_recommendation_type IS NOT NULL THEN
    DELETE FROM recommendation_cache 
    WHERE family_id = p_family_id AND recommendation_type = p_recommendation_type;
  ELSIF p_family_id IS NOT NULL THEN
    DELETE FROM recommendation_cache WHERE family_id = p_family_id;
  ELSE
    -- Invalidate all cache entries
    DELETE FROM recommendation_cache;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for travel plan events
CREATE OR REPLACE FUNCTION trigger_travel_plan_events() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM publish_domain_event(
      'TripCreated',
      NEW.id,
      'travel_plan',
      jsonb_build_object(
        'family_id', NEW.family_id,
        'destination', NEW.destination,
        'start_date', NEW.start_date,
        'end_date', NEW.end_date,
        'is_active', NEW.is_active
      )
    );
    
    -- Invalidate cache for this family and related families
    PERFORM invalidate_recommendation_cache(NEW.family_id);
    
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM publish_domain_event(
      'TripUpdated',
      NEW.id,
      'travel_plan',
      jsonb_build_object(
        'family_id', NEW.family_id,
        'destination', NEW.destination,
        'start_date', NEW.start_date,
        'end_date', NEW.end_date,
        'is_active', NEW.is_active,
        'old_destination', OLD.destination,
        'old_start_date', OLD.start_date,
        'old_end_date', OLD.end_date,
        'old_is_active', OLD.is_active
      )
    );
    
    -- Invalidate cache for this family
    PERFORM invalidate_recommendation_cache(NEW.family_id);
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM publish_domain_event(
      'TripDeleted',
      OLD.id,
      'travel_plan',
      jsonb_build_object(
        'family_id', OLD.family_id,
        'destination', OLD.destination,
        'start_date', OLD.start_date,
        'end_date', OLD.end_date
      )
    );
    
    -- Invalidate cache for this family
    PERFORM invalidate_recommendation_cache(OLD.family_id);
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for family events
CREATE OR REPLACE FUNCTION trigger_family_events() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Check if interests or homeschool style changed
    IF OLD.interests IS DISTINCT FROM NEW.interests OR 
       OLD.homeschool_style IS DISTINCT FROM NEW.homeschool_style THEN
      PERFORM publish_domain_event(
        'FamilyInterestsUpdated',
        NEW.id,
        'family',
        jsonb_build_object(
          'family_id', NEW.id,
          'new_interests', NEW.interests,
          'old_interests', OLD.interests,
          'new_homeschool_style', NEW.homeschool_style,
          'old_homeschool_style', OLD.homeschool_style
        )
      );
      
      -- Invalidate cache for this family
      PERFORM invalidate_recommendation_cache(NEW.id);
    END IF;
    
    -- Check if children data changed (for age-based scoring)
    IF OLD.children IS DISTINCT FROM NEW.children THEN
      PERFORM publish_domain_event(
        'FamilyChildrenUpdated',
        NEW.id,
        'family',
        jsonb_build_object(
          'family_id', NEW.id,
          'new_children', NEW.children,
          'old_children', OLD.children
        )
      );
      
      -- Invalidate cache for this family
      PERFORM invalidate_recommendation_cache(NEW.id);
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS travel_plan_events_trigger ON travel_plans;
CREATE TRIGGER travel_plan_events_trigger
  AFTER INSERT OR UPDATE OR DELETE ON travel_plans
  FOR EACH ROW EXECUTE FUNCTION trigger_travel_plan_events();

DROP TRIGGER IF EXISTS family_events_trigger ON families;
CREATE TRIGGER family_events_trigger
  AFTER UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION trigger_family_events();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON outbox_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON event_processing_status TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON recommendation_cache TO authenticated;
