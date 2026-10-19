-- Migration: Add draft support for wizard
-- Run this in Supabase SQL Editor before deploying

-- Add draft_data column to courses table for storing wizard state
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS draft_data jsonb;

-- Add index for finding drafts
CREATE INDEX IF NOT EXISTS idx_courses_draft_data ON courses USING gin (draft_data) WHERE draft_data IS NOT NULL;

COMMENT ON COLUMN courses.draft_data IS 'Wizard draft state: name, design_config, step, recipients, etc. NULL when certificate is published.';
