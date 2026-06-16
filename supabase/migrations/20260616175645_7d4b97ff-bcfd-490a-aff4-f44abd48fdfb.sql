ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS shipping_label_url text,
  ADD COLUMN IF NOT EXISTS shipment_id text,
  ADD COLUMN IF NOT EXISTS shipment_status text DEFAULT 'pending';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dispatch_name text,
  ADD COLUMN IF NOT EXISTS dispatch_line1 text,
  ADD COLUMN IF NOT EXISTS dispatch_line2 text,
  ADD COLUMN IF NOT EXISTS dispatch_city text,
  ADD COLUMN IF NOT EXISTS dispatch_postcode text,
  ADD COLUMN IF NOT EXISTS dispatch_country text DEFAULT 'GB';

COMMENT ON COLUMN public.orders.shipment_status IS 'pending | label_ready | in_transit | delivered | failed';

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