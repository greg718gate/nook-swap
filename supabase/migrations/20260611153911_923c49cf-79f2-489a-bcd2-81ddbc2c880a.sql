
-- 1) Remove open messages_realtime channel; keep per-conversation channels
DROP POLICY IF EXISTS "Authenticated users subscribe to allowed channels" ON realtime.messages;

CREATE POLICY "Authenticated users subscribe to allowed channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() = ('notifications:' || (auth.uid())::text))
  OR (realtime.topic() = 'cart_changes')
  OR (
    (realtime.topic() ~~ like_escape('conversation\_%', '\'))
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.user_id = auth.uid()
        AND (cp.conversation_id)::text = SUBSTRING(realtime.topic() FROM 14)
    )
  )
);

-- 2) Prevent buyers from tampering with financial / Stripe fields on orders
CREATE OR REPLACE FUNCTION public.prevent_buyer_order_field_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Only enforce for the buyer's own update path
  IF auth.uid() IS DISTINCT FROM NEW.buyer_id THEN
    RETURN NEW;
  END IF;

  IF NEW.buyer_id IS DISTINCT FROM OLD.buyer_id
     OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
     OR NEW.stripe_session_id IS DISTINCT FROM OLD.stripe_session_id
     OR NEW.platform_fee IS DISTINCT FROM OLD.platform_fee
     OR NEW.seller_payout IS DISTINCT FROM OLD.seller_payout
     OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
     OR NEW.shipping_cost IS DISTINCT FROM OLD.shipping_cost
     OR NEW.status IS DISTINCT FROM OLD.status
     OR NEW.tracking_number IS DISTINCT FROM OLD.tracking_number
     OR NEW.tracking_url IS DISTINCT FROM OLD.tracking_url
  THEN
    RAISE EXCEPTION 'Buyers cannot modify financial, payment, or fulfillment fields on orders';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_buyer_order_field_changes_trg ON public.orders;
CREATE TRIGGER prevent_buyer_order_field_changes_trg
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.prevent_buyer_order_field_changes();
