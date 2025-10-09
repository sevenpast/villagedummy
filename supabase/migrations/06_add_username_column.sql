-- Add username column to users table for username-based authentication
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- Create index on username for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);

-- Add constraint to ensure username is not empty if provided
ALTER TABLE public.users 
ADD CONSTRAINT check_username_not_empty 
CHECK (username IS NULL OR length(trim(username)) > 0);

-- Update existing users to have username based on their email
UPDATE public.users 
SET username = split_part(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;
