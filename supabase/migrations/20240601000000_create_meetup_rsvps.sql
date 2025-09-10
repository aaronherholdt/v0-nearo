-- Create meetup_rsvps table
CREATE TABLE IF NOT EXISTS public.meetup_rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meetup_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate RSVPs
    UNIQUE(user_id, meetup_id)
);

-- Add RLS policies
ALTER TABLE public.meetup_rsvps ENABLE ROW LEVEL SECURITY;

-- Policy for inserting: users can only RSVP for themselves
CREATE POLICY meetup_rsvps_insert_policy
    ON public.meetup_rsvps
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy for selecting: users can see all RSVPs
CREATE POLICY meetup_rsvps_select_policy
    ON public.meetup_rsvps
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for deleting: users can only delete their own RSVPs
CREATE POLICY meetup_rsvps_delete_policy
    ON public.meetup_rsvps
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS meetup_rsvps_user_id_idx ON public.meetup_rsvps (user_id);
CREATE INDEX IF NOT EXISTS meetup_rsvps_meetup_id_idx ON public.meetup_rsvps (meetup_id);
