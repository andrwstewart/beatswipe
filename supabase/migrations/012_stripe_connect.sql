ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_account_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false;
