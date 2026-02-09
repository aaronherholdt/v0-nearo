-- Create notification-related tables

CREATE TABLE IF NOT EXISTS public.user_notification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'web',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS user_notification_tokens_user_id_idx
    ON public.user_notification_tokens (user_id);

CREATE INDEX IF NOT EXISTS user_notification_tokens_platform_idx
    ON public.user_notification_tokens (platform);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT,
    type TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    seen_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx
    ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS notifications_created_at_idx
    ON public.notifications (created_at);

-- Enable RLS
ALTER TABLE public.user_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: user_notification_tokens
CREATE POLICY user_notification_tokens_insert_policy
    ON public.user_notification_tokens
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_notification_tokens_select_policy
    ON public.user_notification_tokens
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY user_notification_tokens_update_policy
    ON public.user_notification_tokens
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY user_notification_tokens_delete_policy
    ON public.user_notification_tokens
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies: notifications
CREATE POLICY notifications_insert_policy
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY notifications_select_policy
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY notifications_update_policy
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY notifications_delete_policy
    ON public.notifications
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
