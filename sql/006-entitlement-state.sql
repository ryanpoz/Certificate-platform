-- Migration: entitlement state (scheduled plan changes, seat/brand limits,
-- top-ups, custom domains). Run in the Supabase SQL Editor AFTER
-- 005-academy-plans.sql (it is repeated here, so running 006 alone also works).
-- Safe to run more than once; additive only (no drops, no deletes).
--
-- The app works before this runs: plans fall back to Free, seats/brands to the
-- plan floor, top-ups to none, and custom domains are simply not looked up.

CREATE TABLE IF NOT EXISTS academy_plans (
  academy_id uuid PRIMARY KEY REFERENCES academies(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'business')),
  custom_limit integer,
  updated_at timestamp NOT NULL DEFAULT now()
);
ALTER TABLE academy_plans ENABLE ROW LEVEL SECURITY;

-- Contract values (Business only; lower plans always use the plan value)
ALTER TABLE academy_plans ADD COLUMN IF NOT EXISTS seat_limit integer;
ALTER TABLE academy_plans ADD COLUMN IF NOT EXISTS brand_limit integer;

-- Downgrades/cancellations are scheduled for the end of the billing period
ALTER TABLE academy_plans ADD COLUMN IF NOT EXISTS pending_plan text
  CHECK (pending_plan IS NULL OR pending_plan IN ('free', 'starter', 'growth', 'business'));
ALTER TABLE academy_plans ADD COLUMN IF NOT EXISTS pending_plan_at timestamptz;
-- End of the period already paid for (set by billing later; if empty, the next
-- monthly anniversary of signup is used)
ALTER TABLE academy_plans ADD COLUMN IF NOT EXISTS billing_period_end timestamptz;

-- Top-ups: extra certificates for the plan year they were bought in
CREATE TABLE IF NOT EXISTS academy_top_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  certificates integer NOT NULL CHECK (certificates > 0),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'manual',
  note text
);
ALTER TABLE academy_top_ups ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_academy_top_ups_academy_purchased
  ON academy_top_ups (academy_id, purchased_at);

-- Custom domains (Business). Requests on a domain whose account no longer
-- includes custom domains are 301-redirected to the same path on our domain.
CREATE TABLE IF NOT EXISTS academy_domains (
  hostname text PRIMARY KEY CHECK (hostname = lower(hostname)),
  academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE academy_domains ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_academy_domains_academy ON academy_domains (academy_id);

-- Examples (run by hand; there is no billing yet):
-- Add a 500-certificate top-up:
--   INSERT INTO academy_top_ups (academy_id, certificates, source) VALUES ('<academy-uuid>', 500, 'manual');
-- Business contract with 12 seats and 3 brands:
--   UPDATE academy_plans SET seat_limit = 12, brand_limit = 3, updated_at = now() WHERE academy_id = '<academy-uuid>';
