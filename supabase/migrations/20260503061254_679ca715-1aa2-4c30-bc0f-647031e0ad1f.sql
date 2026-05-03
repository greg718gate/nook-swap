
-- 1) PURCHASES: remove public INSERT, restrict UPDATE columns
DROP POLICY IF EXISTS "Authenticated users can insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "Buyers can update their purchases" ON public.purchases;

-- No INSERT policy = only service role (webhook) can insert.
-- No UPDATE policy = buyers can never directly mutate purchases (download counter is bumped by RPC under SECURITY DEFINER).

-- 2) DIGITAL FILES: hide sensitive columns from public/auth roles
REVOKE SELECT (digital_file_url, digital_file_name) ON public.products FROM anon, authenticated;

-- RPC to atomically check download limit + return file path
CREATE OR REPLACE FUNCTION public.request_digital_download(_purchase_id uuid)
RETURNS TABLE(file_url text, file_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchase RECORD;
  v_product RECORD;
BEGIN
  SELECT * INTO v_purchase FROM public.purchases
   WHERE id = _purchase_id AND buyer_id = auth.uid()
   FOR UPDATE;

  IF v_purchase IS NULL THEN
    RAISE EXCEPTION 'Purchase not found or access denied';
  END IF;

  IF v_purchase.download_count >= COALESCE(v_purchase.max_downloads, 5) THEN
    RAISE EXCEPTION 'Download limit reached';
  END IF;

  SELECT digital_file_url, digital_file_name, product_type
    INTO v_product FROM public.products WHERE id = v_purchase.product_id;

  IF v_product.product_type <> 'digital' OR v_product.digital_file_url IS NULL THEN
    RAISE EXCEPTION 'Not a digital product';
  END IF;

  UPDATE public.purchases
     SET download_count = download_count + 1
   WHERE id = _purchase_id;

  RETURN QUERY SELECT v_product.digital_file_url, v_product.digital_file_name;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.request_digital_download(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.request_digital_download(uuid) TO authenticated;

-- 3) STORAGE: tighten product-images policies (folder = user_id)
DROP POLICY IF EXISTS "Users can delete their own product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;

CREATE POLICY "Users can upload their own product images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own product images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4) ORDERS: restrict seller updates to fulfillment fields only
CREATE OR REPLACE FUNCTION public.prevent_seller_order_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins and the buyer themselves can do anything (covered by their own RLS)
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;
  IF auth.uid() = NEW.buyer_id THEN
    RETURN NEW;
  END IF;

  -- Otherwise this is a seller update — block changes to sensitive fields
  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
     OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
     OR NEW.seller_payout IS DISTINCT FROM OLD.seller_payout
     OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
     OR NEW.shipping_cost IS DISTINCT FROM OLD.shipping_cost
     OR NEW.shipping_address IS DISTINCT FROM OLD.shipping_address
  THEN
    RAISE EXCEPTION 'Sellers cannot modify financial or buyer fields on orders';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_seller_order_field_changes ON public.orders;
CREATE TRIGGER trg_prevent_seller_order_field_changes
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.prevent_seller_order_field_changes();
