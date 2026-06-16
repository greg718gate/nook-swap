-- Automated shipping labels & tracking (VelvetBazzar)

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
