-- Migration: Add academy_plans table for usage metering (plan per account)
-- Run this in Supabase SQL Editor. Safe to run more than once; additive only.
-- The app works before this runs: every account is treated as the Free plan
-- until a row exists here.

CREATE TABLE IF NOT EXISTS academy_plans (
  academy_id uuid PRIMARY KEY REFERENCES academies(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'business')),
  custom_limit integer,
  updated_at timestamp NOT NULL DEFAULT now()
);

ALTER TABLE academy_plans ENABLE ROW LEVEL SECURITY;

-- Speeds up per-account usage counts for the current plan year
CREATE INDEX IF NOT EXISTS idx_certificates_academy_published
  ON certificates (academy_id, published_at);

CREATE INDEX IF NOT EXISTS idx_events_academy_type_at
  ON events (academy_id, type, at);

-- Example: move an account to Starter
-- INSERT INTO academy_plans (academy_id, plan) VALUES ('<academy-uuid>', 'starter')
--   ON CONFLICT (academy_id) DO UPDATE SET plan = EXCLUDED.plan, updated_at = now();
