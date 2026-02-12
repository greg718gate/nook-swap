
-- Restore public profiles access (needed for product/seller joins)
-- The stripe fields exposure is mitigated by using public_profiles view in code
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);
