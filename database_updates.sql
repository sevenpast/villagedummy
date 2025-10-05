-- Database updates for improved user registration
-- Add gender to users table
ALTER TABLE public.users 
ADD COLUMN gender character varying CHECK (gender IN ('male', 'female', 'other'));

-- Add parent role to children table
ALTER TABLE public.children 
ADD COLUMN parent_role character varying CHECK (parent_role IN ('father', 'mother'));

-- Add index for better performance
CREATE INDEX idx_users_gender ON public.users(gender);
CREATE INDEX idx_children_parent_role ON public.children(parent_role);

-- Update existing users with default values (optional)
-- UPDATE public.users SET gender = 'other' WHERE gender IS NULL;
