-- Create Gemini cache table for storing API results
CREATE TABLE IF NOT EXISTS public.gemini_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  cache_type TEXT NOT NULL, -- 'municipality_website', 'school_website', 'school_authority', 'email_content'
  municipality TEXT NOT NULL,
  canton TEXT NOT NULL,
  result_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_gemini_cache_key ON public.gemini_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_gemini_cache_type ON public.gemini_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_gemini_cache_expires ON public.gemini_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_gemini_cache_location ON public.gemini_cache(municipality, canton);

-- Enable RLS
ALTER TABLE public.gemini_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own cache entries
CREATE POLICY "Users can view own cache entries" ON public.gemini_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache entries" ON public.gemini_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache entries" ON public.gemini_cache
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_gemini_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.gemini_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cached result
CREATE OR REPLACE FUNCTION public.get_gemini_cache(
  p_cache_key TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT result_data INTO result
  FROM public.gemini_cache
  WHERE cache_key = p_cache_key 
    AND user_id = p_user_id
    AND expires_at > NOW();
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set cache result
CREATE OR REPLACE FUNCTION public.set_gemini_cache(
  p_cache_key TEXT,
  p_cache_type TEXT,
  p_municipality TEXT,
  p_canton TEXT,
  p_result_data JSONB,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.gemini_cache (
    cache_key, cache_type, municipality, canton, result_data, user_id
  ) VALUES (
    p_cache_key, p_cache_type, p_municipality, p_canton, p_result_data, p_user_id
  )
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    result_data = EXCLUDED.result_data,
    expires_at = NOW() + INTERVAL '30 days',
    created_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup job (runs daily)
SELECT cron.schedule(
  'cleanup-gemini-cache',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT public.cleanup_expired_gemini_cache();'
);
