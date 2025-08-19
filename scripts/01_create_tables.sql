-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create families table (extends auth.users with family details)
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  family_name VARCHAR(100) NOT NULL,
  father_name VARCHAR(100),
  mother_name VARCHAR(100),
  children JSONB DEFAULT '[]'::jsonb, -- Array of {name, gender, age} objects
  family_photo_url TEXT,
  bio TEXT,
  homeschool_style VARCHAR(50),
  interests TEXT[],
  contact_preferences TEXT[] DEFAULT ARRAY['in-app'],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create travel_plans table
CREATE TABLE travel_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location_name VARCHAR(200) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create matches table (when families have overlapping travel plans)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family1_id UUID REFERENCES families(id) ON DELETE CASCADE,
  family2_id UUID REFERENCES families(id) ON DELETE CASCADE,
  travel_plan1_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
  travel_plan2_id UUID REFERENCES travel_plans(id) ON DELETE CASCADE,
  match_score INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, declined, expired
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(family1_id, family2_id, travel_plan1_id, travel_plan2_id)
);

-- Create messages table for matched families
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_families_user_id ON families(user_id);
CREATE INDEX idx_travel_plans_family_id ON travel_plans(family_id);
CREATE INDEX idx_travel_plans_dates ON travel_plans(start_date, end_date);
CREATE INDEX idx_travel_plans_location ON travel_plans(latitude, longitude);
CREATE INDEX idx_matches_families ON matches(family1_id, family2_id);
CREATE INDEX idx_messages_match_id ON messages(match_id);

-- Enable Row Level Security
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Families can only see their own data
CREATE POLICY "Users can view own family" ON families
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own family" ON families
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own family" ON families
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Travel plans policies
CREATE POLICY "Users can view own travel plans" ON travel_plans
  FOR SELECT USING (
    family_id IN (SELECT id FROM families WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own travel plans" ON travel_plans
  FOR ALL USING (
    family_id IN (SELECT id FROM families WHERE user_id = auth.uid())
  );

-- Matches policies - users can see matches involving their family
CREATE POLICY "Users can view their matches" ON matches
  FOR SELECT USING (
    family1_id IN (SELECT id FROM families WHERE user_id = auth.uid()) OR
    family2_id IN (SELECT id FROM families WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their matches" ON matches
  FOR UPDATE USING (
    family1_id IN (SELECT id FROM families WHERE user_id = auth.uid()) OR
    family2_id IN (SELECT id FROM families WHERE user_id = auth.uid())
  );

-- Messages policies - users can see messages in their matches
CREATE POLICY "Users can view match messages" ON messages
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM matches WHERE 
      family1_id IN (SELECT id FROM families WHERE user_id = auth.uid()) OR
      family2_id IN (SELECT id FROM families WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_family_id IN (SELECT id FROM families WHERE user_id = auth.uid())
  );

-- Add storage bucket and policies for family photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('family-photos', 'family-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for family photos
CREATE POLICY "Family photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'family-photos');

CREATE POLICY "Users can upload their family photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'family-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their family photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'family-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their family photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'family-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
