-- SQL Script to create the newsletter_subscribers table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (so the frontend can insert)
CREATE POLICY "Allow anonymous inserts to newsletter_subscribers"
    ON public.newsletter_subscribers
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Allow authenticated admins to view/update/delete
CREATE POLICY "Allow authenticated read access to newsletter_subscribers"
    ON public.newsletter_subscribers
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated delete access to newsletter_subscribers"
    ON public.newsletter_subscribers
    FOR DELETE
    TO authenticated
    USING (true);
