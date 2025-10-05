-- Form Analyses Table for Smart PDF Form Overlay
CREATE TABLE IF NOT EXISTS form_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  language VARCHAR(5) NOT NULL, -- DE, FR, IT, RM
  language_name VARCHAR(50) NOT NULL, -- German, French, Italian, Romansh
  form_title VARCHAR(255),
  fields JSONB NOT NULL, -- Array of field objects with translations
  pdf_data TEXT NOT NULL, -- Base64 encoded original PDF
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_form_analyses_user_id ON form_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_form_analyses_created_at ON form_analyses(created_at);

-- RLS (Row Level Security) policies
ALTER TABLE form_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own form analyses
CREATE POLICY "Users can access own form analyses" ON form_analyses
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON form_analyses TO authenticated;
GRANT ALL ON form_analyses TO service_role;
