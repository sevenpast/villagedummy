-- ============================================================================
-- ADD POSTAL CODE AND CANTON FIELDS TO USER_PROFILES
-- ============================================================================

-- Add postal code field
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);

-- Add canton field (if not already exists)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS canton VARCHAR(100);

-- Add municipality field (if not already exists)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS municipality VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_postal_code ON public.user_profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_canton ON public.user_profiles(canton);
CREATE INDEX IF NOT EXISTS idx_user_profiles_municipality ON public.user_profiles(municipality);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('postal_code', 'canton', 'municipality');

-- Success message
SELECT 'SUCCESS:' as status, 'Postal code and canton fields added to user_profiles!' as message;
