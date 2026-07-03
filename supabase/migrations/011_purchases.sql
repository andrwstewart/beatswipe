-- Add price to beats (stored in cents; 0 = free)
ALTER TABLE beats ADD COLUMN IF NOT EXISTS price_cents integer NOT NULL DEFAULT 0;

-- Purchases table — records every completed paid download
CREATE TABLE IF NOT EXISTS purchases (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id               uuid NOT NULL REFERENCES beats(id) ON DELETE CASCADE,
  buyer_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  producer_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_session_id     text NOT NULL UNIQUE,
  amount_cents          integer NOT NULL,
  producer_amount_cents integer NOT NULL,
  platform_amount_cents integer NOT NULL,
  status                text NOT NULL DEFAULT 'pending',
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own purchases"
  ON purchases FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Producers can view sales of their beats"
  ON purchases FOR SELECT USING (producer_id = auth.uid());
