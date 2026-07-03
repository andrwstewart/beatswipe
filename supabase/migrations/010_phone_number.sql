-- Add phone number to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;
