-- Migration: expiry reminder emails (Growth and up).
-- Run in the Supabase SQL Editor (after 005 and 006). Safe to run more than
-- once; additive only (no drops, no deletes).
--
-- The app works before this runs: no reminders are sent (the log below is
-- what prevents duplicates, so without it nothing is sent), reminder settings
-- show their default, and the expiring-soon view works (it only reads
-- certificates).

-- On/off per certificate design (program). No row = on (the default).
-- Kept when a plan loses reminders, so it comes back on upgrade.
CREATE TABLE IF NOT EXISTS course_reminder_settings (
  course_id uuid PRIMARY KEY REFERENCES courses(id) ON DELETE CASCADE,
  academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE course_reminder_settings ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_course_reminder_settings_academy ON course_reminder_settings (academy_id);

-- One row per reminder per certificate per expiry date. The unique key is the
-- duplicate guard: a reminder is claimed by inserting its row before sending.
-- If a certificate's expiry date changes, reminders for the new date can go out.
CREATE TABLE IF NOT EXISTS expiry_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
  academy_id uuid NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  days_before integer NOT NULL CHECK (days_before > 0),
  expiry_date timestamp NOT NULL,
  status text NOT NULL DEFAULT 'sending' CHECK (status IN ('sending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 1,
  message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  CONSTRAINT expiry_reminders_once UNIQUE (certificate_id, days_before, expiry_date)
);
ALTER TABLE expiry_reminders ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_expiry_reminders_academy ON expiry_reminders (academy_id, created_at);

-- Helps the daily reminder run and the expiring-soon view
CREATE INDEX IF NOT EXISTS idx_certificates_expiry_date ON certificates (expiry_date)
  WHERE expiry_date IS NOT NULL;

-- Example (run by hand): turn reminders off for one program
--   INSERT INTO course_reminder_settings (course_id, academy_id, enabled)
--   VALUES ('<course-uuid>', '<academy-uuid>', false)
--   ON CONFLICT (course_id) DO UPDATE SET enabled = excluded.enabled, updated_at = now();
