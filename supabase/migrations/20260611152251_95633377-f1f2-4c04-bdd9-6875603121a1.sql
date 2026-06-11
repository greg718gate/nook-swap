-- 1) Orders: only service role (Stripe webhook) may insert
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;

-- 2) Purchases: only service role may insert (created by webhook)
DROP POLICY IF EXISTS "Authenticated users can insert purchases" ON public.purchases;

-- 3) Hide digital file paths from public product reads
REVOKE SELECT (digital_file_url, digital_file_name) ON public.products FROM anon, authenticated;

-- 4) Hide Stripe fields from profiles; use public_profiles view for public reads
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

REVOKE SELECT (stripe_account_id, stripe_onboarded) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.public_profiles TO anon, authenticated;