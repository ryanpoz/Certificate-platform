-- Migration: Add certificate builder fields to templates table
-- Run this in Supabase SQL Editor before deploying

-- Add new columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT 'Untitled Template',
ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS design_config jsonb,
ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

-- Create index for default template lookup
CREATE INDEX IF NOT EXISTS idx_templates_academy_default ON templates(academy_id, is_default);

-- Create index for template name search
CREATE INDEX IF NOT EXISTS idx_templates_academy_name ON templates(academy_id, name);

-- Update existing templates to have default names based on creation order
UPDATE templates SET name = 'Template ' || ROW_NUMBER() OVER (PARTITION BY academy_id ORDER BY created_at)
WHERE name = 'Untitled Template';

-- Enable RLS on templates table (if not already enabled)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view templates in their academy" ON templates;
DROP POLICY IF EXISTS "Users can create templates in their academy" ON templates;
DROP POLICY IF EXISTS "Users can update templates in their academy" ON templates;
DROP POLICY IF EXISTS "Users can delete templates in their academy" ON templates;

-- Create RLS policies for templates
CREATE POLICY "Users can view templates in their academy"
  ON templates FOR SELECT
  USING (
    academy_id IN (
      SELECT academy_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates in their academy"
  ON templates FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT academy_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates in their academy"
  ON templates FOR UPDATE
  USING (
    academy_id IN (
      SELECT academy_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates in their academy"
  ON templates FOR DELETE
  USING (
    academy_id IN (
      SELECT academy_id FROM users WHERE id = auth.uid()
    )
    AND id NOT IN (
      -- Prevent deleting templates that are in use by courses
      SELECT DISTINCT template_id FROM courses WHERE template_id IS NOT NULL
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON COLUMN templates.name IS 'User-friendly name for the template';
COMMENT ON COLUMN templates.is_default IS 'Whether this is the academy default template for new programs';
COMMENT ON COLUMN templates.design_config IS 'JSON configuration for certificate design (colors, fonts, layout, etc.)';
COMMENT ON COLUMN templates.version IS 'Version number for tracking changes';
COMMENT ON COLUMN templates.updated_at IS 'Timestamp of last update';
