
-- WISHLIST
CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own wishlist" ON public.wishlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own wishlist" ON public.wishlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own wishlist" ON public.wishlist_items FOR DELETE USING (auth.uid() = user_id);

-- COUPONS
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  discount_value numeric NOT NULL CHECK (discount_value > 0),
  min_order_amount numeric NOT NULL DEFAULT 0,
  max_uses integer,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coupons are viewable by everyone" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Sellers manage own coupons insert" ON public.coupons FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers manage own coupons update" ON public.coupons FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Sellers manage own coupons delete" ON public.coupons FOR DELETE USING (auth.uid() = seller_id);

CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _seller_id uuid, _subtotal numeric)
RETURNS TABLE(coupon_id uuid, discount numeric, message text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c RECORD; d numeric;
BEGIN
  SELECT * INTO c FROM public.coupons WHERE code = _code AND seller_id = _seller_id AND active = true;
  IF c IS NULL THEN RETURN QUERY SELECT NULL::uuid, 0::numeric, 'Invalid code'::text; RETURN; END IF;
  IF c.expires_at IS NOT NULL AND c.expires_at < now() THEN RETURN QUERY SELECT NULL::uuid, 0::numeric, 'Code expired'::text; RETURN; END IF;
  IF c.max_uses IS NOT NULL AND c.uses_count >= c.max_uses THEN RETURN QUERY SELECT NULL::uuid, 0::numeric, 'Limit reached'::text; RETURN; END IF;
  IF _subtotal < c.min_order_amount THEN RETURN QUERY SELECT NULL::uuid, 0::numeric, 'Minimum not met'::text; RETURN; END IF;
  IF c.discount_type = 'percent' THEN d := round(_subtotal * c.discount_value / 100, 2);
  ELSE d := LEAST(c.discount_value, _subtotal); END IF;
  RETURN QUERY SELECT c.id, d, 'OK'::text;
END; $$;

-- SEARCH INDEX
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON public.products USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_desc_trgm ON public.products USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_price ON public.products (price);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
