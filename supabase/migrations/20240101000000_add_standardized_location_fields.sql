-- Add standardized location fields to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS standard_city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS standard_country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_full_name TEXT;

-- Create indexes for faster lookups by location
CREATE INDEX IF NOT EXISTS profiles_standard_city_idx ON public.profiles (standard_city);
CREATE INDEX IF NOT EXISTS profiles_location_full_name_idx ON public.profiles (location_full_name);
CREATE INDEX IF NOT EXISTS profiles_current_location_idx ON public.profiles (current_location);
