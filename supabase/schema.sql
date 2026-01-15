-- Supabase Schema for Whop Zoom Marketplace App
-- Run this in your Supabase SQL Editor to create the required table

CREATE TABLE IF NOT EXISTS company_zoom_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id TEXT UNIQUE NOT NULL,
  account_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  sdk_key TEXT NOT NULL,
  sdk_secret TEXT NOT NULL,
  permanent_meeting_id TEXT,
  default_meeting_title TEXT DEFAULT 'Livestream',
  admin_usernames TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups by company_id
CREATE INDEX IF NOT EXISTS idx_company_zoom_settings_company_id 
ON company_zoom_settings(company_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE company_zoom_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (adjust based on your security needs)
-- For a server-side only app, you might want to use service_role key instead
CREATE POLICY "Allow all operations" ON company_zoom_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);
