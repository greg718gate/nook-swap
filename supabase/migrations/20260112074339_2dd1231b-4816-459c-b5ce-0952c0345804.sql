-- Drop the view and recreate with SECURITY INVOKER (default, explicit for clarity)
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  bio,
  location,
  rating,
  total_reviews,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;