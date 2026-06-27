ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tiktok_url    text,
  ADD COLUMN IF NOT EXISTS soundcloud_url text;
