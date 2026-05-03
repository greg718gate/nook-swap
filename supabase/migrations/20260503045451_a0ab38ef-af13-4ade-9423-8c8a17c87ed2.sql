-- Revoke column-level SELECT on the sensitive stripe_account_id column.
-- This works alongside RLS: existing joins on profiles (username, rating, etc.)
-- continue to work, but no client role can read stripe_account_id.
-- Edge functions using SERVICE_ROLE_KEY bypass these grants and keep full access.

REVOKE SELECT (stripe_account_id) ON public.profiles FROM anon, authenticated;

-- Ensure the public_profiles view (which already excludes stripe_account_id)
-- remains the canonical safe surface for public profile reads.
GRANT SELECT ON public.public_profiles TO anon, authenticated;