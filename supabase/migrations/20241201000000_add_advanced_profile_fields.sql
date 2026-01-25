-- Add advanced profile fields to profiles table
-- Using match_prefs JSON column to store structured preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS match_prefs JSONB;

-- Legacy columns (keeping for backward compatibility, can be removed later)
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS travel_preferences TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS favorite_activities TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accommodation_preferences TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages_spoken TEXT;
