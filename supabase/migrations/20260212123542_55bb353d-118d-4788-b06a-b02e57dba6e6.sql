
-- 1. FIX: profiles table exposes stripe_account_id publicly
-- Restrict profiles SELECT to only own profile; public access via public_profiles view
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Ensure public_profiles view excludes sensitive stripe fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id, username, full_name, avatar_url, bio, location, rating, total_reviews, created_at
FROM public.profiles;

-- 2. FIX: conversations INSERT policy too permissive (WITH CHECK true)
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. FIX: Add seller access to orders
CREATE POLICY "Sellers can view orders for their products"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.order_items
    WHERE order_items.order_id = orders.id
    AND order_items.seller_id = auth.uid()
  )
);
