-- Create saved_threads table
CREATE TABLE IF NOT EXISTS public.saved_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
    thread_title TEXT NOT NULL,
    author_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate saves
    UNIQUE(user_id, thread_id)
);

-- Add RLS policies
ALTER TABLE public.saved_threads ENABLE ROW LEVEL SECURITY;

-- Policy for inserting: users can only save threads for themselves
CREATE POLICY saved_threads_insert_policy
    ON public.saved_threads
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy for selecting: users can only see their own saved threads
CREATE POLICY saved_threads_select_policy
    ON public.saved_threads
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy for deleting: users can only delete their own saved threads
CREATE POLICY saved_threads_delete_policy
    ON public.saved_threads
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS saved_threads_user_id_idx ON public.saved_threads (user_id);
