-- Require UK dispatch address before listing products (server-side)

CREATE OR REPLACE FUNCTION public.require_seller_dispatch_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = NEW.seller_id
      AND NULLIF(TRIM(p.dispatch_line1), '') IS NOT NULL
      AND NULLIF(TRIM(p.dispatch_city), '') IS NOT NULL
      AND NULLIF(TRIM(p.dispatch_postcode), '') IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'UK dispatch address required. Complete your profile address before listing items.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS require_seller_dispatch_address_trg ON public.products;
CREATE TRIGGER require_seller_dispatch_address_trg
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.require_seller_dispatch_address();
