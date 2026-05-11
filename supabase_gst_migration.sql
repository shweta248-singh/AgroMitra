-- ==============================
-- GST Migration: Add GST columns to profiles table
-- Run this in your Supabase SQL Editor
-- ==============================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS gst_number text,
ADD COLUMN IF NOT EXISTS gst_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS business_name text,
ADD COLUMN IF NOT EXISTS gst_verified_at timestamptz;

-- Optional: Create a dedicated seller GST verifications log table
CREATE TABLE IF NOT EXISTS public.seller_gst_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  gst_number text,
  business_name text,
  gst_verified boolean DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.seller_gst_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (backend uses service role key)
CREATE POLICY "Service role full access on seller_gst_verifications"
ON public.seller_gst_verifications
FOR ALL
USING (true)
WITH CHECK (true);
