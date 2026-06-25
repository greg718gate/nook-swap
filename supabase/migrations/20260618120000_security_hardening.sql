-- Security hardening: Phase Shield audit fields, disputes, seller type, message flags

-- Phase Shield enriched audit log
ALTER TABLE public.phase_shield_jitter_log
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ip_masked text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS network_volatile boolean NOT NULL DEFAULT false;

ALTER TABLE public.phase_shield_state
  ADD COLUMN IF NOT EXISTS network_grace_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS network_grace_reset_at timestamptz;

CREATE INDEX IF NOT EXISTS phase_shield_jitter_log_user_idx
  ON public.phase_shield_jitter_log (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Order lifecycle: ghosting timeout + disputes
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS ship_by_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS dispute_status text,
  ADD COLUMN IF NOT EXISTS stripe_dispute_id text,
  ADD COLUMN IF NOT EXISTS auto_release_frozen boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.orders.ship_by_deadline IS 'Seller must dispatch by this date or buyer gets auto-refund';
COMMENT ON COLUMN public.orders.dispute_status IS 'null | open | awaiting_evidence | awaiting_seller | escalated | resolved';

CREATE TABLE IF NOT EXISTS public.order_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN (
      'open', 'awaiting_buyer_evidence', 'awaiting_seller',
      'escalated', 'resolved_buyer', 'resolved_seller', 'closed_no_evidence'
    )),
  reason text NOT NULL,
  buyer_evidence text,
  seller_response text,
  seller_decision text CHECK (seller_decision IS NULL OR seller_decision IN ('accept_return', 'reject')),
  buyer_deadline timestamptz,
  seller_deadline timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_disputes_order ON public.order_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_ship_deadline
  ON public.orders(ship_by_deadline)
  WHERE status = 'paid' AND tracking_number IS NULL;

ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers and sellers can view their disputes" ON public.order_disputes;
CREATE POLICY "Buyers and sellers can view their disputes"
  ON public.order_disputes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_disputes.order_id
      AND (o.buyer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.order_items oi
        WHERE oi.order_id = o.id AND oi.seller_id = auth.uid()
      ))
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- Seller classification (UK Consumer Rights Act / HMRC)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seller_type text NOT NULL DEFAULT 'private'
    CHECK (seller_type IN ('private', 'business'));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seller_type text NOT NULL DEFAULT 'private'
    CHECK (seller_type IN ('private', 'business'));

-- Off-platform message flagging
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS off_platform_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS off_platform_reasons text[];
